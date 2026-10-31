// Un plat choisi dans « Ajouter au menu », et combien de fois sa recette (× N).
export type Addition = { dishId: string; times: number };

export const MAX_TIMES = 10;
// Garde-fou : pas plus de fournées d'un coup que ce qu'un menu de 2 semaines peut raisonnablement contenir.
const MAX_MENU_DISHES = 50;

// Transforme le choix en liste d'ids, un par fournée et dans l'ordre (Lasagnes × 2 = deux fois l'id),
// comme l'attend add_dishes_to_menu. Renvoie null si le choix est vide ou invalide.
export function validateAdditions(additions: Addition[]): string[] | null {
  if (!Array.isArray(additions) || additions.length === 0) return null;
  const dishIds: string[] = [];
  for (const { dishId, times } of additions) {
    if (typeof dishId !== "string" || !dishId) return null;
    if (!Number.isInteger(times) || times < 1 || times > MAX_TIMES) return null;
    for (let i = 0; i < times; i++) dishIds.push(dishId);
  }
  return dishIds.length <= MAX_MENU_DISHES ? dishIds : null;
}
