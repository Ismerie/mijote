// Dates du menu, en jours du calendrier (« 2026-10-24 »), sans heure ni fuseau.
// Les calculs passent par UTC pour qu'un changement d'heure ne décale jamais un jour.

const DAY_MS = 86_400_000;

const WEEKDAYS_SHORT = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const WEEKDAYS_LONG = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MONTHS_SHORT = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

// Jours des courses, dans l'ordre du réglage (0 = lundi), comme sur la maquette du Foyer.
export const SHOPPING_DAY_LABELS = ["Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam.", "Dim."] as const;
export const MENU_LENGTHS = [7, 14] as const;
export type MenuLength = (typeof MENU_LENGTHS)[number];

export function isMenuLength(value: unknown): value is MenuLength {
  return MENU_LENGTHS.includes(value as MenuLength);
}

function toDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Le jour qu'il est (ou qu'il était) à Paris : le foyer vit en France, et le serveur tourne en UTC.
export function dayInParis(moment: Date | string): string {
  // « en-CA » écrit les dates au format 2026-10-24.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date(moment));
}

export function todayInParis(now: Date = new Date()): string {
  return dayInParis(now);
}

export function addDays(iso: string, days: number): string {
  return toIso(new Date(toDate(iso).getTime() + days * DAY_MS));
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toDate(to).getTime() - toDate(from).getTime()) / DAY_MS);
}

// Jour de la semaine, 0 = lundi … 6 = dimanche, comme household.shopping_day.
export function weekday(iso: string): number {
  return (toDate(iso).getUTCDay() + 6) % 7;
}

// Dernier jour des courses passé (aujourd'hui compris) : début du premier menu (#28).
export function lastShoppingDay(today: string, shoppingDay: number): string {
  return addDays(today, -((weekday(today) - shoppingDay + 7) % 7));
}

// Premier jour des courses à partir de la fin du menu (le lendemain de son dernier jour) : début du menu suivant (#30).
export function nextMenuStart(start: string, lengthDays: number, shoppingDay: number): string {
  const afterEnd = addDays(start, lengthDays);
  return addDays(afterEnd, (shoppingDay - weekday(afterEnd) + 7) % 7);
}

export function lastDay(start: string, lengthDays: number): string {
  return addDays(start, lengthDays - 1);
}

// « sam. 24 oct. »
export function shortDate(iso: string): string {
  const date = toDate(iso);
  return `${WEEKDAYS_SHORT[date.getUTCDay()]} ${date.getUTCDate()} ${MONTHS_SHORT[date.getUTCMonth()]}`;
}

// « mar. 20 »
export function shortDay(iso: string): string {
  const date = toDate(iso);
  return `${WEEKDAYS_SHORT[date.getUTCDay()]} ${date.getUTCDate()}`;
}

// « mardi 20 oct. »
export function longDate(iso: string): string {
  const date = toDate(iso);
  return `${WEEKDAYS_LONG[date.getUTCDay()]} ${date.getUTCDate()} ${MONTHS_SHORT[date.getUTCMonth()]}`;
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// « Du sam. 24 oct. au ven. 6 nov. »
export function rangeLabel(start: string, lengthDays: number): string {
  return `Du ${shortDate(start)} au ${shortDate(lastDay(start, lengthDays))}`;
}

// « 1 semaine », « 2 semaines »
export function lengthLabel(lengthDays: number): string {
  if (lengthDays % 7 === 0) {
    const weeks = lengthDays / 7;
    return `${weeks} semaine${weeks > 1 ? "s" : ""}`;
  }
  return `${lengthDays} jours`;
}

// Début du menu préparé après le dernier (#30) : le jour des courses qui suit sa fin ; si ce jour est
// déjà loin derrière (plusieurs semaines sans menu), le dernier jour des courses passé.
export function preparedMenuStart(last: { startDate: string; lengthDays: number }, shoppingDay: number, today: string): string {
  const next = nextMenuStart(last.startDate, last.lengthDays, shoppingDay);
  const recent = lastShoppingDay(today, shoppingDay);
  return next > recent ? next : recent;
}
