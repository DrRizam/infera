import { describe, expect, it } from "vitest";
import type { CaseReviewCard } from "../case/reviewCards";
import { Again, Good } from "../fsrs";
import { dueQueueItems, fromCaseCards, isQueueItemMastered, reviewQueueItem, type ReviewQueueItem } from "../reviewQueue";

function makeCaseCard(overrides: Partial<CaseReviewCard> = {}): CaseReviewCard {
  return {
    id: "knee-anterior-runner:missed-red-flag:night-pain",
    caseId: "knee-anterior-runner",
    kind: "missed-red-flag",
    prompt: "What does night pain signify?",
    answer: "Possible bone stress injury or malignancy — warrants investigation.",
    severity: "critical",
    because: 'You did not identify this in "The Runner\'s Persistent Knee".',
    createdOn: "2026-08-01",
    stability: 1,
    difficulty: 5,
    dueDate: "2026-08-02",
    lastReview: "2026-08-01",
    reps: 0,
    lapses: 0,
    ...overrides,
  };
}

function makeItem(overrides: Partial<ReviewQueueItem> = {}): ReviewQueueItem {
  return {
    id: "case:x",
    source: "case",
    prompt: "p",
    answer: "a",
    severity: "moderate",
    because: "b",
    createdOn: "2026-08-01",
    stability: 1,
    difficulty: 5,
    dueDate: "2026-08-01",
    lastReview: "2026-07-31",
    reps: 0,
    lapses: 0,
    ...overrides,
  };
}

describe("fromCaseCards", () => {
  it("maps every field into the shared queue shape and prefixes the id", () => {
    const [item] = fromCaseCards([makeCaseCard()]);
    expect(item.id).toBe("case:knee-anterior-runner:missed-red-flag:night-pain");
    expect(item.source).toBe("case");
    expect(item.prompt).toBe("What does night pain signify?");
    expect(item.severity).toBe("critical");
    expect(item.stability).toBe(1);
    expect(item.dueDate).toBe("2026-08-02");
  });
});

describe("isQueueItemMastered", () => {
  it("holds critical items to a higher bar than other severities", () => {
    expect(isQueueItemMastered(makeItem({ severity: "critical", reps: 4, stability: 60 }))).toBe(true);
    expect(isQueueItemMastered(makeItem({ severity: "critical", reps: 3, stability: 60 }))).toBe(false);
    expect(isQueueItemMastered(makeItem({ severity: "critical", reps: 4, stability: 59 }))).toBe(false);
    expect(isQueueItemMastered(makeItem({ severity: "moderate", reps: 3, stability: 30 }))).toBe(true);
    expect(isQueueItemMastered(makeItem({ severity: "moderate", reps: 2, stability: 30 }))).toBe(false);
  });
});

describe("dueQueueItems", () => {
  it("filters to due, unmastered items and ranks most dangerous first", () => {
    const items: Record<string, ReviewQueueItem> = {
      moderate: makeItem({ id: "moderate", severity: "moderate", dueDate: "2026-08-01" }),
      critical: makeItem({ id: "critical", severity: "critical", dueDate: "2026-08-01" }),
      high: makeItem({ id: "high", severity: "high", dueDate: "2026-08-01" }),
      notDue: makeItem({ id: "notDue", severity: "critical", dueDate: "2026-08-05" }),
      mastered: makeItem({ id: "mastered", severity: "moderate", dueDate: "2026-08-01", reps: 5, stability: 40 }),
    };
    const due = dueQueueItems(items, "2026-08-01");
    expect(due.map((i) => i.id)).toEqual(["critical", "high", "moderate"]);
  });
});

describe("reviewQueueItem", () => {
  it("reschedules further out on a good recall", () => {
    const item = makeItem({ stability: 1, reps: 1, lastReview: "2026-08-01", dueDate: "2026-08-02" });
    const next = reviewQueueItem(item, Good, "2026-08-02");
    expect(next.stability).toBeGreaterThan(item.stability);
    expect(next.reps).toBe(2);
    expect(next.dueDate > "2026-08-02").toBe(true);
  });

  it("resets reps and pulls the due date back in on Again", () => {
    const item = makeItem({ stability: 20, reps: 3, lastReview: "2026-08-01", dueDate: "2026-08-10" });
    const next = reviewQueueItem(item, Again, "2026-08-10");
    expect(next.reps).toBe(0);
    expect(next.dueDate).toBe("2026-08-11");
  });
});
