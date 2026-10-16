import { createClient } from "@/lib/supabase/server";

export type InvitationStatus = "valid" | "expired" | "used";
export type InvitationPreview = { householdName: string; status: InvitationStatus };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Nom du foyer et état du lien, pour la personne invitée (#8). null si le code n'existe pas.
export async function getInvitation(code: string): Promise<InvitationPreview | null> {
  if (!UUID.test(code)) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_invitation", { p_code: code }).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const row = data as { household_name: string; status: InvitationStatus };
  return { householdName: row.household_name, status: row.status };
}
