import { cache } from "react";

import { getCurrentUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";

export type CurrentHousehold = {
  id: string;
  name: string;
  defaultServings: number;
  role: "admin" | "member";
  firstName: string;
};

// Foyer de l'utilisatrice connectée, ou null si elle n'en a pas encore (#7).
// cache() évite de refaire la requête quand le layout et la page la demandent pendant le même affichage.
export const getCurrentHousehold = cache(async (): Promise<CurrentHousehold | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();

  // Un compte n'appartient qu'à un seul foyer en V1.
  const { data, error } = await supabase
    .from("member")
    .select("role, first_name, household (id, name, default_servings)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data?.household) return null;

  const household = data.household as unknown as { id: string; name: string; default_servings: number };
  return {
    id: household.id,
    name: household.name,
    defaultServings: household.default_servings,
    role: data.role,
    firstName: data.first_name,
  };
});
