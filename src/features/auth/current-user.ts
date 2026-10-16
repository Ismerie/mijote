import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

// Renvoie l'utilisatrice connectée, ou null. getUser vérifie la session auprès de Supabase.
// cache() : une seule vérification par affichage, même si plusieurs composants la demandent.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
});
