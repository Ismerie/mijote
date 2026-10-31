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

// Façon d'acheter, en quelques mots : « au poids », « en pièces », « boîte de 400 g ».
export function describePurchase(ingredient: Pick<Ingredient, "purchaseMode" | "packName" | "packSize" | "packUnit">): string {
  switch (ingredient.purchaseMode) {
    case "piece":
      return "en pièces";
    case "pack":
      if (ingredient.packName && ingredient.packSize !== null && ingredient.packUnit) {
        const size =
          ingredient.packUnit === "piece"
            ? `${formatNumber(ingredient.packSize)} pièces`
            : formatQuantity(ingredient.packSize, ingredient.packUnit);
        return `${ingredient.packName} de ${size}`;
      }
      return "en paquet";
    default:
      return "au poids";
  }
}
