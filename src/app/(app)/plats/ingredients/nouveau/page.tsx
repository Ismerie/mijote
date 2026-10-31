import type { Metadata } from "next";

import { IngredientForm } from "@/features/ingredient/components/ingredient-form";
import { IngredientHeader } from "@/features/ingredient/components/ingredient-header";
import { EMPTY_INGREDIENT_VALUES } from "@/features/ingredient/ingredient-fields";

export const metadata: Metadata = { title: "Nouvel ingrédient · Mijote" };

export default function NouvelIngredientPage() {
  return (
    <main className="flex flex-1 flex-col bg-background text-foreground">
      <IngredientHeader title="Nouvel ingrédient" />
      <IngredientForm ingredientId={null} initialValues={EMPTY_INGREDIENT_VALUES} />
    </main>
  );
}
