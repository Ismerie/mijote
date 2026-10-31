import { isAisle, type Aisle } from "@/features/ingredient/aisles";
import { formatNumber } from "@/features/ingredient/format";
import { DEFAULT_UNIT, isUnit, type Unit } from "@/features/ingredient/units";

import type { Dish } from "./dish";

// Mêmes limites que les contraintes des tables dish et dish_ingredient (#25).
export const MAX_DISH_NAME_LENGTH = 80;
export const MIN_SERVINGS = 1;
export const MAX_SERVINGS = 50;
export const DEFAULT_SERVINGS = 4;
export const MAX_RECIPE_LENGTH = 10000;
export const MAX_INGREDIENT_NAME_LENGTH = 80;
const MAX_QUANTITY = 999999;
const MAX_MACRO = 9999;

// Une ligne d'ingrédient telle que saisie dans le formulaire (textes bruts).
export type DishLineValues = {
  name: string;
  quantity: string;
  unit: Unit;
  // Rayon choisi quand l'ingrédient est créé depuis le plat ; ignoré s'il existe déjà.
  aisle?: Aisle;
};

// Le formulaire d'un plat, champs en texte comme dans les inputs.
export type DishFormValues = {
  name: string;
  servings: string;
  recipe: string;
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
  lines: DishLineValues[];
};

// Les données validées, prêtes pour save_dish.
export type DishInput = {
  name: string;
  servings: number;
  recipe: string;
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  lines: { name: string; quantity: number | null; unit: Unit; aisle?: Aisle }[];
};

export const EMPTY_DISH_VALUES: DishFormValues = {
  name: "",
  servings: String(DEFAULT_SERVINGS),
  recipe: "",
  kcal: "",
  protein: "",
  carbs: "",
  fat: "",
  lines: [],
};

// Valeurs du formulaire « Modifier le plat », depuis la fiche.
export function dishToFormValues(dish: Dish): DishFormValues {
  const text = (value: number | null) => (value === null ? "" : String(value).replace(".", ","));
  return {
    name: dish.name,
    servings: String(dish.servings),
    recipe: dish.recipe,
    kcal: text(dish.kcal),
    protein: text(dish.protein),
    carbs: text(dish.carbs),
    fat: text(dish.fat),
    lines: dish.ingredients.map((line) => ({ name: line.name, quantity: text(line.quantity), unit: line.unit })),
  };
}

// « 1,5 » ou « 1.5 » → 1.5 ; vide → null ; illisible → NaN.
export function parseDecimal(text: string): number | null {
  const trimmed = text.trim().replace(",", ".");
  if (!trimmed) return null;
  return /^\d+(\.\d+)?$/.test(trimmed) ? Number(trimmed) : Number.NaN;
}

// Lit le formulaire envoyé : les lignes d'ingrédients arrivent en JSON dans le champ caché « lines ».
export function readDishForm(formData: FormData): DishFormValues {
  const text = (key: string) => String(formData.get(key) ?? "");
  let lines: DishLineValues[] = [];
  try {
    const raw: unknown = JSON.parse(text("lines") || "[]");
    if (Array.isArray(raw)) {
      lines = raw.map((line) => ({
        name: String(line?.name ?? ""),
        quantity: String(line?.quantity ?? ""),
        unit: isUnit(line?.unit) ? line.unit : DEFAULT_UNIT,
        aisle: isAisle(line?.aisle) ? line.aisle : undefined,
      }));
    }
  } catch {
    // Champ caché abîmé : on le traite comme une liste vide, la validation passe quand même.
  }
  return {
    name: text("name"),
    servings: text("servings"),
    recipe: text("recipe"),
    kcal: text("kcal"),
    protein: text("protein"),
    carbs: text("carbs"),
    fat: text("fat"),
    lines,
  };
}

type Result = { input: DishInput; error?: undefined } | { input?: undefined; error: string };

// Vérifie le formulaire et renvoie les données propres, ou un message d'erreur à afficher.
export function validateDish(values: DishFormValues): Result {
  const name = values.name.trim();
  if (!name || name.length > MAX_DISH_NAME_LENGTH) {
    return { error: `Donne un nom au plat (${MAX_DISH_NAME_LENGTH} caractères maximum).` };
  }

  const servings = Number(values.servings.trim());
  if (!values.servings.trim() || !Number.isInteger(servings) || servings < MIN_SERVINGS || servings > MAX_SERVINGS) {
    return { error: `Le nombre de portions doit être entre ${MIN_SERVINGS} et ${MAX_SERVINGS}.` };
  }

  if (values.recipe.length > MAX_RECIPE_LENGTH) {
    return { error: `La recette est trop longue (${formatNumber(MAX_RECIPE_LENGTH)} caractères maximum).` };
  }

  const macros = { kcal: "Calories", protein: "Protéines", carbs: "Glucides", fat: "Lipides" } as const;
  const parsedMacros: Partial<Record<keyof typeof macros, number | null>> = {};
  for (const key of Object.keys(macros) as (keyof typeof macros)[]) {
    const value = parseDecimal(values[key]);
    if (value !== null && (Number.isNaN(value) || value > MAX_MACRO)) {
      return { error: `${macros[key]} : saisis un nombre positif, ou laisse vide.` };
    }
    parsedMacros[key] = value;
  }

  const lines: DishInput["lines"] = [];
  for (const line of values.lines) {
    const lineName = line.name.trim();
    // Une ligne restée vide est simplement ignorée.
    if (!lineName && !line.quantity.trim()) continue;
    if (!lineName) return { error: "Chaque quantité doit avoir un nom d'ingrédient." };
    if (lineName.length > MAX_INGREDIENT_NAME_LENGTH) {
      return { error: `« ${lineName.slice(0, 20)}… » : ${MAX_INGREDIENT_NAME_LENGTH} caractères maximum.` };
    }
    const quantity = parseDecimal(line.quantity);
    if (quantity !== null && (Number.isNaN(quantity) || quantity <= 0 || quantity > MAX_QUANTITY)) {
      return { error: `${lineName} : la quantité doit être un nombre positif, ou vide.` };
    }
    lines.push({ name: lineName, quantity, unit: line.unit, ...(line.aisle ? { aisle: line.aisle } : {}) });
  }

  return {
    input: {
      name,
      servings,
      recipe: values.recipe.trim(),
      kcal: parsedMacros.kcal ?? null,
      protein: parsedMacros.protein ?? null,
      carbs: parsedMacros.carbs ?? null,
      fat: parsedMacros.fat ?? null,
      lines,
    },
  };
}

// Sous-titre d'un plat dans la liste : « 4 portions · 610 kcal par portion ».
export function describeDish({ servings, kcal }: { servings: number; kcal: number | null }): string {
  const portions = `${servings} portion${servings > 1 ? "s" : ""}`;
  return kcal === null ? portions : `${portions} · ${formatNumber(kcal)} kcal par portion`;
}
