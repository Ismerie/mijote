import { describe, expect, it } from "vitest";

import {
  addDays,
  lastShoppingDay,
  lengthLabel,
  longDate,
  nextMenuStart,
  rangeLabel,
  shortDate,
  shortDay,
  todayInParis,
  weekday,
} from "./dates";

const SATURDAY = 5;

describe("weekday", () => {
  it("should count from Monday when the date is a Saturday", () => {
    expect(weekday("2026-10-24")).toBe(SATURDAY);
    expect(weekday("2026-10-26")).toBe(0);
  });
});

describe("lastShoppingDay", () => {
  it("should return today when today is the shopping day", () => {
    expect(lastShoppingDay("2026-10-24", SATURDAY)).toBe("2026-10-24");
  });

  it("should go back to the last Saturday when today is a Thursday", () => {
    expect(lastShoppingDay("2026-10-29", SATURDAY)).toBe("2026-10-24");
  });

  it("should go back six days when the shopping day was yesterday a week ago", () => {
    expect(lastShoppingDay("2026-10-30", SATURDAY)).toBe("2026-10-24");
  });
});

describe("nextMenuStart", () => {
  it("should start the day after the menu when that day is the shopping day", () => {
    expect(nextMenuStart("2026-10-17", 14, SATURDAY)).toBe("2026-10-31");
  });

  it("should move to the next shopping day when the shopping day changed", () => {
    // Menu du sam. 17 au ven. 30 ; le foyer fait maintenant ses courses le lundi.
    expect(nextMenuStart("2026-10-17", 14, 0)).toBe("2026-11-02");
  });
});

describe("labels", () => {
  it("should end a two-week menu 13 days later when it starts on Saturday", () => {
    expect(addDays("2026-10-24", 13)).toBe("2026-11-06");
    expect(rangeLabel("2026-10-24", 14)).toBe("Du sam. 24 oct. au ven. 6 nov.");
  });

  it("should write dates the French way", () => {
    expect(shortDate("2026-10-17")).toBe("sam. 17 oct.");
    expect(shortDay("2026-10-20")).toBe("mar. 20");
    expect(longDate("2026-10-20")).toBe("mardi 20 oct.");
  });

  it("should write the length in weeks", () => {
    expect(lengthLabel(7)).toBe("1 semaine");
    expect(lengthLabel(14)).toBe("2 semaines");
  });
});

describe("todayInParis", () => {
  it("should already be tomorrow in Paris when it is late evening in UTC", () => {
    expect(todayInParis(new Date("2026-10-24T23:30:00Z"))).toBe("2026-10-25");
  });
});
