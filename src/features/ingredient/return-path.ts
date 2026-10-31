// La fiche ingrédient s'ouvre depuis le catalogue (#26) ou depuis ⋯ sur une ligne de courses (#32) :
// le retour et « OK » ramènent là d'où l'on vient.

export const INGREDIENTS_PATH = "/plats/ingredients";

const MENU_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Adresse de retour d'après ?depuis=courses&menu=<id> ; le catalogue sinon.
export function ingredientReturnPath(from: unknown, menuId: unknown): string {
  if (from !== "courses") return INGREDIENTS_PATH;
  return typeof menuId === "string" && MENU_ID.test(menuId) ? `/courses?menu=${menuId}` : "/courses";
}

// Seules ces adresses sont acceptées par l'action d'enregistrement : jamais une adresse venue d'ailleurs.
export function isIngredientReturnPath(path: string): boolean {
  return path === INGREDIENTS_PATH || path === "/courses" || /^\/courses\?menu=[0-9a-f-]{36}$/i.test(path);
}
