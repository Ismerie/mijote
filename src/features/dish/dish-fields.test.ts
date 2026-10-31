import { describe, expect, it } from "vitest";

import { describeDish, EMPTY_DISH_VALUES, parseDecimal, readDishForm, validateDish, type DishFormValues } from "./dish-fields";

const lasagnes: DishFormValues = {
  ...EMPTY_DISH_VALUES,
  name: "  Lasagnes ",
  servings: "4",
  lines: [{ name: "Bœuf haché", quantity: "500", unit: "g" }],
};

describe("parseDecimal", () => {
  it("should accept a decimal comma when the user types the French way", () => {
    expect(parseDecimal("1,5")).toBe(1.5);
  });

  it("should return null when the field is empty", () => {
    expect(parseDecimal("  ")).toBeNull();
  });

  it("should return NaN when the text is not a positive number", () => {
    expect(parseDecimal("-2")).toBeNaN();
    expect(parseDecimal("abc")).toBeNaN();
  });
});

describe("validateDish", () => {
  it("should return clean data when the dish is valid", () => {
    expect(validateDish(lasagnes)).toEqual({
      input: {
        name: "Lasagnes",
        servings: 4,
        recipe: "",
        kcal: null,
        protein: null,
        carbs: null,
        fat: null,
        lines: [{ name: "Bœuf haché", quantity: 500, unit: "g" }],
      },
    });
  });

  it("should refuse when the name is empty", () => {
    expect(validateDish({ ...lasagnes, name: " " }).error).toBeDefined();
  });

  it("should refuse when servings are out of range or not whole", () => {
    expect(validateDish({ ...lasagnes, servings: "0" }).error).toBeDefined();
    expect(validateDish({ ...lasagnes, servings: "51" }).error).toBeDefined();
    expect(validateDish({ ...lasagnes, servings: "2.5" }).error).toBeDefined();
  });

  it("should keep macros as numbers when they are filled with a comma", () => {
    expect(validateDish({ ...lasagnes, kcal: "610", fat: "28,5" }).input).toMatchObject({ kcal: 610, fat: 28.5 });
  });

  it("should refuse when a macro is not a number", () => {
    expect(validateDish({ ...lasagnes, protein: "beaucoup" }).error).toContain("Protéines");
  });

  it("should skip ingredient lines when they are left empty", () => {
    const values = { ...lasagnes, lines: [...lasagnes.lines, { name: "", quantity: "", unit: "g" as const }] };
    expect(validateDish(values).input?.lines).toHaveLength(1);
  });

  it("should accept an ingredient without quantity when it is salt or pepper", () => {
    const values = { ...lasagnes, lines: [{ name: "Sel", quantity: "", unit: "g" as const }] };
    expect(validateDish(values).input?.lines).toEqual([{ name: "Sel", quantity: null, unit: "g" }]);
  });

  it("should refuse when a quantity has no ingredient name", () => {
    const values = { ...lasagnes, lines: [{ name: "", quantity: "200", unit: "g" as const }] };
    expect(validateDish(values).error).toBeDefined();
  });

  it("should refuse when a quantity is zero", () => {
    const values = { ...lasagnes, lines: [{ name: "Riz", quantity: "0", unit: "g" as const }] };
    expect(validateDish(values).error).toContain("Riz");
  });

  it("should keep the aisle when a new ingredient comes with one", () => {
    const values = { ...lasagnes, lines: [{ name: "Riz", quantity: "", unit: "g" as const, aisle: "grocery" as const }] };
    expect(validateDish(values).input?.lines[0]).toEqual({ name: "Riz", quantity: null, unit: "g", aisle: "grocery" });
  });
});

describe("readDishForm", () => {
  it("should read the ingredient lines when they come as JSON", () => {
    const formData = new FormData();
    formData.set("name", "Soupe");
    formData.set("lines", JSON.stringify([{ name: "Potiron", quantity: "1", unit: "kg", aisle: "produce" }]));
    expect(readDishForm(formData).lines).toEqual([{ name: "Potiron", quantity: "1", unit: "kg", aisle: "produce" }]);
  });

  it("should fall back to safe values when units or aisles are unknown", () => {
    const formData = new FormData();
    formData.set("lines", JSON.stringify([{ name: "Riz", unit: "tonne", aisle: "garage" }]));
    expect(readDishForm(formData).lines).toEqual([{ name: "Riz", quantity: "", unit: "g", aisle: undefined }]);
  });

  it("should return no lines when the JSON is broken", () => {
    const formData = new FormData();
    formData.set("lines", "{oops");
    expect(readDishForm(formData).lines).toEqual([]);
  });
});

describe("describeDish", () => {
  it("should show servings and calories when calories are known", () => {
    expect(describeDish({ servings: 4, kcal: 610 })).toBe("4 portions · 610 kcal par portion");
  });

  it("should show only servings when calories are unknown", () => {
    expect(describeDish({ servings: 1, kcal: null })).toBe("1 portion");
  });
});
