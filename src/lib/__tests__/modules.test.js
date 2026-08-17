import { describe, expect, it } from "vitest";
import { conditionOfTheDay, selectBaselineQuestions } from "../modules";

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

  it("respects focusModule when it has cases", () => {
    const pick = conditionOfTheDay(cases, "msk", "2026-08-17");
    expect(pick.module).toBe("msk");
  });

  it("falls back to the full pool when focusModule has no cases", () => {
    const pick = conditionOfTheDay(cases, "cardio", "2026-08-17");
    expect(pick).not.toBeNull();
  });

  it("returns null for an empty case list", () => {
    expect(conditionOfTheDay([], null, "2026-08-17")).toBeNull();
  });
});

describe("selectBaselineQuestions", () => {
  it("returns the same fixed set on repeated calls", () => {
    const a = selectBaselineQuestions(cases, 2);
    const b = selectBaselineQuestions(cases, 2);
    expect(a).toEqual(b);
  });

  it("sorts by case id before flattening, so the first case alphabetically comes first", () => {
    const picks = selectBaselineQuestions(cases, 3);
    expect(picks.map((q) => q.caseId)).toEqual(["a-case", "a-case", "b-case"]);
  });

  it("caps at n even if more questions are available", () => {
    expect(selectBaselineQuestions(cases, 1)).toHaveLength(1);
  });

  it("returns fewer than n if the pool is smaller", () => {
    expect(selectBaselineQuestions(cases, 100)).toHaveLength(3);
  });
});
