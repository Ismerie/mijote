import { describe, expect, it } from "vitest";
import { safeNextPath, withNext } from "./next-path";

describe("safeNextPath", () => {
  it("garde une adresse interne à l'app", () => {
    expect(safeNextPath("/plats")).toBe("/plats");
    expect(safeNextPath("/plats?q=soupe")).toBe("/plats?q=soupe");
  });

  it("renvoie à l'accueil pour une adresse vers un autre site", () => {
    expect(safeNextPath("//autre-site.com")).toBe("/");
    expect(safeNextPath("/\\autre-site.com")).toBe("/");
    expect(safeNextPath("https://autre-site.com")).toBe("/");
  });

  it("renvoie à l'accueil si la valeur n'est pas une adresse", () => {
    expect(safeNextPath(undefined)).toBe("/");
    expect(safeNextPath(["/plats"])).toBe("/");
    expect(safeNextPath("")).toBe("/");
  });
});

describe("withNext", () => {
  it("n'ajoute rien quand la page demandée est l'accueil", () => {
    expect(withNext("/inscription", "/")).toBe("/inscription");
  });

  it("ajoute la page demandée en paramètre encodé", () => {
    expect(withNext("/inscription", "/plats?q=soupe")).toBe("/inscription?suivant=%2Fplats%3Fq%3Dsoupe");
  });
});
