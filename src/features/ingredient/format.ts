import type { Ingredient } from "./ingredient";
import { unitLabel, type Unit } from "./units";

const numberFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });

// 1.5 → « 1,5 », à la française.
export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

// Quantité d'une ligne de recette : « 250 g », « 2 c. à s. », et « 1 » pour une pièce (comme sur la maquette).
// Sans quantité (« sel, poivre »), rien n'est affiché.
export function formatQuantity(quantity: number | null, unit: Unit): string {
  if (quantity === null) return "";
  if (unit === "piece") return formatNumber(quantity);
  return `${formatNumber(quantity)} ${unitLabel(unit)}`;
}

// Façon d'acheter, comme dans l'écran Ingrédients : « Au poids ou au volume », « À la pièce », « Boîte de 400 g ».
export function describePurchase(ingredient: Pick<Ingredient, "purchaseMode" | "packName" | "packSize" | "packUnit">): string {
  switch (ingredient.purchaseMode) {
    case "piece":
      return "À la pièce";
    case "pack": {
      const { packName, packSize, packUnit } = ingredient;
      if (!packName || packSize === null || !packUnit) return "En paquet";
      const size = packUnit === "piece" ? `${formatNumber(packSize)} pièces` : formatQuantity(packSize, packUnit);
      return `${packName.charAt(0).toUpperCase()}${packName.slice(1)} de ${size}`;
    }
    default:
      return "Au poids ou au volume";
  }
}
