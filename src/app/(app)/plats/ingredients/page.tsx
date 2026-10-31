import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PlatsTabs } from "@/components/plats-tabs";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentHousehold } from "@/features/household/current-household";
import { IngredientList } from "@/features/ingredient/components/ingredient-list";
import { listIngredientsWithUsage } from "@/features/ingredient/queries";

export const metadata: Metadata = { title: "Ingrédients · Mijote" };

export default async function IngredientsPage() {
  // Le layout (app) garantit qu'il y a un foyer.
  const household = (await getCurrentHousehold())!;
  const ingredients = await listIngredientsWithUsage(household.id);

  return (
    <main className="flex flex-1 flex-col gap-4 bg-background px-4 py-6 text-foreground">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Ingrédients</h1>
        <Link href="/plats/ingredients/nouveau" className={buttonVariants({ className: "h-11 rounded-xl px-4 text-base" })}>
          <Plus aria-hidden="true" />
          Nouveau
        </Link>
      </header>
      <PlatsTabs current="ingredients" />
      <IngredientList ingredients={ingredients} />
    </main>
  );
}
