// ── Clinical case schema ───────────────────────────────────────────────────
// A case is a simulated patient encounter, not a quiz about a named disease.
// Two rules shape this schema:
//
//   1. Nothing here may reveal the diagnosis before the learner commits. The
//      title, presenting complaint and patient opening are all written from
//      the patient's point of view; the answer lives in `finalDiagnosisId`.
//   2. Every clinical value is attributable. Test statistics carry an evidence
//      `status`, and `placeholder` values are rendered as unverified rather
//      than presented as research findings.

import { z } from "zod";

/** How much a finding should move a differential's probability. */
export const probabilityEffect = z.object({
  differentialId: z.string().min(1),
  /** Qualitative shift, used when no likelihood ratio is available. */
  direction: z.enum(["strong-up", "up", "neutral", "down", "strong-down"]),
  note: z.string().optional(),
});
export type ProbabilityEffect = z.infer<typeof probabilityEffect>;

/**
 * Diagnostic accuracy figures. `status` is mandatory so the UI can distinguish
 * published evidence from content awaiting an evidence review — a placeholder
 * must never render as though it came from a paper.
 */
export const testStatistics = z.object({
  sensitivity: z.number().min(0).max(100).nullable(),
  specificity: z.number().min(0).max(100).nullable(),
  lrPositive: z.number().positive().nullable(),
  lrNegative: z.number().positive().nullable(),
  status: z.enum(["published", "placeholder", "contested"]),
  source: z.string().min(1),
  limitations: z.string().optional(),
  /** Whether the test earns its keep confirming or excluding. */
  bestFor: z.enum(["ruling-in", "ruling-out", "neither", "both"]).optional(),
});
export type TestStatistics = z.infer<typeof testStatistics>;

export const subjectiveQuestion = z.object({
  id: z.string().min(1),
  category: z.enum([
    "mechanism-onset",
    "symptom-location",
    "symptom-behaviour",
    "24-hour-pattern",
    "aggravating-easing",
    "neurological",
    "systemic",
    "previous-episodes",
    "past-medical",
    "medication",
    "function",
    "training-load",
    "work-lifestyle",
    "psychosocial",
    "expectations",
  ]),
  question: z.string().min(1),
  answer: z.string().min(1),
  /** How much this question was worth asking IN THIS CASE. */
  relevance: z.enum(["essential", "useful", "neutral", "unnecessary"]),
  /** Shown in feedback — why it mattered, or why it didn't. */
  explanation: z.string().min(1),
  effects: z.array(probabilityEffect).default([]),
  /** Set when the answer is what surfaces a red flag. */
  revealsRedFlagId: z.string().optional(),
});
export type SubjectiveQuestion = z.infer<typeof subjectiveQuestion>;

export const redFlag = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  /** Whether this flag is actually present in this patient. */
  present: z.boolean(),
  severity: z.enum(["emergency", "urgent", "routine-concern"]),
  explanation: z.string().min(1),
});
export type RedFlag = z.infer<typeof redFlag>;

export const differential = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  /** Expert ordering at the END of the encounter; 1 = most likely. */
  expertRank: z.number().int().positive(),
  /** Reasonable pre-examination probability, as a percentage. */
  priorProbability: z.number().min(0).max(100),
  /**
   * `must-not-miss` diagnoses are penalised much harder when omitted than
   * merely plausible ones — omitting cauda equina is not the same kind of
   * error as omitting fat-pad irritation.
   */
  status: z.enum(["leading", "plausible", "must-not-miss", "implausible"]),
  rationale: z.string().min(1),
});
export type Differential = z.infer<typeof differential>;

export const examination = z.object({
  id: z.string().min(1),
  category: z.enum([
    "observation",
    "active-rom",
    "passive-rom",
    "resisted",
    "neurological",
    "functional",
    "palpation",
    "special-test",
    "adjacent-screen",
    "vitals",
    "outcome-measure",
  ]),
  name: z.string().min(1),
  /** Why a clinician might reach for this. */
  rationale: z.string().min(1),
  /** Rough minutes — used to score clinical efficiency, not to run a timer. */
  timeCost: z.number().positive(),
  finding: z.string().min(1),
  interpretation: z.string().min(1),
  /** Whether performing this was a defensible use of time in THIS case. */
  appropriate: z.boolean(),
  usefulness: z.enum(["high", "moderate", "low", "none"]),
  limitations: z.string().optional(),
  statistics: testStatistics.optional(),
  /** Whether the finding as written is a positive or negative result. */
  result: z.enum(["positive", "negative", "equivocal", "not-applicable"]).default("not-applicable"),
  effects: z.array(probabilityEffect).default([]),
});
export type Examination = z.infer<typeof examination>;

export const dispositionOption = z.enum([
  "treat",
  "refer-urgent",
  "refer-routine",
  "investigate",
  "monitor",
]);
export type DispositionOption = z.infer<typeof dispositionOption>;

