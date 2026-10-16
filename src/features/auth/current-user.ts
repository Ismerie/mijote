import { createClient } from "@/lib/supabase/server";

// Renvoie l'utilisatrice connectée, ou null. getUser vérifie la session auprès de Supabase.
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}
