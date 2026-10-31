"use server";

import { revalidatePath } from "next/cache";

import { getCurrentHousehold } from "@/features/household/current-household";
import { createClient } from "@/lib/supabase/server";

import { isMeasure, type Measure } from "./shopping-list";

type Result = { error?: string };

const FAILED = "Le changement a échoué, réessaie dans un instant.";

// Cocher ou décocher une ligne de courses (#32). La coche est partagée entre les membres du foyer.
export async function setShoppingCheck(
  menuId: string,
  ingredientId: string,
  measure: Measure,
  checked: boolean,
): Promise<Result> {
  if (!isMeasure(measure)) return { error: FAILED };

  const household = await getCurrentHousehold();
  if (!household) return { error: "Tu n'as pas encore de foyer." };

  const supabase = await createClient();
  const { error } = checked
    ? // Déjà cochée sur un autre téléphone : rien à faire.
      await supabase
        .from("shopping_check")
        .upsert(
          { household_id: household.id, menu_id: menuId, ingredient_id: ingredientId, measure },
          { onConflict: "menu_id,ingredient_id,measure", ignoreDuplicates: true },
        )
    : await supabase
        .from("shopping_check")
        .delete()
        .eq("household_id", household.id)
        .eq("menu_id", menuId)
        .eq("ingredient_id", ingredientId)
        .eq("measure", measure);

  if (error) return { error: FAILED };

  revalidatePath("/courses");
  return {};
}

// « Courses terminées » : les fournées du menu sont marquées achetées et la liste se vide (#32).
export async function finishShopping(menuId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("finish_shopping", { p_menu_id: menuId });

  if (error?.message.includes("menu_not_found")) return { error: "Ce menu n'existe plus." };
  if (error) return { error: FAILED };

  revalidatePath("/courses");
  return {};
}
