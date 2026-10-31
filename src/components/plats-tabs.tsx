import Link from "next/link";

import { cn } from "@/lib/utils";

// Onglets en haut de Plats : la liste des plats et le catalogue d'ingrédients (#26).
export function PlatsTabs({ current }: { current: "plats" | "ingredients" }) {
  const tabs = [
    { key: "plats", label: "Plats", href: "/plats" },
    { key: "ingredients", label: "Ingrédients", href: "/plats/ingredients" },
  ] as const;

  return (
    <nav aria-label="Plats ou ingrédients" className="grid grid-cols-2 gap-1 rounded-xl bg-border/60 p-1">
      {tabs.map((tab) => {
        const active = tab.key === current;
        return (
          <Link
            key={tab.key}
            href={tab.href}
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
