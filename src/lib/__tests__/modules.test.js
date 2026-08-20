import { describe, expect, it } from "vitest";
import { conditionOfTheDay } from "../modules";

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
