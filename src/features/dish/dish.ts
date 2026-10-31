import type { Unit } from "@/features/ingredient/units";

// Un plat dans la liste de Plats.
export type DishSummary = {
  id: string;
  name: string;
  servings: number;
  kcal: number | null;
};

// Une ligne d'ingrédients de la fiche du plat.
export type DishIngredientLine = {
  ingredientId: string;
  name: string;
  quantity: number | null;
  unit: Unit;
};

// La fiche complète d'un plat.
export type Dish = DishSummary & {
  recipe: string;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  ingredients: DishIngredientLine[];
};
