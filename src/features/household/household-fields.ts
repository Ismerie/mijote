// Mêmes limites que les contraintes de la table household et member (#4).
export const DEFAULT_SERVINGS = 2;
export const MIN_SERVINGS = 1;
export const MAX_SERVINGS = 20;
export const MAX_HOUSEHOLD_NAME_LENGTH = 80;
export const MAX_FIRST_NAME_LENGTH = 40;

export type HouseholdFields = { firstName: string; name: string; defaultServings: number };

export function readHouseholdFields(formData: FormData): HouseholdFields {
  return {
    firstName: String(formData.get("firstName") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    defaultServings: Number(formData.get("defaultServings")),
  };
}

// Renvoie un message d'erreur à afficher, ou null si les champs sont valides.
export function validateHouseholdFields({ firstName, name, defaultServings }: HouseholdFields): string | null {
  if (!firstName || firstName.length > MAX_FIRST_NAME_LENGTH) {
    return `Saisis ton prénom (${MAX_FIRST_NAME_LENGTH} caractères maximum).`;
  }
  if (!name || name.length > MAX_HOUSEHOLD_NAME_LENGTH) {
    return `Donne un nom à ton foyer (${MAX_HOUSEHOLD_NAME_LENGTH} caractères maximum).`;
  }
  if (!Number.isInteger(defaultServings) || defaultServings < MIN_SERVINGS || defaultServings > MAX_SERVINGS) {
    return `Le nombre de portions doit être entre ${MIN_SERVINGS} et ${MAX_SERVINGS}.`;
  }
  return null;
}
