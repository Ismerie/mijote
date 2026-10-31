import { describe, expect, it } from "vitest";

import { describePurchase, formatQuantity } from "./format";

describe("formatQuantity", () => {
  it("should show the number and unit when the unit is a weight", () => {
    expect(formatQuantity(250, "g")).toBe("250 g");
  });

  it("should use a decimal comma when the quantity is not whole", () => {
    expect(formatQuantity(1.5, "tbsp")).toBe("1,5 c. à s.");
  });

  it("should show only the number when the unit is a piece", () => {
    expect(formatQuantity(2, "piece")).toBe("2");
  });

  it("should show nothing when there is no quantity", () => {
    expect(formatQuantity(null, "g")).toBe("");
  });
});

describe("describePurchase", () => {
  const base = { packName: null, packSize: null, packUnit: null };

  it("should describe a pack with its name and size when bought in packs", () => {
    expect(describePurchase({ purchaseMode: "pack", packName: "boîte", packSize: 400, packUnit: "g" })).toBe(
      "boîte de 400 g",
    );
  });

  it("should count pieces when a pack holds pieces", () => {
    expect(describePurchase({ purchaseMode: "pack", packName: "boîte", packSize: 6, packUnit: "piece" })).toBe(
      "boîte de 6 pièces",
    );
  });

  it("should say by weight when bought by weight", () => {
    expect(describePurchase({ purchaseMode: "weight", ...base })).toBe("au poids");
  });

  it("should say in pieces when bought by the piece", () => {
    expect(describePurchase({ purchaseMode: "piece", ...base })).toBe("en pièces");
  });
});
