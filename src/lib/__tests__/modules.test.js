import { describe, expect, it } from "vitest";
import { bossRoundKey, conditionOfTheDay, placementSkipCount } from "../modules";

const cases = [
  { id: "b-case", module: "sports", speed_questions: [{ prompt: "b1", options: ["x", "y"], correct: 0 }] },
  {
    id: "a-case",
    module: "msk",
    speed_questions: [
      { prompt: "a1", options: ["x", "y"], correct: 0 },
      { prompt: "a2", options: ["x", "y", "z"], correct: 1 },
    ],
  },
  { id: "c-case", module: "msk", speed_questions: [] },
];

describe("conditionOfTheDay", () => {
  it("is deterministic for the same inputs", () => {
    const a = conditionOfTheDay(cases, null, "2026-08-17");
    const b = conditionOfTheDay(cases, null, "2026-08-17");
    expect(a).toEqual(b);
  });

  it("rotates across days", () => {
    const picks = new Set(
      Array.from({ length: 10 }, (_, i) => conditionOfTheDay(cases, null, `2026-08-${10 + i}`).id)
    );
    expect(picks.size).toBeGreaterThan(1);
  });

  it("respects focusModules when they have cases", () => {
    const pick = conditionOfTheDay(cases, ["msk"], "2026-08-17");
    expect(pick.module).toBe("msk");
  });

  it("picks from any of several focus modules", () => {
    const pick = conditionOfTheDay(cases, ["msk", "sports"], "2026-08-17");
    expect(["msk", "sports"]).toContain(pick.module);
  });

  it("falls back to the full pool when focusModules have no cases", () => {
    const pick = conditionOfTheDay(cases, ["cardio"], "2026-08-17");
    expect(pick).not.toBeNull();
  });

  it("returns null for an empty case list", () => {
    expect(conditionOfTheDay([], null, "2026-08-17")).toBeNull();
  });
});

describe("placementSkipCount", () => {
  const path = [
    { id: "1", difficulty: 1 },
    { id: "2", difficulty: 1 },
    { id: "3", difficulty: 2 },
    { id: "4", difficulty: 3 },
    { id: "5", difficulty: 1 },
  ];

  it("never skips for a self-reported student", () => {
    expect(placementSkipCount(path, "student")).toBe(0);
  });

  it("skips only leading difficulty-1 cases for some experience", () => {
    expect(placementSkipCount(path, "some")).toBe(2);
  });

  it("skips leading difficulty <=2 cases for experienced, stopping at the first harder node", () => {
    expect(placementSkipCount(path, "experienced")).toBe(3);
  });

  it("caps the skip so an all-easy run can't clear the whole path", () => {
    const allEasy = Array.from({ length: 8 }, (_, i) => ({ id: String(i), difficulty: 1 }));
    expect(placementSkipCount(allEasy, "some")).toBe(5);
  });

  it("returns 0 for unknown/missing experience level", () => {
    expect(placementSkipCount(path, null)).toBe(0);
    expect(placementSkipCount(path, "unknown")).toBe(0);
  });
});

describe("bossRoundKey", () => {
  it("keeps the original unprefixed format for the module axis (backward compat)", () => {
    expect(bossRoundKey("module", "sports", 0)).toBe("sports:0");
  });

  it("namespaces the region axis so it can't collide with module keys", () => {
    expect(bossRoundKey("region", "knee", 1)).toBe("region:knee:1");
  });
});
