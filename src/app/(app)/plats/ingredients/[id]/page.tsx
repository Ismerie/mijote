import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCurrentHousehold } from "@/features/household/current-household";
import { IngredientForm } from "@/features/ingredient/components/ingredient-form";
import { IngredientHeader } from "@/features/ingredient/components/ingredient-header";
import { IngredientUsage } from "@/features/ingredient/components/ingredient-usage";
import { ingredientToFormValues } from "@/features/ingredient/ingredient-fields";
import { getIngredient } from "@/features/ingredient/queries";
import { ingredientReturnPath } from "@/features/ingredient/return-path";

export const metadata: Metadata = { title: "Ingrédient · Mijote" };

// ?depuis=courses&menu=<id> : ouverte depuis ⋯ sur une ligne de courses (#32), on y revient après « OK ».
export default async function IngredientPage({ params, searchParams }: PageProps<"/plats/ingredients/[id]">) {
  const { id } = await params;
  const { depuis, menu } = await searchParams;
  const returnPath = ingredientReturnPath(depuis, menu);
  const household = (await getCurrentHousehold())!;
  const ingredient = await getIngredient(household.id, id);
  if (!ingredient) notFound();

  return (
    <main className="flex flex-1 flex-col bg-background text-foreground">
      <IngredientHeader title={ingredient.name} backHref={returnPath} />
      <IngredientForm
        ingredientId={ingredient.id}
        initialValues={ingredientToFormValues(ingredient)}
        returnPath={returnPath}
      >
        <IngredientUsage ingredient={ingredient} />
      </IngredientForm>
    </main>
  );
}
