// Portions et découpe en repas (modèle de données, décision 7).

// « 1 portion », « 4 portions »
export function portionsLabel(servings: number): string {
  return `${servings} portion${servings > 1 ? "s" : ""}`;
}

// Découpe les portions d'une recette en repas de « nombre de personnes » portions ;
// le reste fait un repas à part : 5 portions à 2 → [2, 2, 1]. Même règle que add_dishes_to_menu.
export function splitServings(servings: number, peopleCount: number): number[] {
  const meals: number[] = [];
  for (let left = servings; left > 0; left -= peopleCount) meals.push(Math.min(left, peopleCount));
  return meals;
}

// Ligne d'une recette dans le récapitulatif « Combien de fois la recette ? » :
// « 2 cartes de 4 portions → 2 repas pour 2 », « 5 portions → 2 repas pour 2 + 1 portion ».
export function describeSplit(servings: number, times: number, peopleCount: number): string {
  const cards = times > 1 ? `${times} cartes de ` : "";
  const fullMeals = Math.floor(servings / peopleCount);
  const rest = servings % peopleCount;
  if (fullMeals === 0) return `${cards}${portionsLabel(servings)} → 1 repas`;
  return `${cards}${portionsLabel(servings)} → ${fullMeals} repas pour ${peopleCount}${rest ? ` + ${portionsLabel(rest)}` : ""}`;
}
