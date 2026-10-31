import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCurrentHousehold } from "@/features/household/current-household";
import { MenuDishDetails } from "@/features/menu/components/menu-dish-details";
import { getMenu, getMenuIdOfMenuDish } from "@/features/menu/queries";

export const metadata: Metadata = { title: "Plat au menu · Mijote" };

// Fiche « plat au menu » (#28), ouverte depuis une carte de la vue En liste.
export default async function MenuDishPage({ params }: PageProps<"/menu/plat/[id]">) {
  const { id } = await params;
  const household = (await getCurrentHousehold())!;
  const menuId = await getMenuIdOfMenuDish(household.id, id);
  const menu = menuId ? await getMenu(household.id, menuId) : null;
  const dish = menu?.dishes.find((item) => item.id === id);
  if (!menu || !dish) notFound();

  return (
    <main className="flex flex-1 flex-col bg-background text-foreground">
      <MenuDishDetails dish={dish} menuId={menu.id} />
    </main>
  );
}
