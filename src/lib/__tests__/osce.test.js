import { describe, expect, it } from "vitest";
import { OSCE_CASE_COUNT, OSCE_PASS_THRESHOLD, scoreOsceSession, selectOsceCases, xpForOsceSession } from "../osce";

const CASES = [
  { id: "a", module: "msk" },
  { id: "b", module: "msk" },
  { id: "c", module: "msk" },
  { id: "d", module: "msk" },
  { id: "e", module: "sports" },
];

describe("selectOsceCases", () => {
  it("returns OSCE_CASE_COUNT distinct cases from the requested module", () => {
    const picked = selectOsceCases(CASES, "msk");
    expect(picked).toHaveLength(OSCE_CASE_COUNT);
    expect(new Set(picked.map((c) => c.id)).size).toBe(OSCE_CASE_COUNT);
    expect(picked.every((c) => c.module === "msk")).toBe(true);
  });

  it("pulls from the whole bank when moduleId is falsy (Mixed)", () => {
    const picked = selectOsceCases(CASES, null);
    expect(picked).toHaveLength(OSCE_CASE_COUNT);
  });

  it("returns fewer than the count if the pool is smaller", () => {
    const picked = selectOsceCases(CASES, "sports");
    expect(picked).toHaveLength(1);
  });

  it("returns an empty array for an empty bank", () => {
    expect(selectOsceCases([], "msk")).toHaveLength(0);
  });
});

describe("scoreOsceSession", () => {
  it("averages accuracy across cases", () => {
    const s = scoreOsceSession([{ accuracy: 80 }, { accuracy: 60 }, { accuracy: 100 }]);
    expect(s.overallAccuracy).toBe(80);
  });

  it("passes at or above the threshold", () => {
    expect(scoreOsceSession([{ accuracy: OSCE_PASS_THRESHOLD }]).passed).toBe(true);
    expect(scoreOsceSession([{ accuracy: OSCE_PASS_THRESHOLD - 1 }]).passed).toBe(false);
  });

  it("handles an empty result list without dividing by zero", () => {
    expect(scoreOsceSession([])).toEqual({ overallAccuracy: 0, passed: false });
  });
});

describe("xpForOsceSession", () => {
  it("scales with accuracy", () => {
    expect(xpForOsceSession(0)).toBe(0);
    expect(xpForOsceSession(100)).toBe(150);
    expect(xpForOsceSession(80)).toBe(120);
  });
});
