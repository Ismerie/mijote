"use client";

import { CalendarDays, CookingPot, House, ShoppingCart, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

type Tab = { label: string; icon: LucideIcon; href: string; match: (path: string) => boolean };

// Barre du bas commune à tous les écrans (maquette).
const TABS: Tab[] = [
  { label: "Menu", icon: CalendarDays, href: "/", match: (path) => path === "/" || path.startsWith("/menu") },
  { label: "Plats", icon: CookingPot, href: "/plats", match: (path) => path.startsWith("/plats") },
  { label: "Courses", icon: ShoppingCart, href: "/courses", match: (path) => path.startsWith("/courses") },
  { label: "Foyer", icon: House, href: "/foyer", match: (path) => path.startsWith("/foyer") },
];

// Les courses suivent le menu affiché (#32) : entre l'accueil et Courses, on garde le menu choisi
// avec les flèches ‹ › (?menu=<id>). « prochain » n'est pas un menu : on ne le garde pas.
function withMenu(href: string, pathname: string, menu: string | null): string {
  const keeps = (pathname === "/" || pathname === "/courses") && (href === "/" || href === "/courses");
  return keeps && menu && menu !== "prochain" ? `${href}?menu=${encodeURIComponent(menu)}` : href;
}

export function AppNav() {
  const pathname = usePathname();
  const menu = useSearchParams().get("menu");

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-4">
        {TABS.map(({ label, icon: Icon, href, match }) => {
          const active = match(pathname);
          const content = (
            <>
              <Icon aria-hidden="true" className="size-6" />
              {label}
            </>
          );
          const className = cn(
            "flex h-full flex-col items-center justify-center gap-1 text-xs font-semibold",
            active ? "text-primary" : "text-muted-foreground",
          );
          return (
            <li key={label}>
              <Link href={withMenu(href, pathname, menu)} aria-current={active ? "page" : undefined} className={className}>
                {content}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
