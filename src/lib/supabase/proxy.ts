import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { supabaseEnv } from "./env";

// Rafraîchit la session Supabase à chaque requête et réécrit les cookies.
// C'est ce qui garde l'utilisatrice connectée quand elle ferme puis rouvre l'app.
export async function updateSession(request: NextRequest) {
  const { url, publishableKey } = supabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Les nouveaux cookies vont à la fois dans la requête (pour les pages rendues ensuite)
        // et dans la réponse (pour que le navigateur les garde).
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Ne rien mettre entre createServerClient et getUser : c'est getUser qui déclenche le rafraîchissement.
  await supabase.auth.getUser();

  return response;
}
