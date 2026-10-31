import type { Metadata } from "next";

import { getCurrentHousehold } from "@/features/household/current-household";
import { AddDishLink } from "@/features/menu/components/add-dish-link";
import { MenuDishList } from "@/features/menu/components/menu-dish-list";
import { MenuHeader } from "@/features/menu/components/menu-header";
import { todayInParis } from "@/features/menu/dates";
import { getCurrentMenu, getMenu } from "@/features/menu/queries";

export const metadata: Metadata = { title: "Menu · Mijote" };

// Accueil = le menu (#28). ?menu=<id> affiche un menu précis, sinon le menu en cours.
export default async function MenuPage({ searchParams }: PageProps<"/">) {
  const { menu: menuParam } = await searchParams;
  // Le layout (app) garantit qu'il y a un foyer.
  const household = (await getCurrentHousehold())!;
  const today = todayInParis();
  const menu =
    (typeof menuParam === "string" ? await getMenu(household.id, menuParam) : null) ??
    (await getCurrentMenu(household.id, today));

  return (
    <main className="flex flex-1 flex-col gap-4 bg-background px-4 py-6 text-foreground">
      {menu ? (
        <>
          <MenuHeader menu={menu} today={today} />
          <MenuDishList dishes={menu.dishes} />
          {menu.dishes.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Touche la case une fois quand le plat est cuisiné, une deuxième fois quand tout est mangé.
            </p>
          )}
          <AddDishLink menuId={menu.id} />
        </>
      ) : (
        // Pas encore de menu : le premier se crée au premier ajout (#28). État non dessiné dans la maquette.
        <>
          <header className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Menu en cours</h1>
            <p className="text-muted-foreground">Pas encore de plat au menu.</p>
          </header>
          <AddDishLink />
        </>
      )}
    </main>
  );
}
