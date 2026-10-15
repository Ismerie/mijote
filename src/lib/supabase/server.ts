import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { supabaseEnv } from "./env";

// Client Supabase pour le code serveur (Server Components, Server Functions, Route Handlers).
// Il lit la session de l'utilisatrice dans les cookies de la requête.
export async function createClient() {
  // cookies() en premier : la page devient dynamique et n'est pas exécutée pendant le build.
  const cookieStore = await cookies();
  const { url, publishableKey } = supabaseEnv();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Un Server Component ne peut pas écrire de cookies. Sans conséquence ici :
          // le rafraîchissement de session se fera dans le proxy, ajouté avec la connexion (#5).
        }
      },
    },
  });
}
