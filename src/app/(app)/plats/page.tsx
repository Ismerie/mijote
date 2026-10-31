import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PlatsTabs } from "@/components/plats-tabs";
import { buttonVariants } from "@/components/ui/button";
import { DishList } from "@/features/dish/components/dish-list";
import { listDishes } from "@/features/dish/queries";
import { getCurrentHousehold } from "@/features/household/current-household";

export const metadata: Metadata = { title: "Plats · Mijote" };

export default async function PlatsPage() {
  // Le layout (app) garantit qu'il y a un foyer.
  const household = (await getCurrentHousehold())!;
  const dishes = await listDishes(household.id);

  return (
    <main className="flex flex-1 flex-col gap-4 bg-background px-4 py-6 text-foreground">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Plats</h1>
        {dishes.length > 0 && (
          <Link href="/plats/nouveau" className={buttonVariants({ className: "h-11 rounded-xl px-4 text-base" })}>
            <Plus aria-hidden="true" />
            Nouveau
          </Link>
        )}
      </header>
      <PlatsTabs current="plats" />

      {dishes.length > 0 ? (
        <DishList dishes={dishes} />
      ) : (
        // État vide demandé par le ticket (pas dessiné dans la maquette).
        <section className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <p className="text-muted-foreground">Pas encore de plat dans ton foyer.</p>
          <Link href="/plats/nouveau" className={buttonVariants({ className: "h-11 rounded-xl px-4 text-base" })}>
            <Plus aria-hidden="true" />
            Créer un plat
          </Link>
        </section>
      )}
    </main>
  );
}
