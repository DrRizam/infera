// ── Encounter state machine ────────────────────────────────────────────────
// Holds everything the learner has decided so far. Deliberately free of React
// and of the case content itself: given a case and this state, scoring and
// feedback are pure functions of the two.

import type { ClinicalCase, DispositionOption } from "../../cases/schema";

export const CASE_STAGES = [
  "presentation",
  "subjective",
  "red-flags",
  "differential-initial",
  "examination",
  "interpretation",
  "differential-updated",
  "diagnosis",
  "disposition",
  "management",
  "feedback",
] as const;

export type CaseStage = (typeof CASE_STAGES)[number];

export const STAGE_LABELS: Record<CaseStage, string> = {
  presentation: "Presentation",
  subjective: "History",
  "red-flags": "Screening",
  "differential-initial": "Differential",
  examination: "Examination",
  interpretation: "Findings",
  "differential-updated": "Revise",
  diagnosis: "Diagnosis",
  disposition: "Decision",
  management: "Management",
  feedback: "Debrief",
};

/** A diagnosis the learner is carrying, with how sure they are of it. */
export interface RankedDifferential {
  differentialId: string;
  /** Percentage. Across a list these must total 100 before advancing. */
  confidence: number;
}

export interface EncounterState {
  caseId: string;
  stage: CaseStage;
  startedAt: string;
  askedQuestionIds: string[];
  /** Red flags the learner judged to be PRESENT in this patient. */
  flaggedRedFlagIds: string[];
  initialDifferential: RankedDifferential[];
  performedExaminationIds: string[];
  updatedDifferential: RankedDifferential[];
  finalDiagnosisId: string | null;
  finalConfidence: number;
  disposition: DispositionOption | null;
  managementIds: string[];
  completedAt: string | null;
}

export function createEncounter(caseId: string, now = new Date()): EncounterState {
  return {
    caseId,
    stage: "presentation",
    startedAt: now.toISOString(),
    askedQuestionIds: [],
    flaggedRedFlagIds: [],
    initialDifferential: [],
    performedExaminationIds: [],
    updatedDifferential: [],
    finalDiagnosisId: null,
    finalConfidence: 50,
    disposition: null,
    managementIds: [],
    completedAt: null,
  };
}

export function stageIndex(stage: CaseStage): number {
  return CASE_STAGES.indexOf(stage);
}

export function nextStage(stage: CaseStage): CaseStage {
  return CASE_STAGES[Math.min(stageIndex(stage) + 1, CASE_STAGES.length - 1)];
}

/** Confidence percentages must sum to 100 (allowing for rounding). */
export function confidenceTotal(list: RankedDifferential[]): number {
  return list.reduce((a, d) => a + d.confidence, 0);
}

export function isConfidenceValid(list: RankedDifferential[]): boolean {
  return list.length > 0 && Math.abs(confidenceTotal(list) - 100) < 0.5;
}

/**
 * Spread 100% across a list, giving earlier (higher-ranked) entries more
 * weight. Used to seed the builder so the learner adjusts rather than starts
 * from zero — the ranking is the reasoning, the exact numbers are secondary.
 */
export function distributeConfidence(ids: string[]): RankedDifferential[] {
  if (ids.length === 0) return [];
  const weights = ids.map((_, i) => 1 / (i + 1));
  const total = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => (w / total) * 100);
  // Round down, then hand the remainder to the top-ranked entry so the list
  // always totals exactly 100.
  const floored = raw.map((n) => Math.floor(n));
  const remainder = 100 - floored.reduce((a, b) => a + b, 0);
  floored[0] += remainder;
  return ids.map((id, i) => ({ differentialId: id, confidence: floored[i] }));
}

/** Whether the learner has done enough at this stage to move on. */
export function canAdvance(state: EncounterState, c: ClinicalCase): boolean {
  switch (state.stage) {
    case "presentation":
      return true;
    case "subjective":
      return state.askedQuestionIds.length > 0;
    case "red-flags":
      return true; // deciding that nothing is present is itself an answer
    case "differential-initial":
      return state.initialDifferential.length >= 3 && isConfidenceValid(state.initialDifferential);
    case "examination":
      return state.performedExaminationIds.length > 0;
    case "interpretation":
      return true;
    case "differential-updated":
      return state.updatedDifferential.length >= 3 && isConfidenceValid(state.updatedDifferential);
    case "diagnosis":
      return state.finalDiagnosisId !== null;
    case "disposition":
      return state.disposition !== null;
    case "management":
      return state.managementIds.length > 0;
    case "feedback":
      return false;
    default:
      return false;
  }
}

export function remainingSubjectiveBudget(state: EncounterState, c: ClinicalCase): number {
  return Math.max(0, c.subjectiveBudget - state.askedQuestionIds.length);
}

export function remainingExaminationBudget(state: EncounterState, c: ClinicalCase): number {
  return Math.max(0, c.examinationBudget - state.performedExaminationIds.length);
}

/** Total minutes of examination time the learner has spent. */
export function examinationTimeSpent(state: EncounterState, c: ClinicalCase): number {
  return c.examinations
    .filter((e) => state.performedExaminationIds.includes(e.id))
    .reduce((a, e) => a + e.timeCost, 0);
}

// ── Save and resume ────────────────────────────────────────────────────────
// A 10-15 minute encounter will be interrupted. Losing it silently would be
// worse than not offering cases at all.

const KEY = "clinician-encounter-v1";

export function saveEncounter(state: EncounterState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or unavailable — the encounter continues in memory */
  }
}

export function loadEncounter(): EncounterState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as EncounterState;
    if (!s.caseId || !CASE_STAGES.includes(s.stage) || s.completedAt) return null;
    return s;
  } catch {
    return null;
  }
}

export function clearEncounter(): void {
  localStorage.removeItem(KEY);
}
