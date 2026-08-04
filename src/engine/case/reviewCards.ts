// ── Error-derived review cards ─────────────────────────────────────────────
// Spaced repetition here is driven by what the learner got wrong in a real
// encounter, not by a fixed curriculum. Cards are scheduled through the same
// FSRS engine the drill library uses — severity and confidence decide the
// grade the card is seeded with, which is what pulls dangerous errors back
// sooner than cosmetic ones.

import type { ClinicalCase } from "../../cases/schema";
import type { EncounterState } from "./encounter";
import type { CaseScore } from "./scoring";
import { Again, Easy, Good, Hard, review, type Grade } from "../fsrs";
import { dispositionLabel, escalationLevel } from "./scoring";
import { todayISO } from "../srs";

export type ReviewCardKind =
  | "missed-red-flag"
  | "wrong-diagnosis"
  | "differential-omission"
  | "missed-question"
  | "examination-choice"
  | "interpretation"
  | "disposition"
  | "calibration";

export interface CaseReviewCard {
  id: string;
  caseId: string;
  kind: ReviewCardKind;
  /** What the learner will be asked. */
  prompt: string;
  /** What they should be able to say. */
  answer: string;
  severity: "critical" | "high" | "moderate";
  /** Plain-language reason this card exists, shown in the queue. */
  because: string;
  createdOn: string;
  stability: number;
  difficulty: number;
  dueDate: string;
  lastReview: string | null;
  reps: number;
  lapses: number;
}

/**
 * Severity decides how harshly the card is seeded. A missed emergency starts
 * as `Again` — back tomorrow — regardless of how the rest of the case went.
 */
function seedGrade(severity: CaseReviewCard["severity"]): Grade {
  return severity === "critical" ? Again : severity === "high" ? Hard : Good;
}

function makeCard(
  caseId: string,
  kind: ReviewCardKind,
  suffix: string,
  prompt: string,
  answer: string,
  severity: CaseReviewCard["severity"],
  because: string,
  today = todayISO()
): CaseReviewCard {
  const card = review(undefined, seedGrade(severity), today);
  return {
    id: `${caseId}:${kind}:${suffix}`,
    caseId,
    kind,
    prompt,
    answer,
    severity,
    because,
    createdOn: today,
    stability: card.stability,
    difficulty: card.difficulty,
    dueDate: card.due,
    lastReview: card.lastReview,
    reps: card.reps,
    lapses: card.lapses,
  };
}

