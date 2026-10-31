import { createClient } from "@/lib/supabase/server";

export type HouseholdMember = {
  userId: string;
  firstName: string;
  role: "admin" | "member";
};

// Membres du foyer, dans l'ordre d'arrivée. La RLS ne renvoie que ceux du foyer de la personne connectée.
export async function getHouseholdMembers(householdId: string): Promise<HouseholdMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("member")
    .select("user_id, first_name, role")
    .eq("household_id", householdId)
    .order("joined_at");

  if (error) throw error;

  return data.map((member) => ({
    userId: member.user_id,
    firstName: member.first_name,
    role: member.role,
  }));
}
