import { CircleCheck } from "lucide-react";
import type { Metadata } from "next";

import { FinishShoppingButton } from "@/features/groceries/components/finish-shopping-button";
import { ShoppingListView } from "@/features/groceries/components/shopping-list-view";
import { getShoppingData } from "@/features/groceries/queries";
import { buildShoppingList, shoppingSummary } from "@/features/groceries/shopping-list";
import { getCurrentHousehold } from "@/features/household/current-household";
import { rangeLabel, todayInParis } from "@/features/menu/dates";
import { pickCurrentMenu } from "@/features/menu/menu";
import { listMenus } from "@/features/menu/queries";

export const metadata: Metadata = { title: "Courses · Mijote" };

// Onglet Courses (#32) : la liste du menu affiché sur l'accueil. ?menu=<id> suit le menu choisi
// avec les flèches ‹ › (la barre du bas garde ce choix), sinon le menu en cours.
export default async function ShoppingPage({ searchParams }: PageProps<"/courses">) {
  const { menu: menuParam } = await searchParams;
  // Le layout (app) garantit qu'il y a un foyer.
  const household = (await getCurrentHousehold())!;
  const menus = await listMenus(household.id);
  const menu = menus.find((item) => item.id === menuParam) ?? pickCurrentMenu(menus, todayInParis());

  if (!menu) {
    return (
      <ShoppingScreen period="Pas de menu pour cette période">
        <Empty title="Pas de menu pour cette période" text="Prépare un menu pour voir sa liste de courses." />
      </ShoppingScreen>
    );
  }

  const data = await getShoppingData(household.id, menu.id);
  const list = buildShoppingList(data.batches, data.checkedKeys);
  const range = rangeLabel(menu.startDate, menu.lengthDays);
  const hasLines = list.lineCount > 0;

  return (
    <ShoppingScreen period={`Menu ${range.charAt(0).toLowerCase()}${range.slice(1)} · ${shoppingSummary(list)}`}>
      {hasLines ? (
        <>
          <ShoppingListView menuId={menu.id} groups={list.groups} />
          <FinishShoppingButton menuId={menu.id} />
        </>
      ) : data.anyBought ? (
        <Empty
          title="Courses faites"
          text="La liste de ce menu a été supprimée. Elle se remplira si tu ajoutes des plats."
        />
      ) : (
        <Empty title="Rien à acheter" text="Ajoute des plats au menu pour remplir la liste." />
      )}
      {list.inStockNames.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Pas dans la liste, toujours en stock : {list.inStockNames.join(", ")}.
        </p>
      )}
      {hasLines && data.carriedOverNames.length > 0 && (
        <p className="rounded-xl bg-secondary px-3.5 py-3 text-sm text-secondary-foreground">
          {data.carriedOverNames.join(", ")} : reporté du menu précédent, donc pas compté dans les courses (déjà
          acheté).
        </p>
      )}
    </ShoppingScreen>
  );
}

function ShoppingScreen({ period, children }: { period: string; children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col gap-5 bg-background px-4 py-6 text-foreground">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
        <p className="text-muted-foreground">{period}</p>
      </header>
      {children}
    </main>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <section className="flex flex-col items-center gap-2.5 px-3 py-8 text-center">
      <CircleCheck aria-hidden="true" className="size-10 text-primary" strokeWidth={1.8} />
      <p className="text-lg font-semibold">{title}</p>
      <p className="text-muted-foreground">{text}</p>
    </section>
  );
}
