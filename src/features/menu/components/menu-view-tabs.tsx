import Link from "next/link";

import { cn } from "@/lib/utils";

// Bascule En liste / Par jour sur l'accueil (#29). La vue est dans l'adresse (?vue=jour) : le retour y revient.
export function MenuViewTabs({ menuId, current }: { menuId: string; current: "liste" | "jour" }) {
  const tabs = [
    { key: "liste", label: "En liste", href: `/?menu=${menuId}` },
    { key: "jour", label: "Par jour", href: `/?menu=${menuId}&vue=jour` },
  ] as const;

  return (
    <nav aria-label="Vue du menu" className="grid grid-cols-2 gap-1 rounded-xl bg-border/60 p-1">
      {tabs.map((tab) => {
        const active = tab.key === current;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            replace
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-10 items-center justify-center rounded-lg text-sm font-semibold",
              active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
