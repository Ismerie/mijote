import type { Metadata } from "next";

import { DishForm } from "@/features/dish/components/dish-form";
import { DishFormHeader } from "@/features/dish/components/dish-form-header";
import { EMPTY_DISH_VALUES } from "@/features/dish/dish-fields";
import { getCurrentHousehold } from "@/features/household/current-household";
import { listIngredients } from "@/features/ingredient/queries";

export const metadata: Metadata = { title: "Nouveau plat · Mijote" };

export default async function NouveauPlatPage() {
  const household = (await getCurrentHousehold())!;
  const catalog = await listIngredients(household.id);

  return (
    <main className="flex flex-1 flex-col bg-background text-foreground">
      <DishFormHeader title="Nouveau plat" closeHref="/plats" />
      <DishForm dishId={null} initialValues={EMPTY_DISH_VALUES} catalog={catalog} />
    </main>
  );
}
