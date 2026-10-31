import { describe, expect, it } from "vitest";

import {
  carriedOverLabel,
  groupMealsByDay,
  mealSubtitle,
  mealWhen,
  menuDishState,
  menuDishSubtitle,
  menuSummary,
  menuTitle,
  nextMenuDishState,
  numberMenuDishes,
  pickCurrentMenu,
  splitOptions,
  withMealEaten,
  withMenuDishState,
  type Meal,
  type MenuDish,
} from "./menu";

const meal = (servings: number, eaten = false): Meal => ({ id: crypto.randomUUID(), servings, date: null, slot: null, eaten });

const lasagnes = (cookedAt: string | null, meals: Meal[]): Pick<MenuDish, "cookedAt" | "meals"> => ({ cookedAt, meals });

describe("menuDishState", () => {
  it("should be to cook when the dish has no cooking date", () => {
    expect(menuDishState(lasagnes(null, [meal(2), meal(2)]))).toBe("to_cook");
  });

  it("should be cooked when some meals are left", () => {
    expect(menuDishState(lasagnes("2026-10-20T19:00:00Z", [meal(2, true), meal(2)]))).toBe("cooked");
  });

  it("should be eaten when every meal is eaten", () => {
    expect(menuDishState(lasagnes("2026-10-20T19:00:00Z", [meal(2, true), meal(2, true)]))).toBe("eaten");
  });
});

describe("nextMenuDishState", () => {
  it("should cycle from to cook to cooked to eaten and back", () => {
    expect(nextMenuDishState("to_cook")).toBe("cooked");
    expect(nextMenuDishState("cooked")).toBe("eaten");
    expect(nextMenuDishState("eaten")).toBe("to_cook");
  });
});

describe("menuDishSubtitle", () => {
  it("should say to cook when the dish is not cooked", () => {
    expect(menuDishSubtitle(lasagnes(null, [meal(2), meal(2)]))).toBe("4 portions · à cuisiner");
  });

  it("should count the servings left when the dish is cooked", () => {
    expect(menuDishSubtitle(lasagnes("2026-10-20", [meal(2), meal(2)]))).toBe("4 portions · 4 restantes");
    expect(menuDishSubtitle(lasagnes("2026-10-20", [meal(2, true), meal(1, true), meal(1)]))).toBe("4 portions · 1 restante");
  });

  it("should say everything is eaten when no meal is left", () => {
    expect(menuDishSubtitle(lasagnes("2026-10-20", [meal(2, true)]))).toBe("2 portions · tout mangé");
  });
});

describe("carriedOverLabel", () => {
  it("should say leftover when a carried dish was cooked, carried otherwise", () => {
    expect(carriedOverLabel({ carriedOver: true, cookedAt: "2026-10-20" })).toBe("Reste");
    expect(carriedOverLabel({ carriedOver: true, cookedAt: null })).toBe("Reporté");
    expect(carriedOverLabel({ carriedOver: false, cookedAt: null })).toBeNull();
  });
});

describe("numberMenuDishes", () => {
  it("should number a dish when it is in the menu twice", () => {
    const named = numberMenuDishes([
      { dishId: "l", dishName: "Lasagnes" },
      { dishId: "c", dishName: "Curry" },
      { dishId: "l", dishName: "Lasagnes" },
    ]);
    expect(named.map((dish) => dish.name)).toEqual(["Lasagnes (1)", "Curry", "Lasagnes (2)"]);
  });
});

describe("menuSummary", () => {
  it("should count the dishes and the cooked ones", () => {
    const dishes = [{ cookedAt: "2026-10-20" }, { cookedAt: null }, { cookedAt: "2026-10-21" }] as MenuDish[];
    expect(menuSummary({ lengthDays: 14, dishes })).toBe("2 semaines · 3 plats, 2 cuisinés");
    expect(menuSummary({ lengthDays: 7, dishes: [dishes[1]] })).toBe("1 semaine · 1 plat, 0 cuisiné");
  });
});

