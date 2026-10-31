import { rangeLabel } from "../dates";
import { menuSummary, menuTitle, type Menu } from "../menu";

// En-tête de l'accueil : « Menu en cours », sa période et ce qui est cuisiné (#28).
export function MenuHeader({ menu, today }: { menu: Menu; today: string }) {
  return (
    <header className="flex flex-col items-center gap-1 text-center">
      <h1 className="text-3xl font-bold tracking-tight">{menuTitle(menu, today)}</h1>
      <p>{rangeLabel(menu.startDate, menu.lengthDays)}</p>
      <p className="text-sm text-muted-foreground">{menuSummary(menu)}</p>
    </header>
  );
}
