"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentHousehold } from "@/features/household/current-household";
import { createClient } from "@/lib/supabase/server";

import { readDishForm, validateDish } from "./dish-fields";

export type SaveDishState = { error?: string };

// Crée un plat (dishId null) ou le modifie, avec ses ingrédients (#25).
// save_dish fait tout en une transaction : le plat, les nouveaux ingrédients et les lignes.
export async function saveDish(dishId: string | null, _prev: SaveDishState, formData: FormData): Promise<SaveDishState> {
  const { input, error: invalid } = validateDish(readDishForm(formData));
  if (!input) return { error: invalid };

  const household = await getCurrentHousehold();
  if (!household) return { error: "Tu n'as pas encore de foyer." };

  const supabase = await createClient();
  const { data: savedId, error } = await supabase.rpc("save_dish", {
    p_household_id: household.id,
    p_dish_id: dishId,
    p_name: input.name,
    p_servings: input.servings,
    p_recipe: input.recipe,
    p_kcal: input.kcal,
    p_protein: input.protein,
    p_carbs: input.carbs,
    p_fat: input.fat,
    p_lines: input.lines,
  });

  if (error?.message.includes("dish_not_found")) return { error: "Ce plat n'existe plus." };
  if (error) return { error: "L'enregistrement a échoué, réessaie dans un instant." };

  revalidatePath("/plats", "layout");
  redirect(`/plats/${savedId}`);
}

// Supprime un plat en douceur (#25) : il disparaît de Plats, mais reste dans les menus où il est déjà.
export async function archiveDish(dishId: string): Promise<{ error?: string }> {
  const household = await getCurrentHousehold();
  if (!household) return { error: "Tu n'as pas encore de foyer." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("dish")
    .update({ archived_at: new Date().toISOString() })
    .eq("household_id", household.id)
    .eq("id", dishId)
    .is("archived_at", null);

  if (error) return { error: "La suppression a échoué, réessaie dans un instant." };

  revalidatePath("/plats", "layout");
  redirect("/plats");
}
