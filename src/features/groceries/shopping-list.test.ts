import { describe, expect, it } from "vitest";

import type { Ingredient } from "@/features/ingredient/ingredient";

import { buildShoppingList, formatAmount, packLabel, purchaseQuantity, shoppingSummary, type BatchToBuy } from "./shopping-list";

const ingredient = (id: string, patch: Partial<Ingredient> = {}): Ingredient => ({
  id,
  name: id,
  aisle: "grocery",
  purchaseMode: "weight",
  packName: null,
  packSize: null,
  packUnit: null,
  alwaysInStock: false,
  ...patch,
});

const beef = ingredient("beef", { name: "Bœuf haché", aisle: "meat" });
const tomatoes = ingredient("tomatoes", {
  name: "Tomates concassées",
  purchaseMode: "pack",
  packName: "boîte",
  packSize: 400,
  packUnit: "g",
});
const salt = ingredient("salt", { name: "Sel", alwaysInStock: true });
const carrot = ingredient("carrot", { name: "Carotte", aisle: "produce", purchaseMode: "piece" });

const lasagna: BatchToBuy = {
  dishName: "Lasagnes",
  lines: [
    { ingredient: beef, quantity: 500, unit: "g" },
    { ingredient: tomatoes, quantity: 600, unit: "g" },
    { ingredient: salt, quantity: null, unit: "g" },
  ],
};
const curry: BatchToBuy = {
  dishName: "Curry",
  lines: [
    { ingredient: tomatoes, quantity: 400, unit: "g" },
    { ingredient: carrot, quantity: 1.5, unit: "piece" },
  ],
};

const lineOf = (list: ReturnType<typeof buildShoppingList>, name: string) =>
  list.groups.flatMap((group) => group.lines).find((line) => line.name === name);

describe("buildShoppingList", () => {
  it("should add up both batches when a dish is on the menu twice", () => {
    const list = buildShoppingList([lasagna, lasagna], new Set());
    expect(lineOf(list, "Bœuf haché")).toMatchObject({ quantity: "1 kg", detail: "", dishNames: ["Lasagnes"] });
  });

  it("should round packs up when two dishes use the same ingredient", () => {
    const list = buildShoppingList([lasagna, curry], new Set());
    expect(lineOf(list, "Tomates concassées")).toMatchObject({
      quantity: "3 boîtes",
      detail: "1 kg utilisés",
      dishNames: ["Lasagnes", "Curry"],
    });
  });

  it("should leave an ingredient out when it is always in stock", () => {
    const list = buildShoppingList([lasagna], new Set());
    expect(lineOf(list, "Sel")).toBeUndefined();
    expect(list.inStockNames).toEqual(["Sel"]);
  });

  it("should add grams and kilograms together when the units share a measure", () => {
    const list = buildShoppingList(
      [{ dishName: "A", lines: [{ ingredient: beef, quantity: 0.5, unit: "kg" }, { ingredient: beef, quantity: 250, unit: "g" }] }],
      new Set(),
    );
    expect(lineOf(list, "Bœuf haché")?.quantity).toBe("750 g");
  });

  it("should keep separate lines when the measures differ", () => {
    const list = buildShoppingList(
      [{ dishName: "A", lines: [{ ingredient: carrot, quantity: 2, unit: "piece" }, { ingredient: carrot, quantity: 100, unit: "g" }] }],
      new Set(),
    );
    expect(list.groups[0].lines.map((line) => line.quantity)).toEqual(["2", "100 g"]);
  });

  it("should group lines by aisle in store order and by name when several aisles are used", () => {
    const list = buildShoppingList([lasagna, curry], new Set());
    expect(list.groups.map((group) => [group.label, group.lines.map((line) => line.name)])).toEqual([
      ["Fruits et légumes", ["Carotte"]],
      ["Boucherie", ["Bœuf haché"]],
      ["Épicerie", ["Tomates concassées"]],
    ]);
  });

  it("should mark a line checked when its key was checked", () => {
    const list = buildShoppingList([lasagna], new Set(["beef:mass"]));
    expect(lineOf(list, "Bœuf haché")?.checked).toBe(true);
    expect(list).toMatchObject({ lineCount: 2, checkedCount: 1 });
  });

  it("should show no quantity when the recipe gives none", () => {
    const pepper = ingredient("pepper", { name: "Poivre" });
    const list = buildShoppingList([{ dishName: "A", lines: [{ ingredient: pepper, quantity: null, unit: "g" }] }], new Set());
    expect(lineOf(list, "Poivre")).toMatchObject({ quantity: "", detail: "" });
  });

  it("should return an empty list when there is nothing to buy", () => {
    expect(buildShoppingList([], new Set())).toEqual({ groups: [], lineCount: 0, checkedCount: 0, inStockNames: [] });
  });
});

describe("purchaseQuantity", () => {
  it("should not add a pack when the amount fills the packs exactly", () => {
    expect(purchaseQuantity(tomatoes, 800, "mass")).toEqual({ quantity: "2 boîtes", detail: "800 g utilisés" });
  });

  it("should convert the recipe unit when the pack uses another unit of the same measure", () => {
    const flour = ingredient("flour", { purchaseMode: "pack", packName: "paquet", packSize: 1, packUnit: "kg" });
    expect(purchaseQuantity(flour, 1200, "mass")).toEqual({ quantity: "2 paquets", detail: "1,2 kg utilisés" });
  });

  it("should count spoons in bottles when the pack is a volume", () => {
    const oil = ingredient("oil", { purchaseMode: "pack", packName: "bouteille", packSize: 1, packUnit: "l" });
    expect(purchaseQuantity(oil, 3, "tbsp")).toEqual({ quantity: "1 bouteille", detail: "3 c. à s. utilisés" });
  });

  it("should count pieces in packs when the pack holds pieces", () => {
    const eggs = ingredient("eggs", { purchaseMode: "pack", packName: "boîte", packSize: 6, packUnit: "piece" });
    expect(purchaseQuantity(eggs, 4, "piece")).toEqual({ quantity: "1 boîte", detail: "4 utilisés" });
  });

  it("should keep the recipe quantity when the pack measure does not match", () => {
    expect(purchaseQuantity(tomatoes, 3, "piece")).toEqual({ quantity: "3", detail: "" });
  });

  it("should round pieces up when the recipes use fractions", () => {
    expect(purchaseQuantity(carrot, 2.5, "piece")).toEqual({ quantity: "3", detail: "" });
  });
});

describe("formatAmount", () => {
  it("should switch to litres when the volume reaches 1000 ml", () => {
    expect(formatAmount(1000, "volume")).toBe("1 l");
    expect(formatAmount(250, "volume")).toBe("250 ml");
  });
});

describe("packLabel", () => {
  it("should add an s when there are several packs", () => {
    expect(packLabel("boîte", 3)).toBe("3 boîtes");
    expect(packLabel("boîte", 1)).toBe("1 boîte");
  });

  it("should not add an s when the name already ends with one", () => {
    expect(packLabel("pois", 2)).toBe("2 pois");
  });
});

describe("shoppingSummary", () => {
  it("should use plurals when there are several items", () => {
    expect(shoppingSummary({ lineCount: 18, checkedCount: 0 })).toBe("18 articles, 0 coché");
    expect(shoppingSummary({ lineCount: 1, checkedCount: 2 })).toBe("1 article, 2 cochés");
  });
});
