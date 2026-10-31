import { describe, expect, it } from "vitest";

import { describeSplit, portionsLabel, splitServings } from "./servings";

describe("splitServings", () => {
  it("should make 2 meals of 2 when a 4-serving recipe is for 2 people", () => {
    expect(splitServings(4, 2)).toEqual([2, 2]);
  });

  it("should put the remainder in its own meal when servings do not divide evenly", () => {
    expect(splitServings(5, 2)).toEqual([2, 2, 1]);
  });

  it("should make a single smaller meal when the recipe has fewer servings than people", () => {
    expect(splitServings(2, 4)).toEqual([2]);
  });
});

describe("portionsLabel", () => {
  it("should be singular when there is one serving", () => {
    expect(portionsLabel(1)).toBe("1 portion");
    expect(portionsLabel(4)).toBe("4 portions");
  });
});

describe("describeSplit", () => {
  it("should count the cards when the recipe is added twice", () => {
    expect(describeSplit(4, 2, 2)).toBe("2 cartes de 4 portions → 2 repas pour 2");
  });

  it("should show the remainder when servings do not divide evenly", () => {
    expect(describeSplit(5, 1, 2)).toBe("5 portions → 2 repas pour 2 + 1 portion");
  });

  it("should show a single meal when the recipe is smaller than the household", () => {
    expect(describeSplit(1, 1, 2)).toBe("1 portion → 1 repas");
  });
});
