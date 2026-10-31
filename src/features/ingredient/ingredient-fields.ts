import { parseDecimal } from "@/lib/decimal";

import { DEFAULT_AISLE, isAisle, type Aisle } from "./aisles";
import type { Ingredient, PurchaseMode } from "./ingredient";
import { isUnit, type Unit } from "./units";

// Mêmes limites que les contraintes de la table ingredient (#25).
export const MAX_INGREDIENT_NAME_LENGTH = 80;
export const MAX_PACK_NAME_LENGTH = 30;
const MAX_PACK_SIZE = 999999;

// Unités proposées pour la contenance d'un paquet.
export const PACK_UNITS: Unit[] = ["g", "kg", "ml", "l", "piece"];

// Valeurs proposées quand on passe à « En paquet » (comme la maquette).
export const DEFAULT_PACK = { packName: "paquet", packSize: "500", packUnit: "g" as Unit };

const PURCHASE_MODES: PurchaseMode[] = ["weight", "piece", "pack"];

// La fiche ingrédient telle que saisie (textes bruts).
export type IngredientFormValues = {
  name: string;
  aisle: Aisle;
  purchaseMode: PurchaseMode;
  packName: string;
  packSize: string;
  packUnit: Unit;
  alwaysInStock: boolean;
};

// Les données validées, prêtes pour la base. Hors paquet, les champs du paquet sont vides.
export type IngredientInput = {
  name: string;
  aisle: Aisle;
  purchaseMode: PurchaseMode;
  packName: string | null;
  packSize: number | null;
  packUnit: Unit | null;
  alwaysInStock: boolean;
};

export const EMPTY_INGREDIENT_VALUES: IngredientFormValues = {
  name: "",
  aisle: DEFAULT_AISLE,
  purchaseMode: "weight",
  packName: "",
  packSize: "",
  packUnit: "g",
  alwaysInStock: false,
};

export function ingredientToFormValues(ingredient: Ingredient): IngredientFormValues {
  return {
    name: ingredient.name,
    aisle: ingredient.aisle,
    purchaseMode: ingredient.purchaseMode,
    packName: ingredient.packName ?? "",
    packSize: ingredient.packSize === null ? "" : String(ingredient.packSize).replace(".", ","),
    packUnit: ingredient.packUnit ?? "g",
    alwaysInStock: ingredient.alwaysInStock,
  };
}

export function readIngredientForm(formData: FormData): IngredientFormValues {
  const text = (key: string) => String(formData.get(key) ?? "");
  const purchaseMode = PURCHASE_MODES.find((mode) => mode === text("purchaseMode")) ?? "weight";
  return {
    name: text("name"),
    aisle: isAisle(text("aisle")) ? (text("aisle") as Aisle) : DEFAULT_AISLE,
    purchaseMode,
    packName: text("packName"),
    packSize: text("packSize"),
    packUnit: isUnit(text("packUnit")) ? (text("packUnit") as Unit) : "g",
    alwaysInStock: text("alwaysInStock") === "true",
  };
}

type Result = { input: IngredientInput; error?: undefined } | { input?: undefined; error: string };

// Vérifie la fiche et renvoie les données propres, ou un message d'erreur à afficher (#26).
export function validateIngredient(values: IngredientFormValues): Result {
  const name = values.name.trim();
  if (!name || name.length > MAX_INGREDIENT_NAME_LENGTH) {
    return { error: `Donne un nom à l'ingrédient (${MAX_INGREDIENT_NAME_LENGTH} caractères maximum).` };
  }

  const base = { name, aisle: values.aisle, purchaseMode: values.purchaseMode, alwaysInStock: values.alwaysInStock };
  if (values.purchaseMode !== "pack") {
    return { input: { ...base, packName: null, packSize: null, packUnit: null } };
  }

  const packName = values.packName.trim();
  if (!packName || packName.length > MAX_PACK_NAME_LENGTH) {
    return { error: `Nomme le paquet : boîte, sachet, brique… (${MAX_PACK_NAME_LENGTH} caractères maximum).` };
  }
  const packSize = parseDecimal(values.packSize);
  if (packSize === null || Number.isNaN(packSize) || packSize <= 0 || packSize > MAX_PACK_SIZE) {
    return { error: "Indique ce que contient le paquet, par exemple 400." };
  }
  return { input: { ...base, packName, packSize, packUnit: values.packUnit } };
}

// Texte d'aide sous le paquet : « Dans la liste : le nombre de boîtes, arrondi au-dessus. »
export function packHint(packName: string): string {
  return `Dans la liste : le nombre de ${packName.trim() || "paquet"}s, arrondi au-dessus.`;
}
