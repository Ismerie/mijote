import { CalendarPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { getCurrentHousehold } from "@/features/household/current-household";
import { AddDishLink } from "@/features/menu/components/add-dish-link";
import { DayView } from "@/features/menu/components/day-view";
import { MenuDishList } from "@/features/menu/components/menu-dish-list";
import { MenuHeader } from "@/features/menu/components/menu-header";
import { MenuViewTabs } from "@/features/menu/components/menu-view-tabs";
import { preparedMenuStart, rangeLabel, shortDate, todayInParis } from "@/features/menu/dates";
import { menuSummary, menuTitle, pickCurrentMenu } from "@/features/menu/menu";
import { getMenu, listMenus } from "@/features/menu/queries";

export const metadata: Metadata = { title: "Menu · Mijote" };

// Le menu qui n'existe pas encore, après le dernier : on y prépare le suivant (#30).
const NEXT = "prochain";

// Accueil = le menu (#28). ?menu=<id> affiche un menu précis (flèches ‹ ›, #30), sinon le menu en cours ;
// ?menu=prochain propose de préparer le suivant ; ?vue=jour affiche la vue Par jour (#29), sinon En liste.
export default async function MenuPage({ searchParams }: PageProps<"/">) {
  const { menu: menuParam, vue } = await searchParams;
  const view = vue === "jour" ? "jour" : "liste";
  // Le layout (app) garantit qu'il y a un foyer.
  const household = (await getCurrentHousehold())!;
  const today = todayInParis();
  const menus = await listMenus(household.id);
  const last = menus.at(-1);

  // Pas encore de menu : le premier se crée au premier ajout (#28). État non dessiné dans la maquette.
  if (!last) {
    return (
      <main className="flex flex-1 flex-col gap-4 bg-background px-4 py-6 text-foreground">
        <MenuHeader title="Menu en cours" period="Pas encore de plat au menu." previousHref={null} nextHref={null} />
        <AddDishLink />
      </main>
    );
  }

  if (menuParam === NEXT) {
    return (
      <main className="flex flex-1 flex-col gap-4 bg-background px-4 py-6 text-foreground">
        <MenuHeader
          title="Prochain menu"
          period={`À partir du ${shortDate(preparedMenuStart(last, household.shoppingDay, today))}`}
          previousHref={`/?menu=${last.id}`}
          nextHref={null}
        />
        <section className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-10 text-center">
          <CalendarPlus aria-hidden="true" className="size-11 text-muted-foreground" strokeWidth={1.6} />
          <p className="text-lg font-semibold">Pas encore de menu ici</p>
          <p className="text-muted-foreground">
            Prépare le prochain menu : choisis sa durée, reporte ce qui n&apos;a pas été mangé, puis ajoute tes plats.
          </p>
          <Link href="/menu/preparer" className={buttonVariants({ className: "mt-2 h-12 rounded-xl px-6 text-base" })}>
            Préparer le prochain menu
          </Link>
        </section>
      </main>
    );
  }

  const shown = menus.find((item) => item.id === menuParam) ?? pickCurrentMenu(menus, today)!;
  const index = menus.indexOf(shown);
  const menu = (await getMenu(household.id, shown.id))!;
  const menuHref = (id: string) => `/?menu=${id}${view === "jour" ? "&vue=jour" : ""}`;

  return (
    <main className="flex flex-1 flex-col gap-4 bg-background px-4 py-6 text-foreground">
      <MenuHeader
        title={menuTitle(menu, today)}
        period={rangeLabel(menu.startDate, menu.lengthDays)}
        summary={menuSummary(menu)}
        previousHref={index > 0 ? menuHref(menus[index - 1].id) : null}
        nextHref={index < menus.length - 1 ? menuHref(menus[index + 1].id) : `/?menu=${NEXT}`}
      />
      <MenuViewTabs menuId={menu.id} current={view} />
      {view === "jour" ? (
        <DayView menu={menu} today={today} />
      ) : (
        <>
          <MenuDishList dishes={menu.dishes} />
          {menu.dishes.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Touche la case une fois quand le plat est cuisiné, une deuxième fois quand tout est mangé. Le détail des
              repas : vue Par jour.
            </p>
          )}
        </>
      )}
      <AddDishLink menuId={menu.id} />
    </main>
  );
}
