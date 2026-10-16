import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

// Tourne avant chaque page. Pour l'instant il ne redirige personne :
// renvoyer vers la connexion quand on n'est pas connectée, c'est #6.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Toutes les pages, sauf les fichiers statiques et les images.
    "/((?!_next/static|_next/image|favicon.ico|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest)$).*)",
  ],
};
