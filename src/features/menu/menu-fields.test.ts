import { describe, expect, it } from "vitest";

import { MAX_TIMES, validateAdditions } from "./menu-fields";

describe("validateAdditions", () => {
  it("should repeat a dish id once per time when a recipe is added several times", () => {
    expect(
      validateAdditions([
        { dishId: "lasagnes", times: 1 },
        { dishId: "curry", times: 2 },
      ]),
    ).toEqual(["lasagnes", "curry", "curry"]);
  });

  it("should refuse when nothing is chosen", () => {
    expect(validateAdditions([])).toBeNull();
  });

  it("should refuse when a count is out of range or not whole", () => {
    expect(validateAdditions([{ dishId: "curry", times: 0 }])).toBeNull();
    expect(validateAdditions([{ dishId: "curry", times: MAX_TIMES + 1 }])).toBeNull();
    expect(validateAdditions([{ dishId: "curry", times: 1.5 }])).toBeNull();
  });

  it("should refuse when a dish id is missing", () => {
    expect(validateAdditions([{ dishId: "", times: 1 }])).toBeNull();
  });
});
