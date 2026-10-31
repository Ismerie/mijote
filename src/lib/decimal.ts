// « 1,5 » ou « 1.5 » → 1.5 ; vide → null ; illisible ou négatif → NaN.
// Partagé par les formulaires des plats et des ingrédients.
export function parseDecimal(text: string): number | null {
  const trimmed = text.trim().replace(",", ".");
  if (!trimmed) return null;
  return /^\d+(\.\d+)?$/.test(trimmed) ? Number(trimmed) : Number.NaN;
}
