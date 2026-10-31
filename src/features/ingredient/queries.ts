import { createClient } from "@/lib/supabase/server";

import { INGREDIENT_COLUMNS, toIngredient, type Ingredient, type IngredientRow } from "./ingredient";

// Un ingrédient avec les plats qui l'utilisent (#26).
export type IngredientWithUsage = Ingredient & {
  // Plats encore dans Plats qui l'utilisent, par ordre alphabétique.
  dishNames: string[];
  // Utilisé par au moins un plat, même supprimé : la base refuse alors sa suppression.
  usedByAnyDish: boolean;
};

type UsageRow = IngredientRow & {
  dish_ingredient: { dish: { id: string; name: string; archived_at: string | null } }[];
};

function withUsage(row: UsageRow): IngredientWithUsage {
  const active = new Map<string, string>();
  for (const line of row.dish_ingredient) {
    if (!line.dish.archived_at) active.set(line.dish.id, line.dish.name);
  }
  return {
    ...toIngredient(row),
    dishNames: [...active.values()].sort((a, b) => a.localeCompare(b, "fr")),
    usedByAnyDish: row.dish_ingredient.length > 0,
  };
}

const USAGE_COLUMNS = `${INGREDIENT_COLUMNS}, dish_ingredient (dish (id, name, archived_at))`;

// Catalogue d'ingrédients du foyer, par ordre alphabétique (#25 : autocomplétion dans la fiche d'un plat).
export async function listIngredients(householdId: string): Promise<Ingredient[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ingredient")
    .select(INGREDIENT_COLUMNS)
    .eq("household_id", householdId)
    .order("name");

  if (error) throw error;
  return (data as IngredientRow[]).map(toIngredient);
}

// Catalogue avec les plats qui utilisent chaque ingrédient, pour l'écran Ingrédients (#26).
export async function listIngredientsWithUsage(householdId: string): Promise<IngredientWithUsage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ingredient")
    .select(USAGE_COLUMNS)
    .eq("household_id", householdId)
    .order("name");

  if (error) throw error;
  return (data as unknown as UsageRow[]).map(withUsage);
}

// Un ingrédient du foyer et les plats qui l'utilisent, ou null s'il n'existe pas.
export async function getIngredient(householdId: string, ingredientId: string): Promise<IngredientWithUsage | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ingredient")
    .select(USAGE_COLUMNS)
    .eq("household_id", householdId)
    .eq("id", ingredientId)
    .maybeSingle();

  // 22P02 : l'adresse ne contient pas un identifiant valide, c'est comme un ingrédient introuvable.
  if (error?.code === "22P02") return null;
  if (error) throw error;
  return data ? withUsage(data as unknown as UsageRow) : null;
}
