import { describe, expect, it } from "vitest";

import { MIN_PASSWORD_LENGTH, validateEmail, validatePassword } from "./credentials";

describe("validateEmail", () => {
  it("accepte une adresse ordinaire", () => {
    expect(validateEmail("alex@exemple.fr")).toBeNull();
  });

  it("refuse une adresse sans @ ou sans domaine", () => {
    expect(validateEmail("alex")).not.toBeNull();
    expect(validateEmail("alex@exemple")).not.toBeNull();
    expect(validateEmail("")).not.toBeNull();
  });
});

describe("validatePassword", () => {
  it("accepte le minimum exact", () => {
    expect(validatePassword("a".repeat(MIN_PASSWORD_LENGTH))).toBeNull();
  });

  it("refuse un mot de passe trop court", () => {
    expect(validatePassword("a".repeat(MIN_PASSWORD_LENGTH - 1))).not.toBeNull();
  });
});
