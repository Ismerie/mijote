"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { getCurrentHousehold } from "./current-household";
import {
  readHouseholdFields,
  validatePeopleCount,
  validateHouseholdFields,
  type HouseholdFields,
} from "./household-fields";

export type CreateHouseholdState = {
  error?: string;
  fields?: HouseholdFields;
};

export async function createHousehold(
  _prev: CreateHouseholdState,
  formData: FormData,
): Promise<CreateHouseholdState> {
  const fields = readHouseholdFields(formData);
  const invalid = validateHouseholdFields(fields);
  if (invalid) return { error: invalid, fields };

  const supabase = await createClient();
  // create_household (#4) crée le foyer et y ajoute l'utilisatrice comme administratrice, en une seule opération.
  const { error } = await supabase.rpc("create_household", {
    p_name: fields.name,
    p_people_count: fields.peopleCount,
    p_first_name: fields.firstName,
  });

  // Déjà dans un foyer (double clic, autre onglet…) : rien à créer, on va à l'accueil.
  if (error && !error.message.includes("already_in_household")) {
    return { error: "La création du foyer a échoué, réessaie dans un instant.", fields };
  }

  redirect("/");
}

// Règle le nombre de personnes du foyer (#9). Les règles RLS (tout membre peut modifier le foyer) s'appliquent.
export async function updatePeopleCount(peopleCount: number): Promise<{ error?: string }> {
  const invalid = validatePeopleCount(peopleCount);
  if (invalid) return { error: invalid };

  const household = await getCurrentHousehold();
  if (!household) return { error: "Tu n'as pas encore de foyer." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("household")
    .update({ people_count: peopleCount })
    .eq("id", household.id);

  if (error) return { error: "Le changement a échoué, réessaie dans un instant." };

  revalidatePath("/", "layout");
  return {};
}
