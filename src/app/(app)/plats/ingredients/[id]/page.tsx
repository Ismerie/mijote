import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCurrentHousehold } from "@/features/household/current-household";
import { IngredientForm } from "@/features/ingredient/components/ingredient-form";
import { IngredientHeader } from "@/features/ingredient/components/ingredient-header";
import { IngredientUsage } from "@/features/ingredient/components/ingredient-usage";
import { ingredientToFormValues } from "@/features/ingredient/ingredient-fields";
import { getIngredient } from "@/features/ingredient/queries";

export const metadata: Metadata = { title: "Ingrédient · Mijote" };

export default async function IngredientPage({ params }: PageProps<"/plats/ingredients/[id]">) {
  const { id } = await params;
  const household = (await getCurrentHousehold())!;
  const ingredient = await getIngredient(household.id, id);
  if (!ingredient) notFound();

  return (
    <main className="flex flex-1 flex-col bg-background text-foreground">
      <IngredientHeader title={ingredient.name} />
      <IngredientForm ingredientId={ingredient.id} initialValues={ingredientToFormValues(ingredient)}>
        <IngredientUsage ingredient={ingredient} />
      </IngredientForm>
    </main>
  );
}
