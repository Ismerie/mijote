import { createClient } from "@/lib/supabase/server";

import { numberMenuDishes, pickCurrentMenu, type Meal, type MealSlot, type Menu, type MenuPeriod } from "./menu";

type MenuRow = { id: string; start_date: string; length_days: number };

const toPeriod = (row: MenuRow): MenuPeriod => ({ id: row.id, startDate: row.start_date, lengthDays: row.length_days });

// Menus du foyer, du plus ancien au plus récent (#28, flèches ‹ › en #30).
export async function listMenus(householdId: string): Promise<MenuPeriod[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu")
    .select("id, start_date, length_days")
    .eq("household_id", householdId)
    .order("start_date");

  if (error) throw error;
  return data.map(toPeriod);
}

type MealRow = {
  id: string;
  servings: number;
  date: string | null;
  slot: MealSlot | null;
  eaten_at: string | null;
  position: number;
  created_at: string;
};

type MenuDishRow = {
  id: string;
  position: number;
  cooked_at: string | null;
  carried_over: boolean;
  dish: { id: string; name: string; servings: number; archived_at: string | null };
  meal: MealRow[];
};

// Un menu du foyer avec ses fournées (dans l'ordre d'ajout) et leurs repas, ou null s'il n'existe pas.
export async function getMenu(householdId: string, menuId: string): Promise<Menu | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu")
    .select(
      "id, start_date, length_days, menu_dish (id, position, cooked_at, carried_over, dish (id, name, servings, archived_at), meal (id, servings, date, slot, eaten_at, position, created_at))",
    )
    .eq("household_id", householdId)
    .eq("id", menuId)
    .maybeSingle();

  // 22P02 : l'adresse ne contient pas un identifiant valide, c'est comme un menu introuvable.
  if (error?.code === "22P02") return null;
  if (error) throw error;
  if (!data) return null;

  const rows = [...(data.menu_dish as unknown as MenuDishRow[])].sort((a, b) => a.position - b.position);
  const dishes = numberMenuDishes(
    rows.map((row) => ({
      id: row.id,
      dishId: row.dish.id,
      dishName: row.dish.name,
      dishServings: row.dish.servings,
      dishArchived: row.dish.archived_at !== null,
      cookedAt: row.cooked_at,
      carriedOver: row.carried_over,
      meals: [...row.meal]
        .sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at))
        .map(
          (meal): Meal => ({
            id: meal.id,
            servings: meal.servings,
            date: meal.date,
            slot: meal.slot,
            eaten: meal.eaten_at !== null,
          }),
        ),
    })),
  );

  return { ...toPeriod(data as MenuRow), dishes };
}

// Le menu affiché sur l'accueil (voir pickCurrentMenu), ou null si le foyer n'a pas encore de menu.
export async function getCurrentMenu(householdId: string, today: string): Promise<Menu | null> {
  const current = pickCurrentMenu(await listMenus(householdId), today);
  return current ? getMenu(householdId, current.id) : null;
}

// Menu d'une fournée, pour ouvrir sa fiche « plat au menu » (#28).
export async function getMenuIdOfMenuDish(householdId: string, menuDishId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_dish")
    .select("menu_id")
    .eq("household_id", householdId)
    .eq("id", menuDishId)
    .maybeSingle();

  if (error?.code === "22P02") return null;
  if (error) throw error;
  return data?.menu_id ?? null;
}

// Menu d'un repas, pour ouvrir sa fiche (#29).
export async function getMenuIdOfMeal(householdId: string, mealId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meal")
    .select("menu_dish (menu_id)")
    .eq("household_id", householdId)
    .eq("id", mealId)
    .maybeSingle();

  if (error?.code === "22P02") return null;
  if (error) throw error;
  return (data?.menu_dish as unknown as { menu_id: string } | null)?.menu_id ?? null;
}
