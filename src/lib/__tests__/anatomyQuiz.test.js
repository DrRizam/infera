import { describe, expect, it } from "vitest";
import { buildAnatomyPool, pickQuiz } from "../anatomyQuiz";
import { MUSCLES } from "@/data/muscles";

const pool = buildAnatomyPool(MUSCLES);

describe("buildAnatomyPool", () => {
  it("makes several question types for each muscle", () => {
    expect(pool.length).toBeGreaterThan(MUSCLES.length * 3);
    expect(new Set(pool.map((q) => q.type))).toEqual(new Set(["identify", "action", "nerve", "root"]));
  });

  it("every question has 4 distinct options and a valid correct index", () => {
    for (const q of pool) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options[q.correct]).toBeDefined();
      expect(q.correct).toBeGreaterThanOrEqual(0);
      expect(q.correct).toBeLessThan(4);
    }
  });

  it("the correct answer matches the muscle's real data", () => {
    const nerveQ = pool.find((q) => q.id === "supraspinatus:nerve");
    expect(nerveQ.options[nerveQ.correct]).toBe("Suprascapular nerve");
    const actionQ = pool.find((q) => q.id === "tibialis-anterior:action");
    expect(actionQ.options[actionQ.correct]).toMatch(/[Dd]orsiflexion/);
  });
});

describe("pickQuiz", () => {
  it("returns the requested count with no repeated muscle", () => {
    const q = pickQuiz(pool, { count: 10 });
    expect(q).toHaveLength(10);
    expect(new Set(q.map((x) => x.muscleId)).size).toBe(10);
  });

  it("can restrict question types", () => {
    const q = pickQuiz(pool, { count: 12, types: ["action", "nerve"] });
    expect(q.every((x) => ["action", "nerve"].includes(x.type))).toBe(true);
  });
});
