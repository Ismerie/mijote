import { createClient } from "@/lib/supabase/server";

import { INGREDIENT_COLUMNS, toIngredient, type Ingredient, type IngredientRow } from "./ingredient";

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
