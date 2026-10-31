"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentHousehold } from "@/features/household/current-household";
import { createClient } from "@/lib/supabase/server";

import { lastShoppingDay, todayInParis } from "./dates";
import { isMealSlot, type MealSlot, type MenuDishState } from "./menu";
import { MAX_TIMES, validateAdditions, type Addition } from "./menu-fields";

type Result = { error?: string };

const FAILED = "Le changement a échoué, réessaie dans un instant.";

// Ajoute les plats choisis au menu, en une seule fois (#28). menuId null : le premier menu du foyer
// est créé, il commence au dernier jour des courses passé.
export async function addDishesToMenu(menuId: string | null, additions: Addition[]): Promise<Result> {
  const dishIds = validateAdditions(additions);
  if (!dishIds) return { error: `Choisis au moins un plat, de 1 à ${MAX_TIMES} fois.` };

  const household = await getCurrentHousehold();
  if (!household) return { error: "Tu n'as pas encore de foyer." };

  const supabase = await createClient();
  const { data: savedMenuId, error } = await supabase.rpc("add_dishes_to_menu", {
    p_household_id: household.id,
    p_menu_id: menuId,
    p_start_date: menuId ? null : lastShoppingDay(todayInParis(), household.shoppingDay),
    p_length_days: menuId ? null : household.menuLengthDays,
    p_dish_ids: dishIds,
  });

  if (error?.message.includes("dish_not_found")) return { error: "Un des plats n'existe plus." };
  if (error?.message.includes("menu_not_found")) return { error: "Ce menu n'existe plus." };
  if (error) return { error: "L'ajout a échoué, réessaie dans un instant." };

  revalidatePath("/", "layout");
  redirect(`/?menu=${savedMenuId}`);
}

// La case ronde d'un plat au menu : à cuisiner, cuisiné ou tout mangé (#28).
export async function setMenuDishState(menuDishId: string, state: MenuDishState): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_menu_dish_state", { p_menu_dish_id: menuDishId, p_state: state });
  if (error) return { error: FAILED };

  revalidatePath("/", "layout");
  return {};
}

// La case carrée « mangé » d'un repas. Manger un repas d'un plat pas cuisiné le marque cuisiné (#28).
export async function setMealEaten(mealId: string, eaten: boolean): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_meal_eaten", { p_meal_id: mealId, p_eaten: eaten });
  if (error) return { error: FAILED };

  revalidatePath("/", "layout");
  return {};
}

// « Retirer ce plat du menu » : la fournée et ses repas disparaissent (#28).
export async function removeMenuDish(menuDishId: string, menuId: string): Promise<Result> {
  const household = await getCurrentHousehold();
  if (!household) return { error: "Tu n'as pas encore de foyer." };

  const supabase = await createClient();
  const { error } = await supabase.from("menu_dish").delete().eq("household_id", household.id).eq("id", menuDishId);
  if (error) return { error: FAILED };

  revalidatePath("/", "layout");
  redirect(`/?menu=${menuId}`);
}

// Place un repas sur un jour et un moment, tous deux facultatifs (#29).
export async function placeMeal(mealId: string, date: string | null, slot: MealSlot | null): Promise<Result> {
  if (slot !== null && !isMealSlot(slot)) return { error: FAILED };
  const supabase = await createClient();
  const { error } = await supabase.rpc("place_meal", { p_meal_id: mealId, p_date: date, p_slot: slot });
  if (error?.message.includes("date_outside_menu")) return { error: "Ce jour ne fait pas partie du menu." };
  if (error) return { error: FAILED };

  revalidatePath("/", "layout");
  return {};
}

// « Séparer ce repas » : servings portions partent dans un nouveau repas sans jour (#29).
export async function splitMeal(mealId: string, servings: number): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("split_meal", { p_meal_id: mealId, p_servings: servings });
  if (error) return { error: FAILED };

  revalidatePath("/", "layout");
  return {};
}

// « Retirer ce repas du menu », puis retour à l'écran d'où on vient (#29) : la fiche du plat au menu
// s'il a encore des repas, sinon la vue Par jour.
export async function removeMeal(mealId: string, menuId: string, fromMenuDishId: string | null): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_meal", { p_meal_id: mealId });
  if (error) return { error: FAILED };

  revalidatePath("/", "layout");
  if (fromMenuDishId) {
    const { data } = await supabase.from("menu_dish").select("id").eq("id", fromMenuDishId).maybeSingle();
    if (data) redirect(`/menu/plat/${fromMenuDishId}`);
  }
  redirect(`/?menu=${menuId}&vue=jour`);
}
