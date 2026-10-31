import { describe, expect, it } from "vitest";

import { EMPTY_INGREDIENT_VALUES, packHint, readIngredientForm, validateIngredient } from "./ingredient-fields";

const tomatoes = { ...EMPTY_INGREDIENT_VALUES, name: " Tomates concassées ", aisle: "grocery" as const };

describe("validateIngredient", () => {
  it("should clear the pack fields when the ingredient is not bought in packs", () => {
    expect(validateIngredient({ ...tomatoes, packName: "boîte", packSize: "400" })).toEqual({
      input: {
        name: "Tomates concassées",
        aisle: "grocery",
        purchaseMode: "weight",
        packName: null,
        packSize: null,
        packUnit: null,
        alwaysInStock: false,
      },
    });
  });

  it("should keep the pack when bought as a 400 g can", () => {
    const values = { ...tomatoes, purchaseMode: "pack" as const, packName: " boîte ", packSize: "400", packUnit: "g" as const };
    expect(validateIngredient(values).input).toMatchObject({ packName: "boîte", packSize: 400, packUnit: "g" });
  });

  it("should refuse when the name is empty", () => {
    expect(validateIngredient({ ...tomatoes, name: "  " }).error).toBeDefined();
  });

  it("should refuse when a pack has no name", () => {
    const values = { ...tomatoes, purchaseMode: "pack" as const, packName: "", packSize: "400" };
    expect(validateIngredient(values).error).toBeDefined();
  });

  it("should refuse when a pack size is missing or not positive", () => {
    const pack = { ...tomatoes, purchaseMode: "pack" as const, packName: "boîte" };
    expect(validateIngredient({ ...pack, packSize: "" }).error).toBeDefined();
    expect(validateIngredient({ ...pack, packSize: "0" }).error).toBeDefined();
  });
});

describe("readIngredientForm", () => {
  it("should read always in stock when the switch is on", () => {
    const formData = new FormData();
    formData.set("name", "Sel");
    formData.set("alwaysInStock", "true");
    expect(readIngredientForm(formData)).toMatchObject({ name: "Sel", alwaysInStock: true });
  });

  it("should fall back to safe values when the choices are unknown", () => {
    const formData = new FormData();
    formData.set("aisle", "garage");
    formData.set("purchaseMode", "free");
    formData.set("packUnit", "tonne");
    expect(readIngredientForm(formData)).toMatchObject({ aisle: "other", purchaseMode: "weight", packUnit: "g" });
  });
});

describe("packHint", () => {
  it("should name the pack in the plural when a name is given", () => {
    expect(packHint("boîte")).toBe("Dans la liste : le nombre de boîtes, arrondi au-dessus.");
  });
});
