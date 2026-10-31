import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentHousehold } from "@/features/household/current-household";
import { PrepareMenu } from "@/features/menu/components/prepare-menu";
import { preparedMenuStart, todayInParis } from "@/features/menu/dates";
import { carryOverChoices } from "@/features/menu/menu";
import { getMenu, listMenus } from "@/features/menu/queries";

export const metadata: Metadata = { title: "Préparer le menu · Mijote" };

// Préparer le menu qui suit le dernier (#30).
export default async function PrepareMenuPage() {
  const household = (await getCurrentHousehold())!;
  const last = (await listMenus(household.id)).at(-1);
  // Sans menu, rien à préparer : le premier menu se crée en ajoutant un plat (#28).
  if (!last) redirect("/");
  const menu = (await getMenu(household.id, last.id))!;

  return (
    <main className="flex flex-1 flex-col bg-background text-foreground">
      <PrepareMenu
        fromMenuId={menu.id}
        startDate={preparedMenuStart(menu, household.shoppingDay, todayInParis())}
        defaultLength={household.menuLengthDays}
        choices={carryOverChoices(menu)}
      />
    </main>
  );
}
