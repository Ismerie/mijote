import { describe, expect, it } from "vitest";

import { findByExactName, normalizeName, searchByName } from "./search";

const catalog = [
  { name: "Tomates concassées" },
  { name: "Tomates" },
  { name: "Bœuf haché" },
  { name: "Coulis de tomate" },
];

describe("normalizeName", () => {
  it("should ignore case, accents and ligatures when comparing names", () => {
    expect(normalizeName("  Bœuf Épicé ")).toBe("boeuf epice");
  });
});

describe("searchByName", () => {
  it("should return names containing the query when the user types part of a name", () => {
    expect(searchByName(catalog, "tom").map((i) => i.name)).toEqual([
      "Tomates",
      "Tomates concassées",
      "Coulis de tomate",
    ]);
  });

  it("should match without accents when the user types boeuf", () => {
    expect(searchByName(catalog, "boeuf").map((i) => i.name)).toEqual(["Bœuf haché"]);
  });

  it("should return nothing when the query is empty", () => {
    expect(searchByName(catalog, "  ")).toEqual([]);
  });

  it("should stop at the limit when many names match", () => {
    expect(searchByName(catalog, "t", 2)).toHaveLength(2);
  });
});

describe("findByExactName", () => {
  it("should find an ingredient when the name only differs by case and spaces", () => {
    expect(findByExactName(catalog, " tomates ")?.name).toBe("Tomates");
  });

  it("should return undefined when only part of the name matches", () => {
    expect(findByExactName(catalog, "tom")).toBeUndefined();
  });
});
