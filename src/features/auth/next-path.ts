// Nom du paramètre d'adresse qui garde la page demandée avant la connexion : /connexion?suivant=/plats
export const NEXT_PARAM = "suivant";

// Pages accessibles sans être connectée.
export const AUTH_PATHS = ["/connexion", "/inscription"];
export const PUBLIC_PATHS = [...AUTH_PATHS, "/statut"];

// N'accepte qu'une adresse interne à l'app ("/plats"), jamais "//autre-site.com" ni "https://…" :
// sinon un lien piégé pourrait renvoyer vers un autre site après la connexion.
export function safeNextPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/";
  }
  return value;
}

// Ajoute la page demandée à une adresse, pour la garder en passant de la connexion à l'inscription.
export function withNext(path: string, nextPath: string) {
  return nextPath === "/" ? path : `${path}?${new URLSearchParams({ [NEXT_PARAM]: nextPath })}`;
}
