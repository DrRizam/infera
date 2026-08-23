import { describe, expect, it } from "vitest";
import { OSCE_CASE_COUNT, OSCE_PASS_THRESHOLD, scoreOsceSession, selectOsceCases, xpForOsceSession } from "../osce";

const CASES = [
  { id: "a", module: "msk", body_region: "knee" },
  { id: "b", module: "msk", body_region: "knee" },
  { id: "c", module: "msk", body_region: "hip" },
  { id: "d", module: "msk", body_region: "hip" },
  { id: "e", module: "sports", body_region: "shoulder" },
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

  it("filters by body_region when axis is 'region'", () => {
    const picked = selectOsceCases(CASES, "knee", "region");
    expect(picked).toHaveLength(2);
    expect(picked.every((c) => c.body_region === "knee")).toBe(true);
  });

  it("defaults to the module axis when none is given", () => {
    const picked = selectOsceCases(CASES, "msk");
    expect(picked.every((c) => c.module === "msk")).toBe(true);
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
