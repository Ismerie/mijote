// Unités d'une ligne de recette : liste fermée, la même que le type `unit` de la base (#25).
// value = ce qui est stocké, label = ce qui est affiché.
export const UNITS = [
  { value: "g", label: "g" },
  { value: "kg", label: "kg" },
  { value: "ml", label: "ml" },
  { value: "cl", label: "cl" },
  { value: "l", label: "l" },
  { value: "tsp", label: "c. à c." },
  { value: "tbsp", label: "c. à s." },
  { value: "piece", label: "pièce" },
] as const;

export type Unit = (typeof UNITS)[number]["value"];

export const DEFAULT_UNIT: Unit = "g";

export function isUnit(value: unknown): value is Unit {
  return UNITS.some((unit) => unit.value === value);
}

export function unitLabel(unit: Unit): string {
  return UNITS.find((u) => u.value === unit)?.label ?? unit;
}
