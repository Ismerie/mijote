"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { readHouseholdFields, validateHouseholdFields, type HouseholdFields } from "./household-fields";

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
    p_default_servings: fields.defaultServings,
    p_first_name: fields.firstName,
  });

  // Déjà dans un foyer (double clic, autre onglet…) : rien à créer, on va à l'accueil.
  if (error && !error.message.includes("already_in_household")) {
    return { error: "La création du foyer a échoué, réessaie dans un instant.", fields };
  }

  redirect("/");
}
