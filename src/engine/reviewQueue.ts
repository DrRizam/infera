// ── Unified review queue ───────────────────────────────────────────────────
// Case-encounter mistakes and condition knowledge-check misses each generate
// their own review material (CaseReviewCard, ConditionReviewSeed) using
// domain logic that stays in cases/ and conditions/ respectively. This file
// is only the merge point: one storage shape, one due/mastery query, so both
// kinds of review material can sit in the same profile field and the same
// session queue as drills.

import type { CaseReviewCard } from "./case/reviewCards";
import { review, type Grade } from "./fsrs";
import { todayISO } from "./srs";

export type ReviewSource = "case" | "condition";

export interface ReviewQueueItem {
  id: string;
  source: ReviewSource;
  prompt: string;
  answer: string;
  severity: "critical" | "high" | "moderate";
  because: string;
  createdOn: string;
  stability: number;
  difficulty: number;
  dueDate: string;
  lastReview: string | null;
  reps: number;
  lapses: number;
}

/** Map already-scheduled case review cards into the shared queue shape. */
export function fromCaseCards(cards: CaseReviewCard[]): ReviewQueueItem[] {
  return cards.map((c) => ({
    id: `case:${c.id}`,
    source: "case",
    prompt: c.prompt,
    answer: c.answer,
    severity: c.severity,
    because: c.because,
    createdOn: c.createdOn,
    stability: c.stability,
    difficulty: c.difficulty,
    dueDate: c.dueDate,
    lastReview: c.lastReview,
    reps: c.reps,
    lapses: c.lapses,
  }));
}

/**
 * A card is mastered once it has survived several reviews across a long
 * interval. Mirrors reviewCards.ts's isMastered — critical cards are held to
 * a higher bar, since surviving one recall of a missed emergency isn't
 * mastery.
 */
export function isQueueItemMastered(item: ReviewQueueItem): boolean {
  const repsNeeded = item.severity === "critical" ? 4 : 3;
  const stabilityNeeded = item.severity === "critical" ? 60 : 30;
  return item.reps >= repsNeeded && item.stability >= stabilityNeeded;
}

/** Due queue items, most dangerous first — mirrors reviewCards.ts's dueCards. */
export function dueQueueItems(
  items: Record<string, ReviewQueueItem>,
  today: string = todayISO()
): ReviewQueueItem[] {
  const rank = { critical: 0, high: 1, moderate: 2 };
  return Object.values(items)
    .filter((i) => i.dueDate <= today && !isQueueItemMastered(i))
    .sort((a, b) => rank[a.severity] - rank[b.severity] || a.dueDate.localeCompare(b.dueDate));
}

/** Apply a graded review to a queue item, returning the rescheduled copy. */
export function reviewQueueItem(
  item: ReviewQueueItem,
  grade: Grade,
  today: string = todayISO()
): ReviewQueueItem {
  const next = review(
    {
      stability: item.stability,
      difficulty: item.difficulty,
      due: item.dueDate,
      lastReview: item.lastReview,
      reps: item.reps,
      lapses: item.lapses,
    },
    grade,
    today
  );
  return {
    ...item,
    stability: next.stability,
    difficulty: next.difficulty,
    dueDate: next.due,
    lastReview: next.lastReview,
    reps: next.reps,
    lapses: next.lapses,
  };
}
