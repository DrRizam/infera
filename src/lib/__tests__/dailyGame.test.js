import { describe, expect, it } from "vitest";
import {
  attributeMatches,
  buildShareGrid,
  currentCaseNumber,
  editDistance,
  findMatchingCase,
  normalizeGuess,
  scoreForResult,
  visibleClueCount,
} from "../dailyGame";

const CASE_A = {
  id: "case-a",
  diagnosis: "Lateral epicondylalgia",
  synonyms: ["tennis elbow", "lateral epicondylitis"],
  region: "elbow",
  system: "musculoskeletal",
  tissue: "tendon",
  chronicity: "chronic",
  mechanism: "overuse",
};

const CASE_B = {
  id: "case-b",
  diagnosis: "Anterior cruciate ligament tear",
  synonyms: ["acl tear", "acl rupture"],
  region: "knee",
  system: "musculoskeletal",
  tissue: "ligament",
  chronicity: "acute",
  mechanism: "traumatic",
};

const BANK = [CASE_A, CASE_B];

describe("currentCaseNumber", () => {
  it("is #1 on the launch date itself", () => {
    expect(currentCaseNumber(new Date(2026, 7, 20), "2026-08-20")).toBe(1);
  });

  it("increments by exactly one per local calendar day", () => {
    expect(currentCaseNumber(new Date(2026, 7, 21), "2026-08-20")).toBe(2);
    expect(currentCaseNumber(new Date(2026, 7, 25), "2026-08-20")).toBe(6);
  });

  it("doesn't care what time of day it is, only the calendar date", () => {
    const morning = new Date(2026, 7, 22, 0, 5);
    const night = new Date(2026, 7, 22, 23, 55);
    expect(currentCaseNumber(morning, "2026-08-20")).toBe(currentCaseNumber(night, "2026-08-20"));
  });
});

describe("normalizeGuess", () => {
  it("lowercases, trims, and strips punctuation", () => {
    expect(normalizeGuess("  Tennis Elbow! ")).toBe("tennis elbow");
    expect(normalizeGuess("ACL-tear")).toBe("acltear");
  });

  it("collapses internal whitespace", () => {
    expect(normalizeGuess("tennis   elbow")).toBe("tennis elbow");
  });
});

describe("editDistance", () => {
  it("is zero for identical strings", () => {
    expect(editDistance("tennis elbow", "tennis elbow")).toBe(0);
  });

  it("counts single-character typos correctly", () => {
    expect(editDistance("tennis elbow", "tenis elbow")).toBe(1);
  });
});

describe("findMatchingCase", () => {
  it("matches the canonical diagnosis name", () => {
    expect(findMatchingCase("Lateral epicondylalgia", BANK)).toBe(CASE_A);
  });

  it("matches a synonym", () => {
    expect(findMatchingCase("tennis elbow", BANK)).toBe(CASE_A);
  });

  it("tolerates a small typo", () => {
    expect(findMatchingCase("tenis elbow", BANK)).toBe(CASE_A);
  });

  it("returns null for gibberish not in the bank", () => {
    expect(findMatchingCase("asdfghjkl", BANK)).toBeNull();
  });

  it("returns null for an empty guess", () => {
    expect(findMatchingCase("   ", BANK)).toBeNull();
  });
});

describe("attributeMatches", () => {
  it("flags every attribute true when comparing a case to itself", () => {
    const m = attributeMatches(CASE_A, CASE_A);
    expect(Object.values(m).every(Boolean)).toBe(true);
  });

  it("only flags the attributes that actually match between two different cases", () => {
    const m = attributeMatches(CASE_A, CASE_B);
    expect(m.system).toBe(true); // both musculoskeletal
    expect(m.region).toBe(false);
    expect(m.tissue).toBe(false);
    expect(m.chronicity).toBe(false);
    expect(m.mechanism).toBe(false);
  });
});

describe("visibleClueCount", () => {
  it("shows one clue before any guesses", () => {
    expect(visibleClueCount(0)).toBe(1);
  });

  it("reveals one more clue per guess made, capped at 6", () => {
    expect(visibleClueCount(3)).toBe(4);
    expect(visibleClueCount(5)).toBe(6);
    expect(visibleClueCount(6)).toBe(6);
  });
});

describe("scoreForResult", () => {
  it("is zero when not solved", () => {
    expect(scoreForResult("lost", 6)).toBe(0);
    expect(scoreForResult("in_progress", 2)).toBe(0);
  });

  it("rewards fewer guesses with more points", () => {
    const first = scoreForResult("won", 1);
    const last = scoreForResult("won", 6);
    expect(first).toBeGreaterThan(last);
  });
});

describe("buildShareGrid", () => {
  it("never includes the diagnosis text, only badges", () => {
    const guesses = [
      { attributes: { region: true, system: true, tissue: false, chronicity: false, mechanism: false } },
      { attributes: { region: true, system: true, tissue: true, chronicity: true, mechanism: true } },
    ];
    const grid = buildShareGrid(1, guesses, true);
    expect(grid).not.toMatch(/epicondylalgia|elbow/i);
    expect(grid).toContain("Infera Daily #1");
    expect(grid).toContain("2/6");
  });

  it("shows X/6 for a loss", () => {
    const grid = buildShareGrid(1, [], false);
    expect(grid).toContain("X/6");
  });
});
