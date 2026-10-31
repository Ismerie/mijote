import { addDays, capitalize, lastDay, lengthLabel, longDate, shortDay } from "./dates";
import { portionsLabel } from "./servings";

// Moments d'un repas (enum meal_slot), avec leurs noms affichés.
export const MEAL_SLOTS = [
  { value: "breakfast", label: "Petit-déj" },
  { value: "lunch", label: "Midi" },
  { value: "snack", label: "Goûter" },
  { value: "dinner", label: "Soir" },
] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number]["value"];

export function isMealSlot(value: unknown): value is MealSlot {
  return MEAL_SLOTS.some((slot) => slot.value === value);
}

export function slotLabel(slot: MealSlot): string {
  return MEAL_SLOTS.find((item) => item.value === slot)!.label;
}

// Un menu : une période qui commence le jour des courses.
export type MenuPeriod = {
  id: string;
  startDate: string;
  lengthDays: number;
};

// Un repas découpé dans une fournée.
export type Meal = {
  id: string;
  servings: number;
  date: string | null;
  slot: MealSlot | null;
  eaten: boolean;
};

// Une fournée : un plat ajouté au menu, cuisiné une fois.
export type MenuDish = {
  id: string;
  dishId: string;
  // Nom de la fournée : « Lasagnes (1) » quand le plat est plusieurs fois dans le menu.
  name: string;
  dishName: string;
  dishServings: number;
  // Plat supprimé depuis (suppression douce) : sa recette ne s'ouvre plus.
  dishArchived: boolean;
  cookedAt: string | null;
  carriedOver: boolean;
  meals: Meal[];
};

export type Menu = MenuPeriod & { dishes: MenuDish[] };

// État de la case ronde d'une fournée.
export type MenuDishState = "to_cook" | "cooked" | "eaten";

export function menuDishState(dish: Pick<MenuDish, "cookedAt" | "meals">): MenuDishState {
  if (!dish.cookedAt) return "to_cook";
  return dish.meals.every((meal) => meal.eaten) ? "eaten" : "cooked";
}

// 1er toucher : cuisiné ; 2e : tout mangé ; 3e : retour à « à cuisiner ».
export function nextMenuDishState(state: MenuDishState): MenuDishState {
  if (state === "to_cook") return "cooked";
  if (state === "cooked") return "eaten";
  return "to_cook";
}

export function totalServings(dish: Pick<MenuDish, "meals">): number {
  return dish.meals.reduce((sum, meal) => sum + meal.servings, 0);
}

export function remainingServings(dish: Pick<MenuDish, "meals">): number {
  return dish.meals.filter((meal) => !meal.eaten).reduce((sum, meal) => sum + meal.servings, 0);
}

// Sous-titre d'une carte En liste : « 4 portions · à cuisiner », « 4 portions · 1 restante », « 2 portions · tout mangé ».
export function menuDishSubtitle(dish: Pick<MenuDish, "cookedAt" | "meals">): string {
  const state = menuDishState(dish);
  const total = portionsLabel(totalServings(dish));
  if (state === "to_cook") return `${total} · à cuisiner`;
  if (state === "eaten") return `${total} · tout mangé`;
  const left = remainingServings(dish);
  return `${total} · ${left} restante${left > 1 ? "s" : ""}`;
}

// Badge d'un plat reporté du menu précédent (#30) : « Reste » s'il était déjà cuisiné, sinon « Reporté ».
export function carriedOverLabel(dish: Pick<MenuDish, "carriedOver" | "cookedAt">): string | null {
  if (!dish.carriedOver) return null;
  return dish.cookedAt ? "Reste" : "Reporté";
}

// Numérote les fournées d'un même plat dans l'ordre du menu : « Lasagnes (1) », « Lasagnes (2) ».
export function numberMenuDishes<T extends { dishId: string; dishName: string }>(dishes: T[]): (T & { name: string })[] {
  const counts = new Map<string, number>();
  for (const dish of dishes) counts.set(dish.dishId, (counts.get(dish.dishId) ?? 0) + 1);
  const seen = new Map<string, number>();
  return dishes.map((dish) => {
    const index = (seen.get(dish.dishId) ?? 0) + 1;
    seen.set(dish.dishId, index);
    return { ...dish, name: counts.get(dish.dishId)! > 1 ? `${dish.dishName} (${index})` : dish.dishName };
  });
}

// « 2 semaines · 7 plats, 2 cuisinés »
export function menuSummary(menu: Pick<Menu, "lengthDays" | "dishes">): string {
  const count = menu.dishes.length;
  const cooked = menu.dishes.filter((dish) => dish.cookedAt).length;
  return `${lengthLabel(menu.lengthDays)} · ${count} plat${count > 1 ? "s" : ""}, ${cooked} cuisiné${cooked > 1 ? "s" : ""}`;
}

export function containsDay(menu: MenuPeriod, day: string): boolean {
  return day >= menu.startDate && day <= lastDay(menu.startDate, menu.lengthDays);
}

// « Menu en cours », « Menu passé » ou « Prochain menu », selon la place du menu par rapport à aujourd'hui.
export function menuTitle(menu: MenuPeriod, today: string): string {
  if (containsDay(menu, today)) return "Menu en cours";
  return menu.startDate > today ? "Prochain menu" : "Menu passé";
}

