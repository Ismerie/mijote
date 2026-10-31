import { describe, expect, it } from "vitest";

import { MAX_PEOPLE_COUNT, MIN_PEOPLE_COUNT, validatePeopleCount } from "./household-fields";

describe("validatePeopleCount", () => {
  it("accepte les bornes et les valeurs entre les deux", () => {
    expect(validatePeopleCount(MIN_PEOPLE_COUNT)).toBeNull();
    expect(validatePeopleCount(2)).toBeNull();
    expect(validatePeopleCount(MAX_PEOPLE_COUNT)).toBeNull();
  });

  it("refuse les valeurs hors bornes", () => {
    expect(validatePeopleCount(MIN_PEOPLE_COUNT - 1)).not.toBeNull();
    expect(validatePeopleCount(MAX_PEOPLE_COUNT + 1)).not.toBeNull();
  });

  it("refuse les nombres non entiers et NaN", () => {
    expect(validatePeopleCount(2.5)).not.toBeNull();
    expect(validatePeopleCount(Number.NaN)).not.toBeNull();
  });
});