describe("pickCurrentMenu and menuTitle", () => {
  const past = { id: "p", startDate: "2026-10-03", lengthDays: 14 };
  const current = { id: "c", startDate: "2026-10-17", lengthDays: 14 };
  const next = { id: "n", startDate: "2026-10-31", lengthDays: 14 };

  it("should pick the menu that contains today", () => {
    expect(pickCurrentMenu([past, current, next], "2026-10-24")?.id).toBe("c");
    expect(menuTitle(current, "2026-10-24")).toBe("Menu en cours");
  });

  it("should pick the last started menu when none contains today", () => {
    expect(pickCurrentMenu([past, current], "2026-11-05")?.id).toBe("c");
    expect(menuTitle(current, "2026-11-05")).toBe("Menu passé");
  });

  it("should pick the first menu when every menu is still to come", () => {
    expect(pickCurrentMenu([next], "2026-10-24")?.id).toBe("n");
    expect(menuTitle(next, "2026-10-24")).toBe("Prochain menu");
  });

  it("should return null when there is no menu", () => {
    expect(pickCurrentMenu([], "2026-10-24")).toBeNull();
  });
});

describe("mealWhen", () => {
  it("should show the day and the slot when both are set", () => {
    expect(mealWhen({ date: "2026-10-20", slot: "dinner" })).toBe("Mar. 20 · soir");
  });

  it("should say no day when the meal is not placed", () => {
    expect(mealWhen({ date: null, slot: null })).toBe("Pas de jour");
    expect(mealWhen({ date: null, slot: "lunch" })).toBe("Midi");
  });
});

describe("withMenuDishState and withMealEaten", () => {
  const now = "2026-10-24T12:00:00Z";

  it("should eat every meal when the dish is marked as eaten", () => {
    const dish = withMenuDishState(lasagnes(null, [meal(2), meal(2)]), "eaten", now);
    expect(dish.cookedAt).toBe(now);
    expect(dish.meals.every((item) => item.eaten)).toBe(true);
  });

  it("should clear the meals when the dish goes back to cook", () => {
    const dish = withMenuDishState(lasagnes(now, [meal(2, true)]), "to_cook", now);
    expect(dish).toMatchObject({ cookedAt: null, meals: [{ eaten: false }] });
  });

  it("should cook the dish when one of its meals is eaten", () => {
    const first = meal(2);
    const dish = withMealEaten(lasagnes(null, [first, meal(2)]), first.id, true, now);
    expect(dish.cookedAt).toBe(now);
    expect(menuDishSubtitle(dish)).toBe("4 portions · 2 restantes");
  });
});

describe("groupMealsByDay", () => {
  const menu = {
    id: "p1",
    startDate: "2026-10-24",
    lengthDays: 7,
    dishes: [
      {
        id: "b1",
        dishId: "l",
        name: "Lasagnes (1)",
        dishName: "Lasagnes",
        dishServings: 4,
        dishArchived: false,
        cookedAt: null,
        carriedOver: false,
        meals: [
          { id: "m1", servings: 2, date: null, slot: null, eaten: false },
          { id: "m2", servings: 2, date: "2026-10-27", slot: "dinner" as const, eaten: false },
        ],
      },
    ],
  };

  it("should list the meals to place first, then every day of the menu even when empty", () => {
    const groups = groupMealsByDay(menu, "2026-10-25");
    expect(groups).toHaveLength(8);
    expect(groups[0]).toMatchObject({ date: null, label: "À placer" });
    expect(groups[0].meals.map((item) => item.id)).toEqual(["m1"]);
    expect(groups[1]).toMatchObject({ label: "samedi 24 oct.", meals: [] });
    expect(groups[2]).toMatchObject({ label: "dimanche 25 oct. · aujourd’hui", isToday: true });
    expect(groups[4].meals).toMatchObject([{ id: "m2", name: "Lasagnes (1)", toCook: true }]);
  });
});

describe("mealSubtitle", () => {
  it("should add the slot when the meal has one", () => {
    expect(mealSubtitle({ servings: 2, slot: "dinner" })).toBe("2 portions · soir");
    expect(mealSubtitle({ servings: 1, slot: null })).toBe("1 portion");
  });
});

describe("splitOptions", () => {
  it("should offer 1 + 1 when the meal has 2 servings", () => {
    expect(splitOptions(2)).toEqual([{ label: "1 + 1", moved: 1 }]);
  });

  it("should offer every split when the meal has 3 servings", () => {
    expect(splitOptions(3).map((option) => option.label)).toEqual(["2 + 1", "1 + 2"]);
  });

  it("should offer nothing when the meal has 1 serving", () => {
    expect(splitOptions(1)).toEqual([]);
  });
});