// Le menu affiché sur l'accueil : celui qui contient aujourd'hui, sinon le dernier commencé,
// sinon le premier à venir. menus est trié par date de début.
export function pickCurrentMenu<T extends MenuPeriod>(menus: T[], today: string): T | null {
  const started = menus.filter((menu) => menu.startDate <= today);
  return menus.find((menu) => containsDay(menu, today)) ?? started.at(-1) ?? menus[0] ?? null;
}

// Jour et moment d'un repas : « Mar. 20 · soir », « Mar. 20 », « Soir », ou « Pas de jour ».
export function mealWhen(meal: Pick<Meal, "date" | "slot">): string {
  const day = meal.date ? capitalize(shortDay(meal.date)) : "";
  const slot = meal.slot ? slotLabel(meal.slot) : "";
  if (day && slot) return `${day} · ${slot.toLowerCase()}`;
  return day || slot || "Pas de jour";
}

// Ce que la base fera de la fournée (set_menu_dish_state), pour l'afficher tout de suite.
export function withMenuDishState<T extends Pick<MenuDish, "cookedAt" | "meals">>(dish: T, state: MenuDishState, now: string): T {
  if (state === "to_cook") return { ...dish, cookedAt: null, meals: dish.meals.map((meal) => ({ ...meal, eaten: false })) };
  const cooked = { ...dish, cookedAt: dish.cookedAt ?? now };
  return state === "eaten" ? { ...cooked, meals: dish.meals.map((meal) => ({ ...meal, eaten: true })) } : cooked;
}

// Ce que la base fera d'un repas coché ou décoché (set_meal_eaten) : manger un repas cuisine aussi le plat.
export function withMealEaten<T extends Pick<MenuDish, "cookedAt" | "meals">>(dish: T, mealId: string, eaten: boolean, now: string): T {
  return {
    ...dish,
    cookedAt: eaten ? (dish.cookedAt ?? now) : dish.cookedAt,
    meals: dish.meals.map((meal) => (meal.id === mealId ? { ...meal, eaten } : meal)),
  };
}

// Un repas avec ce qu'il faut savoir de sa fournée, pour la vue Par jour (#29).
export type MealItem = Meal & {
  menuDishId: string;
  name: string;
  toCook: boolean;
  carriedLabel: string | null;
};

// Un groupe de la vue Par jour : « À placer » (date null), puis chaque jour du menu.
export type DayGroup = { date: string | null; label: string; isToday: boolean; meals: MealItem[] };

// « À placer » en haut, puis tous les jours du menu, même vides, avec leurs repas dans l'ordre du menu.
export function groupMealsByDay(menu: Menu, today: string): DayGroup[] {
  const items: MealItem[] = menu.dishes.flatMap((dish) =>
    dish.meals.map((meal) => ({
      ...meal,
      menuDishId: dish.id,
      name: dish.name,
      toCook: !dish.cookedAt,
      carriedLabel: carriedOverLabel(dish),
    })),
  );
  const days = Array.from({ length: menu.lengthDays }, (_, index) => addDays(menu.startDate, index));
  return [
    { date: null, label: "À placer", isToday: false, meals: items.filter((item) => item.date === null) },
    ...days.map((day) => ({
      date: day,
      label: day === today ? `${longDate(day)} · aujourd’hui` : longDate(day),
      isToday: day === today,
      meals: items.filter((item) => item.date === day),
    })),
  ];
}

// Sous-titre d'un repas dans Par jour : « 2 portions · soir ».
export function mealSubtitle(meal: Pick<Meal, "servings" | "slot">): string {
  return portionsLabel(meal.servings) + (meal.slot ? ` · ${slotLabel(meal.slot).toLowerCase()}` : "");
}

// Choix de « Séparer ce repas » : pour 3 portions, « 2 + 1 » et « 1 + 2 » ; moved = portions du nouveau repas.
export function splitOptions(servings: number): { label: string; moved: number }[] {
  return Array.from({ length: servings - 1 }, (_, index) => {
    const moved = index + 1;
    return { label: `${servings - moved} + ${moved}`, moved };
  });
}

// Jours proposés dans la fiche repas : « Sam. 17 », « Dim. 18 »…
export function menuDays(menu: MenuPeriod): { date: string; label: string }[] {
  return Array.from({ length: menu.lengthDays }, (_, index) => {
    const date = addDays(menu.startDate, index);
    return { date, label: capitalize(shortDay(date)) };
  });
}

// Ce qui peut passer au menu suivant (#30), en deux groupes :
// les plats jamais cuisinés (reportés entiers, une ligne par plat) et les restes d'un plat cuisiné
// (une ligne par repas pas mangé).
export type CarryOverChoices = {
  uncooked: { menuDishId: string; name: string; servings: number; mealIds: string[] }[];
  leftovers: { mealId: string; name: string; servings: number; when: string }[];
};

export function carryOverChoices(menu: Menu): CarryOverChoices {
  const uncooked: CarryOverChoices["uncooked"] = [];
  const leftovers: CarryOverChoices["leftovers"] = [];
  for (const dish of menu.dishes) {
    const left = dish.meals.filter((meal) => !meal.eaten);
    if (left.length === 0) continue;
    if (!dish.cookedAt) {
      uncooked.push({
        menuDishId: dish.id,
        name: dish.name,
        servings: totalServings({ meals: left }),
        mealIds: left.map((meal) => meal.id),
      });
    } else {
      for (const meal of left) {
        leftovers.push({ mealId: meal.id, name: dish.name, servings: meal.servings, when: mealWhen(meal) });
      }
    }
  }
  return { uncooked, leftovers };
}
