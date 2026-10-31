import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

// Le lien de l'email arrive ici avec un code à usage unique (#43).
// On l'échange contre une session, puis on envoie la personne choisir son nouveau mot de passe.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL("/nouveau-mot-de-passe", origin));
    }
  }

  // Lien expiré, déjà utilisé, ou ouvert sur un autre navigateur que celui qui l'a demandé.
  return NextResponse.redirect(new URL("/mot-de-passe-oublie?lien=invalide", origin));
}
