import type { Metadata } from "next";

import { listDishes } from "@/features/dish/queries";
import { getCurrentHousehold } from "@/features/household/current-household";
import { AddDishes } from "@/features/menu/components/add-dishes";
import { todayInParis } from "@/features/menu/dates";
import { getCurrentMenu, getMenu } from "@/features/menu/queries";

export const metadata: Metadata = { title: "Ajouter au menu · Mijote" };

// Ajouter des plats au menu (#28). ?menu=<id> : le menu affiché sur l'accueil ; ?plat=<id> : depuis la fiche d'un plat.
export default async function AddToMenuPage({ searchParams }: PageProps<"/menu/ajouter">) {
  const { menu: menuParam, plat } = await searchParams;
  const household = (await getCurrentHousehold())!;
  const dishes = await listDishes(household.id);
  const menu =
    (typeof menuParam === "string" ? await getMenu(household.id, menuParam) : null) ??
    (await getCurrentMenu(household.id, todayInParis()));
  const preselected = typeof plat === "string" && dishes.some((dish) => dish.id === plat) ? plat : null;

  return (
    <main className="flex flex-1 flex-col bg-background text-foreground">
      <AddDishes
        dishes={dishes}
        inMenu={menu ? [...new Set(menu.dishes.map((dish) => dish.dishId))] : []}
        menuId={menu?.id ?? null}
        peopleCount={household.peopleCount}
        preselected={preselected}
        backHref={preselected ? `/plats/${preselected}` : menu ? `/?menu=${menu.id}` : "/"}
      />
    </main>
  );
}
