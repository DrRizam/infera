import { describe, expect, it } from "vitest";
import {
  attributeMatches,
  buildDiagnosisOptions,
  buildShareGrid,
  currentCaseNumber,
  editDistance,
  filterDiagnosisOptions,
  findMatchingCase,
  normalizeGuess,
  scoreForResult,
  updateGameStreak,
  validateCaseSubmission,
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

  it("resolves a single distinctive word to the one case it belongs to", () => {
    expect(findMatchingCase("acl", BANK)).toBe(CASE_B);
  });

  it("does not resolve a single word shared by more than one case", () => {
    const ambiguousBank = [
      { ...CASE_A, diagnosis: "Meniscus tear", synonyms: [] },
      { ...CASE_B, diagnosis: "Rotator cuff tear", synonyms: [] },
    ];
    expect(findMatchingCase("tear", ambiguousBank)).toBeNull();
  });

  it("does not apply the single-word fallback to a multi-word guess", () => {
    expect(findMatchingCase("acl syndrome", BANK)).toBeNull();
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

describe("updateGameStreak", () => {
  it("starts a fresh streak at 1 on a first-ever win", () => {
    const s = updateGameStreak(null, 1, true);
    expect(s.current_streak).toBe(1);
    expect(s.longest_streak).toBe(1);
    expect(s.total_played).toBe(1);
    expect(s.total_won).toBe(1);
  });

  it("extends the streak on a win on the very next case number", () => {
    const prev = { current_streak: 3, longest_streak: 5, total_played: 4, total_won: 3, last_completed_case_number: 4 };
    const s = updateGameStreak(prev, 5, true);
    expect(s.current_streak).toBe(4);
    expect(s.longest_streak).toBe(5);
  });

  it("resets the streak to 1 on a win after a gap", () => {
    const prev = { current_streak: 3, longest_streak: 5, total_played: 4, total_won: 3, last_completed_case_number: 4 };
    const s = updateGameStreak(prev, 8, true);
    expect(s.current_streak).toBe(1);
  });

  it("breaks the streak to 0 on a loss, even mid-streak", () => {
    const prev = { current_streak: 3, longest_streak: 5, total_played: 4, total_won: 3, last_completed_case_number: 4 };
    const s = updateGameStreak(prev, 5, false);
    expect(s.current_streak).toBe(0);
    expect(s.longest_streak).toBe(5);
    expect(s.total_played).toBe(5);
    expect(s.total_won).toBe(3);
  });

  it("tracks longest_streak as the running max, not just the latest", () => {
    let s = updateGameStreak(null, 1, true);
    s = updateGameStreak(s, 2, true);
    s = updateGameStreak(s, 3, false);
    s = updateGameStreak(s, 4, true);
    expect(s.current_streak).toBe(1);
    expect(s.longest_streak).toBe(2);
  });

  it("is a no-op if the same case number is completed again", () => {
    const prev = { current_streak: 3, longest_streak: 5, total_played: 4, total_won: 3, last_completed_case_number: 4 };
    const s = updateGameStreak(prev, 4, true);
    expect(s).toBe(prev);
  });
});

const VALID_SUBMISSION = {
  diagnosis: "Lateral epicondylalgia",
  region: "elbow",
  system: "musculoskeletal",
  tissue: "tendon",
  chronicity: "chronic",
  mechanism: "overuse",
  explanation: "An overuse tendinopathy of the common extensor origin.",
  clues: ["a", "b", "c", "d", "e", "f"],
};

describe("validateCaseSubmission", () => {
  it("returns no errors for a complete submission", () => {
    expect(validateCaseSubmission(VALID_SUBMISSION)).toEqual({});
  });

  it("flags missing required text fields", () => {
    const errors = validateCaseSubmission({ ...VALID_SUBMISSION, diagnosis: "  ", region: "" });
    expect(errors.diagnosis).toBeTruthy();
    expect(errors.region).toBeTruthy();
    expect(errors.tissue).toBeUndefined();
  });

  it("requires exactly 6 non-empty clues", () => {
    expect(validateCaseSubmission({ ...VALID_SUBMISSION, clues: ["a", "b"] }).clues).toBeTruthy();
    expect(validateCaseSubmission({ ...VALID_SUBMISSION, clues: ["a", "b", "c", "d", "e", "  "] }).clues).toBeTruthy();
    expect(validateCaseSubmission({ ...VALID_SUBMISSION, clues: ["a", "b", "c", "d", "e", "f", "g"] }).clues).toBeTruthy();
  });

  it("handles missing fields object gracefully", () => {
    const errors = validateCaseSubmission(undefined);
    expect(errors.diagnosis).toBeTruthy();
    expect(errors.clues).toBeTruthy();
  });
});

describe("buildDiagnosisOptions", () => {
  it("includes each case's diagnosis and all its synonyms", () => {
    const options = buildDiagnosisOptions(BANK);
    const labels = options.map((o) => o.label);
    expect(labels).toContain("Lateral epicondylalgia");
    expect(labels).toContain("tennis elbow");
    expect(labels).toContain("acl tear");
  });

  it("dedupes terms that normalize the same way, even across cases", () => {
    const bank = [CASE_A, { ...CASE_B, synonyms: [...CASE_B.synonyms, "Lateral Epicondylalgia"] }];
    const options = buildDiagnosisOptions(bank);
    expect(options.filter((o) => o.label.toLowerCase() === "lateral epicondylalgia")).toHaveLength(1);
  });

  it("sorts alphabetically", () => {
    const labels = buildDiagnosisOptions(BANK).map((o) => o.label);
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)));
  });

  it("returns an empty list for an empty bank", () => {
    expect(buildDiagnosisOptions([])).toEqual([]);
  });
});

describe("filterDiagnosisOptions", () => {
  const options = buildDiagnosisOptions(BANK);

  it("matches a substring anywhere in the label, case-insensitively", () => {
    const matches = filterDiagnosisOptions(options, "ACL");
    expect(matches.map((o) => o.label)).toEqual(expect.arrayContaining(["acl tear", "acl rupture"]));
  });

  it("returns nothing for an empty query", () => {
    expect(filterDiagnosisOptions(options, "")).toEqual([]);
    expect(filterDiagnosisOptions(options, "   ")).toEqual([]);
  });

  it("caps results at the given limit", () => {
    expect(filterDiagnosisOptions(options, "a", 2)).toHaveLength(2);
  });
});
