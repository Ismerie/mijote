import { cache } from "react";

import { getCurrentUser } from "@/features/auth/current-user";
import { createClient } from "@/lib/supabase/server";

export type CurrentHousehold = {
  id: string;
  name: string;
  peopleCount: number;
  // Jour des courses (0 = lundi) et durée par défaut d'un menu, en jours (#28).
  shoppingDay: number;
  menuLengthDays: number;
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
    .select("role, first_name, household (id, name, people_count, shopping_day, menu_length_days)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data?.household) return null;

  const household = data.household as unknown as {
    id: string;
    name: string;
    people_count: number;
    shopping_day: number;
    menu_length_days: number;
  };
  return {
    id: household.id,
    name: household.name,
    peopleCount: household.people_count,
    shoppingDay: household.shopping_day,
    menuLengthDays: household.menu_length_days,
    role: data.role,
    firstName: data.first_name,
  };
});
