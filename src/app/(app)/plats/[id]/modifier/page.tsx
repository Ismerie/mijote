import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteDishButton } from "@/features/dish/components/delete-dish-button";
import { DishForm } from "@/features/dish/components/dish-form";
import { DishFormHeader } from "@/features/dish/components/dish-form-header";
import { dishToFormValues } from "@/features/dish/dish-fields";
import { getDish } from "@/features/dish/queries";
import { getCurrentHousehold } from "@/features/household/current-household";
import { listIngredients } from "@/features/ingredient/queries";

export const metadata: Metadata = { title: "Modifier le plat · Mijote" };

export default async function ModifierPlatPage({ params }: PageProps<"/plats/[id]/modifier">) {
  const { id } = await params;
  const household = (await getCurrentHousehold())!;
  const [dish, catalog] = await Promise.all([getDish(household.id, id), listIngredients(household.id)]);
  if (!dish) notFound();

  return (
    <main className="flex flex-1 flex-col bg-background text-foreground">
      <DishFormHeader title="Modifier le plat" closeHref={`/plats/${dish.id}`} />
      <DishForm dishId={dish.id} initialValues={dishToFormValues(dish)} catalog={catalog}>
        <DeleteDishButton dishId={dish.id} dishName={dish.name} />
      </DishForm>
    </main>
  );
}