export function generateReviewCards(
  c: ClinicalCase,
  s: EncounterState,
  score: CaseScore,
  today = todayISO()
): CaseReviewCard[] {
  const cards: CaseReviewCard[] = [];

  // Missed red flags — the highest-priority cards in the system.
  for (const f of c.redFlags.filter((f) => f.present && !s.flaggedRedFlagIds.includes(f.id))) {
    cards.push(
      makeCard(
        c.id,
        "missed-red-flag",
        f.id,
        `In a patient presenting with ${c.presentingComplaint.toLowerCase()}, what does ${f.label.toLowerCase()} signify, and what does it change?`,
        f.explanation,
        f.severity === "emergency" ? "critical" : "high",
        `You did not identify this in "${c.title}".`,
        today
      )
    );
  }

  // Unsafe or incorrect disposition. Under-escalating in a case whose true
  // diagnosis is must-not-miss is a safety error, not a preference difference.
  if (s.disposition && s.disposition !== c.correctDisposition) {
    const underEscalated =
      escalationLevel(s.disposition) < escalationLevel(c.correctDisposition);
    const trueDxMustNotMiss =
      c.differentials.find((d) => d.id === c.finalDiagnosisId)?.status === "must-not-miss";
    const underReferred = underEscalated && trueDxMustNotMiss;
    cards.push(
      makeCard(
        c.id,
        "disposition",
        c.id,
        `A patient presents with ${c.presentingComplaint.toLowerCase()} and the findings from this case. What is the correct disposition, and why?`,
        `${dispositionLabel(c.correctDisposition)}. ${c.dispositionRationale[c.correctDisposition] ?? ""}`,
        underReferred ? "critical" : "moderate",
        `You chose ${dispositionLabel(s.disposition)} in "${c.title}".`,
        today
      )
    );
  }

  // Wrong final diagnosis.
  if (s.finalDiagnosisId && s.finalDiagnosisId !== c.finalDiagnosisId) {
    const chosen = c.differentials.find((d) => d.id === s.finalDiagnosisId);
    const correct = c.differentials.find((d) => d.id === c.finalDiagnosisId);
    cards.push(
      makeCard(
        c.id,
        "wrong-diagnosis",
        `${s.finalDiagnosisId}-vs-${c.finalDiagnosisId}`,
        `What findings distinguish ${correct?.label} from ${chosen?.label}?`,
        `${c.diagnosisExplanation} ${correct?.rationale ?? ""}`,
        s.finalConfidence >= 75 ? "high" : "moderate",
        `You concluded ${chosen?.label} in "${c.title}".`,
        today
      )
    );
  }

  // Must-not-miss diagnoses that never made the list.
  for (const d of c.differentials.filter(
    (d) =>
      d.status === "must-not-miss" &&
      !s.initialDifferential.some((x) => x.differentialId === d.id)
  )) {
    cards.push(
      makeCard(
        c.id,
        "differential-omission",
        d.id,
        `Why must ${d.label} be considered in a patient with ${c.presentingComplaint.toLowerCase()}?`,
        d.rationale,
        "high",
        `This never entered your differential in "${c.title}".`,
        today
      )
    );
  }

  // Essential history the learner skipped.
  for (const q of c.subjectiveQuestions.filter(
    (q) => q.relevance === "essential" && !s.askedQuestionIds.includes(q.id)
  )) {
    cards.push(
      makeCard(
        c.id,
        "missed-question",
        q.id,
        `In ${c.presentingComplaint.toLowerCase()}, why does it matter to ask: "${q.question}"?`,
        q.explanation,
        "moderate",
        `You did not ask this in "${c.title}".`,
        today
      )
    );
  }

  // Revisions that ran against the findings.
  for (const e of score.dimensions.interpretation.events.filter((e) => e.kind === "penalty")) {
    cards.push(
      makeCard(
        c.id,
        "interpretation",
        e.label.replace(/\s+/g, "-").toLowerCase(),
        `${e.label}. Which way should that finding have moved your probability, and why?`,
        e.detail,
        "moderate",
        `Your revision ran against your findings in "${c.title}".`,
        today
      )
    );
  }

  // Confidence badly out of step with the evidence.
  if (s.finalDiagnosisId !== c.finalDiagnosisId && s.finalConfidence >= 75) {
    cards.push(
      makeCard(
        c.id,
        "calibration",
        "overconfidence",
        `You were ${s.finalConfidence}% confident and wrong. What evidence would have justified that level of confidence here?`,
        c.diagnosisExplanation,
        "moderate",
        `Confidence calibration in "${c.title}".`,
        today
      )
    );
  }

  return cards;
}

/** Apply a graded review to a card, returning the rescheduled copy. */
export function reviewCard(
  card: CaseReviewCard,
  grade: Grade,
  today = todayISO()
): CaseReviewCard {
  const next = review(
    {
      stability: card.stability,
      difficulty: card.difficulty,
      due: card.dueDate,
      lastReview: card.lastReview,
      reps: card.reps,
      lapses: card.lapses,
    },
    grade,
    today
  );
  return {
    ...card,
    stability: next.stability,
    difficulty: next.difficulty,
    dueDate: next.due,
    lastReview: next.lastReview,
    reps: next.reps,
    lapses: next.lapses,
  };
}

/**
 * A card is mastered once it has survived several reviews across a long
 * interval. Critical cards are held to a higher bar — surviving one recall of
 * a missed emergency is not mastery.
 */
export function isMastered(card: CaseReviewCard): boolean {
  const repsNeeded = card.severity === "critical" ? 4 : 3;
  const stabilityNeeded = card.severity === "critical" ? 60 : 30;
  return card.reps >= repsNeeded && card.stability >= stabilityNeeded;
}

/** Due cards, most dangerous first. */
export function dueCards(cards: CaseReviewCard[], today = todayISO()): CaseReviewCard[] {
  const rank = { critical: 0, high: 1, moderate: 2 };
  return cards
    .filter((c) => c.dueDate <= today && !isMastered(c))
    .sort(
      (a, b) => rank[a.severity] - rank[b.severity] || a.dueDate.localeCompare(b.dueDate)
    );
}
