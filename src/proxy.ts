import type { NextRequest } from "next/server";

import { AUTH_PATHS, NEXT_PARAM, PUBLIC_PATHS } from "@/features/auth/next-path";
import { redirectWithCookies, updateSession } from "@/lib/supabase/proxy";

// Tourne avant chaque page : rafraîchit la session et protège l'app (#6).
export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  // Pas connectée et page protégée : direction la connexion, en retenant la page demandée.
  if (!user && !PUBLIC_PATHS.includes(pathname)) {
    const login = new URL("/connexion", request.url);
    if (pathname !== "/") login.searchParams.set(NEXT_PARAM, pathname + search);
    return redirectWithCookies(login, response);
  }

  // Déjà connectée : les écrans de connexion et d'inscription n'ont plus de sens.
  if (user && AUTH_PATHS.includes(pathname)) {
    return redirectWithCookies(new URL("/", request.url), response);
  }

  return response;
}

export const config = {
  matcher: [
    // Toutes les pages, sauf les fichiers statiques et les images.
    "/((?!_next/static|_next/image|favicon.ico|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest)$).*)",
  ],
};
