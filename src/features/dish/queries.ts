import { createClient } from "@/lib/supabase/server";
import type { Unit } from "@/features/ingredient/units";

import type { Dish, DishSummary } from "./dish";

const toNumber = (value: number | string | null) => (value === null ? null : Number(value));

// Plats du foyer encore dans Plats (pas supprimés), par ordre alphabétique.
export async function listDishes(householdId: string): Promise<DishSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dish")
    .select("id, name, servings, kcal")
    .eq("household_id", householdId)
    .is("archived_at", null)
    .order("name");

  if (error) throw error;
  return data.map((row) => ({ id: row.id, name: row.name, servings: row.servings, kcal: toNumber(row.kcal) }));
}

type DishIngredientRow = {
  quantity: number | string | null;
  unit: Unit;
  position: number;
  ingredient: { id: string; name: string };
};

// Fiche complète d'un plat du foyer, avec ses ingrédients dans l'ordre, ou null s'il n'existe pas
// (ou plus : un plat supprimé ne s'ouvre plus depuis Plats).
export async function getDish(householdId: string, dishId: string): Promise<Dish | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dish")
    .select(
      "id, name, servings, recipe, kcal, protein, carbs, fat, dish_ingredient (quantity, unit, position, ingredient (id, name))",
    )
    .eq("household_id", householdId)
    .eq("id", dishId)
    .is("archived_at", null)
    .maybeSingle();

  // 22P02 : l'adresse ne contient pas un identifiant valide, c'est comme un plat introuvable.
  if (error?.code === "22P02") return null;
  if (error) throw error;
  if (!data) return null;

  const lines = [...(data.dish_ingredient as unknown as DishIngredientRow[])].sort((a, b) => a.position - b.position);
  return {
    id: data.id,
    name: data.name,
    servings: data.servings,
    recipe: data.recipe,
    kcal: toNumber(data.kcal),
    protein: toNumber(data.protein),
    carbs: toNumber(data.carbs),
    fat: toNumber(data.fat),
    ingredients: lines.map((line) => ({
      ingredientId: line.ingredient.id,
      name: line.ingredient.name,
      quantity: toNumber(line.quantity),
      unit: line.unit,
    })),
  };
}
