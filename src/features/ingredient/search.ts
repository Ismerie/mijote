// Recherche dans le catalogue d'ingrédients, pour l'autocomplétion de la fiche d'un plat (#25).

// « Bœuf » et « boeuf », « Épices » et « epices » se retrouvent.
export function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .toLowerCase()
    .trim();
}

// Les ingrédients dont le nom contient le texte tapé, ceux qui commencent par lui en premier.
export function searchByName<T extends { name: string }>(items: T[], query: string, limit = 6): T[] {
  const q = normalizeName(query);
  if (!q) return [];

  const matches = items.filter((item) => normalizeName(item.name).includes(q));
  const startsFirst = (item: T) => (normalizeName(item.name).startsWith(q) ? 0 : 1);
  return matches
    .sort((a, b) => startsFirst(a) - startsFirst(b) || a.name.localeCompare(b.name, "fr"))
    .slice(0, limit);
}

// L'ingrédient qui porte exactement ce nom, à la casse près (c'est la règle de la base), ou undefined.
export function findByExactName<T extends { name: string }>(items: T[], name: string): T | undefined {
  const target = name.trim().toLowerCase();
  if (!target) return undefined;
  return items.find((item) => item.name.trim().toLowerCase() === target);
}
