// ── Lesson assembly ────────────────────────────────────────────────────────
// Turns a condition into an ordered set of single-concept cards. Pure logic:
// the player renders whatever this returns, so card order, gating and progress
// are all testable without React.

import type { Condition, Finding, Interaction } from "./schema";
import { essentialOnly } from "./schema";
import { Good, Hard, review, type Grade } from "../engine/fsrs";
import { todayISO } from "../engine/srs";
import type { ReviewQueueItem } from "../engine/reviewQueue";

export const CARD_IDS = [
  "snapshot",
  "location",
  "presentation",
  "examination",
  "does-not-fit",
  "differentials",
  "safety",
  "summary",
  "knowledge-check",
] as const;

export type CardId = (typeof CARD_IDS)[number];

/** Short label shown in the progress indicator: "3 of 9 · Typical symptoms". */
export const CARD_LABELS: Record<CardId, string> = {
  snapshot: "What is it?",
  location: "Where does it hurt?",
  presentation: "Typical symptoms",
  examination: "What you'd expect to find",
  "does-not-fit": "What doesn't fit",
  differentials: "What else could it be?",
  safety: "When to refer",
  summary: "Clinical summary",
  "knowledge-check": "Test your knowledge",
};

export interface LessonCard {
  id: CardId;
  label: string;
  interaction?: Interaction;
}

/**
 * Cards for the essential lesson. A card is skipped when the condition holds
 * no essential content for it, so a lesson never shows an empty screen just to
 * keep the numbering tidy.
 */
export function buildLesson(c: Condition): LessonCard[] {
  const has = (items: Finding[]) => essentialOnly(items).length > 0;

  const included: CardId[] = ["snapshot", "location", "presentation"];
  if (has(c.examination.expected) || has(c.examination.supportive)) included.push("examination");
  if (has(c.examination.doesNotFit)) included.push("does-not-fit");
  if (c.differentials.length > 0) included.push("differentials");
  if (c.redFlags.length > 0) included.push("safety");
  included.push("summary", "knowledge-check");

  return included.map((id) => ({
    id,
    label: CARD_LABELS[id],
    interaction: c.interactions[id],
  }));
}

export interface LessonProgress {
  conditionId: string;
  /** Index into the card list. */
  step: number;
  /** Card ids where the learner has answered the interaction. */
  answered: string[];
  knowledgeScore: number | null;
  completedOn: string | null;
  deepDiveOpened: boolean;
}

export function createProgress(conditionId: string): LessonProgress {
  return {
    conditionId,
    step: 0,
    answered: [],
    knowledgeScore: null,
    completedOn: null,
    deepDiveOpened: false,
  };
}

export function progressLabel(cards: LessonCard[], step: number): string {
  const card = cards[Math.min(step, cards.length - 1)];
  return `${step + 1} of ${cards.length} · ${card.label}`;
}

/** Marks an interaction answered without advancing — the learner still taps Next. */
export function recordAnswer(p: LessonProgress, cardId: string): LessonProgress {
  return p.answered.includes(cardId) ? p : { ...p, answered: [...p.answered, cardId] };
}

export function isComplete(p: LessonProgress): boolean {
  return p.completedOn !== null;
}

/**
 * Review cards are generated only from the concepts worth carrying forward,
 * and capped so one lesson cannot flood the queue. Priority order matches the
 * clinical value of the concept, not the order the learner met it.
 */
export const MAX_REVIEW_CARDS_PER_CONDITION = 4;

const CONCEPT_RANK: Record<string, number> = {
  safety: 0,
  "discriminating-finding": 1,
  "pain-location": 2,
  "core-symptoms": 3,
  differential: 4,
};

export interface ConditionReviewSeed {
  conditionId: string;
  concept: string;
  prompt: string;
  answer: string;
}

/**
 * Seeds come from knowledge-check questions the learner got WRONG, topped up
 * with safety-critical concepts they were never tested on. Getting everything
 * right should not generate homework.
 */
export function reviewSeeds(
  c: Condition,
  wrongQuestionIds: string[]
): ConditionReviewSeed[] {
  const seeds: ConditionReviewSeed[] = c.knowledgeCheck
    .filter((q) => wrongQuestionIds.includes(q.id))
    .map((q) => ({
      conditionId: c.id,
      concept: q.concept,
      prompt: q.question,
      answer: `${q.options[q.correctIndex]} — ${q.feedback}`,
    }));

  return seeds
    .sort((a, b) => (CONCEPT_RANK[a.concept] ?? 9) - (CONCEPT_RANK[b.concept] ?? 9))
    .slice(0, MAX_REVIEW_CARDS_PER_CONDITION);
}

/**
 * FSRS-seeds the same seeds `reviewSeeds` computes, in the shared queue shape
 * so they can sit alongside case review cards and drills. A missed safety
 * question is scheduled harder (Hard) than other misses (Good) — but never as
 * hard as a missed red flag in a live case (Again): getting a lesson quiz
 * question wrong isn't the same stakes as missing a real red flag.
 */
export function seedReviewCards(
  c: Condition,
  wrongQuestionIds: string[],
  today: string = todayISO()
): ReviewQueueItem[] {
  return reviewSeeds(c, wrongQuestionIds).map((seed) => {
    const severity = seed.concept === "safety" ? "high" : "moderate";
    const grade: Grade = seed.concept === "safety" ? Hard : Good;
    const card = review(undefined, grade, today);
    return {
      id: `condition:${seed.conditionId}:${seed.concept}`,
      source: "condition",
      prompt: seed.prompt,
      answer: seed.answer,
      severity,
      because: `Missed in the "${c.name}" knowledge check.`,
      createdOn: today,
      stability: card.stability,
      difficulty: card.difficulty,
      dueDate: card.due,
      lastReview: card.lastReview,
      reps: card.reps,
      lapses: card.lapses,
    };
  });
}
