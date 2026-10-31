import { AISLES, type Aisle } from "@/features/ingredient/aisles";
import { formatNumber, formatQuantity } from "@/features/ingredient/format";
import type { Ingredient } from "@/features/ingredient/ingredient";
import type { Unit } from "@/features/ingredient/units";

// Une ligne de la liste additionne les quantités d'un ingrédient dans une même « mesure » :
// g et kg ensemble (mass), ml, cl et l ensemble (volume), cuillères et pièces à part.
// Même liste que la colonne shopping_check.measure de la base.
export type Measure = "mass" | "volume" | "tsp" | "tbsp" | "piece";

// Mesure d'une unité, et combien d'unités de base (g, ml, cuillère, pièce) elle vaut.
const UNIT_MEASURES: Record<Unit, { measure: Measure; factor: number }> = {
  g: { measure: "mass", factor: 1 },
  kg: { measure: "mass", factor: 1000 },
  ml: { measure: "volume", factor: 1 },
  cl: { measure: "volume", factor: 10 },
  l: { measure: "volume", factor: 1000 },
  tsp: { measure: "tsp", factor: 1 },
  tbsp: { measure: "tbsp", factor: 1 },
  piece: { measure: "piece", factor: 1 },
};

// Pour compter des bouteilles d'huile : une cuillère à café = 5 ml, une cuillère à soupe = 15 ml.
const SPOON_ML: Partial<Record<Measure, number>> = { tsp: 5, tbsp: 15 };

export function isMeasure(value: unknown): value is Measure {
  return typeof value === "string" && Object.values(UNIT_MEASURES).some((item) => item.measure === value);
}

// Ce qui identifie une ligne, pour la cocher (shopping_check : ingrédient + mesure).
export function lineKey(ingredientId: string, measure: Measure): string {
  return `${ingredientId}:${measure}`;
}

// Une fournée à acheter : le nom de son plat et ses lignes d'ingrédients.
export type BatchToBuy = {
  dishName: string;
  lines: { ingredient: Ingredient; quantity: number | null; unit: Unit }[];
};

export type ShoppingLine = {
  key: string;
  ingredientId: string;
  measure: Measure;
  name: string;
  aisle: Aisle;
  // Plats qui l'utilisent, sans doublon, dans l'ordre du menu.
  dishNames: string[];
  // Ce qu'on achète : « 1 kg », « 3 boîtes », « 4 » ; vide si aucune quantité n'est donnée (sel, poivre).
  quantity: string;
  // Sous la quantité, pour un achat en paquet : « 1 kg utilisés ».
  detail: string;
  checked: boolean;
};

export type ShoppingGroup = { aisle: Aisle; label: string; lines: ShoppingLine[] };

export type ShoppingList = {
  groups: ShoppingGroup[];
  lineCount: number;
  checkedCount: number;
  // Ingrédients des plats laissés de côté parce que « toujours en stock » (#26).
  inStockNames: string[];
};

// Tolérance des arrondis au-dessus : 800 g en boîtes de 400 g font 2 boîtes, pas 3.
const EPSILON = 1e-6;

const ceil = (value: number) => Math.ceil(value - EPSILON);

// Quantité en unités de base, affichée lisiblement : 1500 g → « 1,5 kg », 250 ml → « 250 ml ».
export function formatAmount(amount: number, measure: Measure): string {
  switch (measure) {
    case "mass":
      return amount >= 1000 ? formatQuantity(amount / 1000, "kg") : formatQuantity(amount, "g");
    case "volume":
      return amount >= 1000 ? formatQuantity(amount / 1000, "l") : formatQuantity(amount, "ml");
    case "piece":
      return formatNumber(ceil(amount));
    default:
      return formatQuantity(amount, measure);
  }
}

// « boîte » → « boîtes », mais « pois » reste « pois ».
export function packLabel(packName: string, count: number): string {
  const name = packName.trim();
  return `${count} ${count > 1 && !/[sxz]$/i.test(name) ? `${name}s` : name}`;
}