export const managementOption = z.object({
  id: z.string().min(1),
  category: z.enum([
    "education",
    "load-modification",
    "exercise",
    "symptom-management",
    "outcome-measure",
    "referral",
    "reassessment",
    "return-to-activity",
  ]),
  label: z.string().min(1),
  appropriate: z.boolean(),
  rationale: z.string().min(1),
});
export type ManagementOption = z.infer<typeof managementOption>;

/**
 * Feedback fires from named conditions the scoring engine detects, so the
 * message can talk about the learner's reasoning rather than restating the
 * answer. See engine/case/feedback.ts for the conditions available.
 */
export const feedbackRule = z.object({
  when: z.string().min(1),
  message: z.string().min(1),
  severity: z.enum(["critical", "warning", "note", "praise"]),
});
export type FeedbackRule = z.infer<typeof feedbackRule>;

export const clinicalCase = z.object({
  id: z.string().min(1),
  /**
   * Written from the presentation, never the diagnosis. "Anterior knee pain
   * in a runner" is fine; "Patellofemoral pain case" is not.
   */
  title: z.string().min(1),
  presentingComplaint: z.string().min(1),
  bodyRegion: z.string().min(1),
  clinicalDomains: z.array(z.string().min(1)).min(1),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  estimatedMinutes: z.number().positive(),

  patient: z.object({
    age: z.number().int().positive(),
    sex: z.string().min(1),
    occupation: z.string().min(1),
    /** The patient's own words. */
    opening: z.string().min(1),
    /** Referral or triage information available before any questioning. */
    context: z.array(z.string()).default([]),
  }),

  subjectiveQuestions: z.array(subjectiveQuestion).min(3),
  /** How many questions the learner may ask — forces prioritisation. */
  subjectiveBudget: z.number().int().positive(),

  redFlags: z.array(redFlag).min(1),
  differentials: z.array(differential).min(3),
  examinations: z.array(examination).min(3),
  examinationBudget: z.number().int().positive(),

  finalDiagnosisId: z.string().min(1),
  diagnosisExplanation: z.string().min(1),

  correctDisposition: dispositionOption,
  dispositionRationale: z.record(dispositionOption, z.string()),

  managementOptions: z.array(managementOption).min(3),

  feedbackRules: z.array(feedbackRule).default([]),

  // ── Clinical governance ──────────────────────────────────────────────
  references: z.array(z.string()).default([]),
  reviewer: z.string().nullable(),
  reviewDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  evidenceStatus: z.enum(["verified", "source-checked", "unverified", "contested"]),
  uncertainty: z.string().optional(),
  contentStatus: z.enum(["demonstration", "review", "published"]),
  version: z.number().int().positive(),
});
export type ClinicalCase = z.infer<typeof clinicalCase>;

/**
 * Cross-field checks the shape alone can't express. These run at load time so
 * a malformed case fails loudly during development rather than halfway
 * through a learner's encounter.
 */
export function validateCaseIntegrity(c: ClinicalCase): string[] {
  const errors: string[] = [];
  const diffIds = new Set(c.differentials.map((d) => d.id));
  const flagIds = new Set(c.redFlags.map((f) => f.id));

  if (!diffIds.has(c.finalDiagnosisId)) {
    errors.push(`finalDiagnosisId "${c.finalDiagnosisId}" is not one of the differentials`);
  }
  const ranks = c.differentials.map((d) => d.expertRank).sort((a, b) => a - b);
  if (ranks.some((r, i) => r !== i + 1)) {
    errors.push(`expertRank must be a 1..n sequence, got [${ranks.join(", ")}]`);
  }
  for (const q of c.subjectiveQuestions) {
    if (q.revealsRedFlagId && !flagIds.has(q.revealsRedFlagId)) {
      errors.push(`question "${q.id}" reveals unknown red flag "${q.revealsRedFlagId}"`);
    }
    for (const e of q.effects) {
      if (!diffIds.has(e.differentialId)) {
        errors.push(`question "${q.id}" affects unknown differential "${e.differentialId}"`);
      }
    }
  }
  for (const ex of c.examinations) {
    for (const e of ex.effects) {
      if (!diffIds.has(e.differentialId)) {
        errors.push(`examination "${ex.id}" affects unknown differential "${e.differentialId}"`);
      }
    }
  }
  if (c.subjectiveBudget > c.subjectiveQuestions.length) {
    errors.push("subjectiveBudget exceeds the number of questions available");
  }
  if (c.examinationBudget > c.examinations.length) {
    errors.push("examinationBudget exceeds the number of examinations available");
  }
  if (!c.differentials.some((d) => d.status === "must-not-miss")) {
    // Not fatal, but every realistic presentation has something worth excluding.
    errors.push("no differential marked must-not-miss — is the safety dimension trainable?");
  }
  return errors;
}
