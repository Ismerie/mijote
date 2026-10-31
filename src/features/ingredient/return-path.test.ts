import { describe, expect, it } from "vitest";

import { ingredientReturnPath, isIngredientReturnPath } from "./return-path";

const MENU = "0b8c2f4e-1d3a-4c5b-9e7f-123456789abc";

describe("ingredientReturnPath", () => {
  it("should go back to the shopping list of the menu when opened from it", () => {
    expect(ingredientReturnPath("courses", MENU)).toBe(`/courses?menu=${MENU}`);
  });

  it("should go back to the shopping list when the menu id is not valid", () => {
    expect(ingredientReturnPath("courses", "https://example.com")).toBe("/courses");
  });

  it("should go back to the catalogue when opened from anywhere else", () => {
    expect(ingredientReturnPath(undefined, MENU)).toBe("/plats/ingredients");
  });
});

describe("isIngredientReturnPath", () => {
  it("should accept the paths the ingredient page builds", () => {
    expect(isIngredientReturnPath("/plats/ingredients")).toBe(true);
    expect(isIngredientReturnPath(`/courses?menu=${MENU}`)).toBe(true);
  });

  it("should refuse any other path", () => {
    expect(isIngredientReturnPath("//example.com")).toBe(false);
    expect(isIngredientReturnPath("/courses?menu=x&next=/foo")).toBe(false);
  });
});
