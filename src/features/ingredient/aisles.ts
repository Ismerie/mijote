// Rayons du magasin : liste fixe en V1, la même que le type `aisle` de la base, dans l'ordre du magasin.
export const AISLES = [
  { value: "produce", label: "Fruits et légumes" },
  { value: "meat", label: "Boucherie" },
  { value: "dairy", label: "Crèmerie" },
  { value: "grocery", label: "Épicerie" },
  { value: "frozen", label: "Surgelés" },
  { value: "other", label: "Autre" },
] as const;

export type Aisle = (typeof AISLES)[number]["value"];

export const DEFAULT_AISLE: Aisle = "other";

export function isAisle(value: unknown): value is Aisle {
  return AISLES.some((aisle) => aisle.value === value);
}

export function aisleLabel(aisle: Aisle): string {
  return AISLES.find((a) => a.value === aisle)?.label ?? aisle;
}
