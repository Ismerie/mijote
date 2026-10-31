import { describe, expect, it } from "vitest";

import { parseDecimal } from "./decimal";

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
