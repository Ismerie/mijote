"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentHousehold } from "@/features/household/current-household";
import { createClient } from "@/lib/supabase/server";

import { readIngredientForm, validateIngredient } from "./ingredient-fields";
import { getIngredient } from "./queries";
import { INGREDIENTS_PATH, isIngredientReturnPath } from "./return-path";

export type SaveIngredientState = { error?: string };

// Crée (ingredientId null) ou modifie un ingrédient du catalogue (#26).
// returnPath : la page où revenir ensuite, le catalogue ou les courses (#32).
export async function saveIngredient(
  ingredientId: string | null,
  returnPath: string | null,
  _prev: SaveIngredientState,
  formData: FormData,
): Promise<SaveIngredientState> {
  const { input, error: invalid } = validateIngredient(readIngredientForm(formData));
  if (!input) return { error: invalid };

  const household = await getCurrentHousehold();
  if (!household) return { error: "Tu n'as pas encore de foyer." };

  const row = {
    name: input.name,
    aisle: input.aisle,
    purchase_mode: input.purchaseMode,
    pack_name: input.packName,
    pack_size: input.packSize,
    pack_unit: input.packUnit,
    always_in_stock: input.alwaysInStock,
  };

  const supabase = await createClient();
  const { error } = ingredientId
    ? await supabase.from("ingredient").update(row).eq("household_id", household.id).eq("id", ingredientId)
    : await supabase.from("ingredient").insert({ ...row, household_id: household.id });

  // 23505 : un autre ingrédient du foyer porte déjà ce nom (à la casse près).
  if (error?.code === "23505") return { error: `« ${input.name} » existe déjà dans tes ingrédients.` };
  if (error) return { error: "L'enregistrement a échoué, réessaie dans un instant." };

  revalidatePath("/plats", "layout");
  // « Toujours en stock » ou la façon d'acheter changent la liste de courses.
  revalidatePath("/courses");
  redirect(returnPath && isIngredientReturnPath(returnPath) ? returnPath : INGREDIENTS_PATH);
}

// Supprime un ingrédient, seulement s'il n'est utilisé dans aucun plat (#26).
// La base le garantit (clé étrangère « restrict ») ; ici on renvoie un message avec le nom des plats.
export async function deleteIngredient(ingredientId: string): Promise<{ error?: string }> {
  const household = await getCurrentHousehold();
  if (!household) return { error: "Tu n'as pas encore de foyer." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("ingredient")
    .delete()
    .eq("household_id", household.id)
    .eq("id", ingredientId);

  // 23503 : un plat l'utilise (peut-être ajouté depuis un autre téléphone entre-temps).
  if (error?.code === "23503") {
    const ingredient = await getIngredient(household.id, ingredientId);
    const names = ingredient?.dishNames.join(", ");
    return {
      error: names
        ? `Impossible de le supprimer : il est utilisé dans ${names}.`
        : "Impossible de le supprimer : il est utilisé par un plat supprimé, qui reste dans les anciens menus.",
    };
  }
  if (error) return { error: "La suppression a échoué, réessaie dans un instant." };

  revalidatePath("/plats", "layout");
  redirect("/plats/ingredients");
}
