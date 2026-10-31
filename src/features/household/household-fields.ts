// Mêmes limites que les contraintes de la table household et member (#4).
export const DEFAULT_PEOPLE_COUNT = 2;
export const MIN_PEOPLE_COUNT = 1;
export const MAX_PEOPLE_COUNT = 20;
export const MAX_HOUSEHOLD_NAME_LENGTH = 80;
export const MAX_FIRST_NAME_LENGTH = 40;

export type HouseholdFields = { firstName: string; name: string; peopleCount: number };

export function readHouseholdFields(formData: FormData): HouseholdFields {
  return {
    firstName: String(formData.get("firstName") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    peopleCount: Number(formData.get("peopleCount")),
  };
}

// Renvoie un message d'erreur à afficher, ou null si le nombre de personnes est valide (#9).
export function validatePeopleCount(peopleCount: number): string | null {
  if (!Number.isInteger(peopleCount) || peopleCount < MIN_PEOPLE_COUNT || peopleCount > MAX_PEOPLE_COUNT) {
    return `Le nombre de personnes doit être entre ${MIN_PEOPLE_COUNT} et ${MAX_PEOPLE_COUNT}.`;
  }
  return null;
}

// Renvoie un message d'erreur à afficher, ou null si les champs sont valides.
export function validateHouseholdFields({ firstName, name, peopleCount }: HouseholdFields): string | null {
  if (!firstName || firstName.length > MAX_FIRST_NAME_LENGTH) {
    return `Saisis ton prénom (${MAX_FIRST_NAME_LENGTH} caractères maximum).`;
  }
  if (!name || name.length > MAX_HOUSEHOLD_NAME_LENGTH) {
    return `Donne un nom à ton foyer (${MAX_HOUSEHOLD_NAME_LENGTH} caractères maximum).`;
  }
  return validatePeopleCount(peopleCount);
}