// Ce qu'on achète pour une quantité totale (en unités de base) d'un ingrédient.
// En paquet, arrondi au paquet au-dessus : 1 kg de tomates en boîtes de 400 g → « 3 boîtes », « 1 kg utilisés ».
export function purchaseQuantity(
  ingredient: Pick<Ingredient, "purchaseMode" | "packName" | "packSize" | "packUnit">,
  amount: number | null,
  measure: Measure,
): { quantity: string; detail: string } {
  if (amount === null) return { quantity: "", detail: "" };

  const { purchaseMode, packName, packSize, packUnit } = ingredient;
  if (purchaseMode === "pack" && packName && packSize && packUnit) {
    const pack = UNIT_MEASURES[packUnit];
    const packAmount = packSize * pack.factor;
    // Les cuillères se comptent en bouteilles si le paquet est un volume.
    const needed = pack.measure === measure ? amount : pack.measure === "volume" ? amount * (SPOON_ML[measure] ?? NaN) : NaN;
    if (Number.isFinite(needed)) {
      return { quantity: packLabel(packName, ceil(needed / packAmount)), detail: `${formatAmount(amount, measure)} utilisés` };
    }
  }

  // Au poids, au volume ou à la pièce (ou paquet dans une autre mesure que la recette) : la quantité de la recette.
  return { quantity: formatAmount(amount, measure), detail: "" };
}

// La liste de courses d'un menu (#32) : les ingrédients des fournées à acheter, additionnés par ingrédient
// et mesure (Lasagnes × 2 = deux fournées, donc deux fois les ingrédients), groupés par rayon dans l'ordre
// du magasin puis par nom. Les ingrédients « toujours en stock » n'y sont jamais.
// Les fournées reportées ou déjà achetées ne doivent pas être passées ici.
export function buildShoppingList(batches: BatchToBuy[], checkedKeys: ReadonlySet<string>): ShoppingList {
  type Total = { ingredient: Ingredient; measure: Measure; amount: number | null; dishNames: string[] };
  const totals = new Map<string, Total>();
  const inStock = new Set<string>();

  for (const batch of batches) {
    for (const line of batch.lines) {
      if (line.ingredient.alwaysInStock) {
        inStock.add(line.ingredient.name);
        continue;
      }
      const { measure, factor } = UNIT_MEASURES[line.unit];
      const key = lineKey(line.ingredient.id, measure);
      const total = totals.get(key) ?? { ingredient: line.ingredient, measure, amount: null, dishNames: [] };
      if (line.quantity !== null) total.amount = (total.amount ?? 0) + line.quantity * factor;
      if (!total.dishNames.includes(batch.dishName)) total.dishNames.push(batch.dishName);
      totals.set(key, total);
    }
  }

  const lines: ShoppingLine[] = [...totals.entries()].map(([key, total]) => ({
    key,
    ingredientId: total.ingredient.id,
    measure: total.measure,
    name: total.ingredient.name,
    aisle: total.ingredient.aisle,
    dishNames: total.dishNames,
    ...purchaseQuantity(total.ingredient, total.amount, total.measure),
    checked: checkedKeys.has(key),
  }));

  const groups = AISLES.map(({ value, label }) => ({
    aisle: value,
    label,
    lines: lines.filter((line) => line.aisle === value).sort((a, b) => a.name.localeCompare(b.name, "fr")),
  })).filter((group) => group.lines.length > 0);

  return {
    groups,
    lineCount: lines.length,
    checkedCount: lines.filter((line) => line.checked).length,
    inStockNames: [...inStock].sort((a, b) => a.localeCompare(b, "fr")),
  };
}

// « 18 articles, 0 coché »
export function shoppingSummary(list: Pick<ShoppingList, "lineCount" | "checkedCount">): string {
  const { lineCount, checkedCount } = list;
  return `${lineCount} article${lineCount > 1 ? "s" : ""}, ${checkedCount} coché${checkedCount > 1 ? "s" : ""}`;
}
