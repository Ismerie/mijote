import { INGREDIENT_COLUMNS, toIngredient, type IngredientRow } from "@/features/ingredient/ingredient";
import type { Unit } from "@/features/ingredient/units";
import { createClient } from "@/lib/supabase/server";

import { lineKey, type BatchToBuy, type Measure } from "./shopping-list";

type MenuDishRow = {
  position: number;
  carried_over: boolean;
  bought_at: string | null;
  dish: {
    name: string;
    dish_ingredient: { quantity: number | string | null; unit: Unit; position: number; ingredient: IngredientRow }[];
  };
};

// Ce qu'il faut pour calculer la liste de courses d'un menu (#32).
export type ShoppingData = {
  // Fournées à acheter : ni reportées, ni déjà achetées (« Courses terminées »), dans l'ordre du menu.
  batches: BatchToBuy[];
  // Plats reportés du menu précédent, jamais comptés dans les courses (#30).
  carriedOverNames: string[];
  // Au moins une fournée déjà achetée : la liste a été vidée par « Courses terminées ».
  anyBought: boolean;
  // Lignes cochées par un membre du foyer.
  checkedKeys: Set<string>;
};

export async function getShoppingData(householdId: string, menuId: string): Promise<ShoppingData> {
  const supabase = await createClient();
  const [dishes, checks] = await Promise.all([
    supabase
      .from("menu_dish")
      .select(
        `position, carried_over, bought_at, dish (name, dish_ingredient (quantity, unit, position, ingredient (${INGREDIENT_COLUMNS})))`,
      )
      .eq("household_id", householdId)
      .eq("menu_id", menuId)
      .order("position"),
    supabase.from("shopping_check").select("ingredient_id, measure").eq("household_id", householdId).eq("menu_id", menuId),
  ]);

  if (dishes.error) throw dishes.error;
  if (checks.error) throw checks.error;

  const rows = dishes.data as unknown as MenuDishRow[];
  const batches = rows
    .filter((row) => !row.carried_over && !row.bought_at)
    .map(
      (row): BatchToBuy => ({
        dishName: row.dish.name,
        lines: [...row.dish.dish_ingredient]
          .sort((a, b) => a.position - b.position)
          .map((line) => ({
            ingredient: toIngredient(line.ingredient),
            quantity: line.quantity === null ? null : Number(line.quantity),
            unit: line.unit,
          })),
      }),
    );

  return {
    batches,
    carriedOverNames: [...new Set(rows.filter((row) => row.carried_over).map((row) => row.dish.name))],
    anyBought: rows.some((row) => !row.carried_over && row.bought_at),
    checkedKeys: new Set(checks.data.map((check) => lineKey(check.ingredient_id, check.measure as Measure))),
  };
}
