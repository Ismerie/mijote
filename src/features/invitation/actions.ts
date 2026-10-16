"use server";

import { redirect } from "next/navigation";

import { getCurrentHousehold } from "@/features/household/current-household";
import { MAX_FIRST_NAME_LENGTH } from "@/features/household/household-fields";
import { createClient } from "@/lib/supabase/server";

export type CreateInvitationResult = { code: string } | { error: string };

// Crée un lien d'invitation pour le foyer de l'utilisatrice (#8). Le lien est valable 7 jours, une seule fois.
export async function createInvitation(): Promise<CreateInvitationResult> {
  const household = await getCurrentHousehold();
  if (!household) return { error: "Tu dois appartenir à un foyer pour inviter quelqu'un." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_invitation", { p_household_id: household.id });
  if (error || !data) return { error: "La création du lien a échoué, réessaie dans un instant." };

  return { code: data as string };
}

export type AcceptInvitationState = { error?: string; firstName?: string };

// Messages pour les erreurs renvoyées par accept_invitation (#4).
const ACCEPT_ERRORS: Record<string, string> = {
  invitation_not_found: "Ce lien d'invitation n'existe pas.",
  invitation_already_used: "Ce lien a déjà été utilisé. Demande un nouveau lien.",
  invitation_expired: "Ce lien a expiré. Demande un nouveau lien.",
  already_in_household: "Tu fais déjà partie d'un foyer : un compte ne peut appartenir qu'à un seul foyer.",
};

export async function acceptInvitation(
  _prev: AcceptInvitationState,
  formData: FormData,
): Promise<AcceptInvitationState> {
  const code = String(formData.get("code") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  if (!firstName || firstName.length > MAX_FIRST_NAME_LENGTH) {
    return { error: `Saisis ton prénom (${MAX_FIRST_NAME_LENGTH} caractères maximum).`, firstName };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_invitation", { p_code: code, p_first_name: firstName });

  if (error) {
    const known = Object.keys(ACCEPT_ERRORS).find((key) => error.message.includes(key));
    return { error: known ? ACCEPT_ERRORS[known] : "Impossible de rejoindre le foyer, réessaie dans un instant.", firstName };
  }

  redirect("/");
}
