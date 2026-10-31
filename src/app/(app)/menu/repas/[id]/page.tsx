import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCurrentHousehold } from "@/features/household/current-household";
import { MealDetails } from "@/features/menu/components/meal-details";
import { getMenu, getMenuIdOfMeal } from "@/features/menu/queries";

export const metadata: Metadata = { title: "Repas · Mijote" };

// Fiche d'un repas (#29). ?depuis=plat : ouverte depuis la fiche du plat au menu, le retour y revient.
export default async function MealPage({ params, searchParams }: PageProps<"/menu/repas/[id]">) {
  const [{ id }, { depuis }] = await Promise.all([params, searchParams]);
  const household = (await getCurrentHousehold())!;
  const menuId = await getMenuIdOfMeal(household.id, id);
  const menu = menuId ? await getMenu(household.id, menuId) : null;
  const dish = menu?.dishes.find((item) => item.meals.some((meal) => meal.id === id));
  const meal = dish?.meals.find((item) => item.id === id);
  if (!menu || !dish || !meal) notFound();

  return (
    <main className="flex flex-1 flex-col bg-background text-foreground">
      {/* La clé recharge la fiche après une séparation : les portions du repas ont changé. */}
      <MealDetails key={`${meal.id}-${meal.servings}`} meal={meal} dish={dish} menu={menu} fromDish={depuis === "plat"} />
    </main>
  );
}
