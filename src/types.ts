// ── Clinician content schema ───────────────────────────────────────────────
// Everything the app plays is data conforming to these types. Content scales
// independently of code: new drills/cases are just new objects.

export type Topic =
  | "RCRSP"
  | "Frozen shoulder"
  | "Rotator cuff tear"
  | "Instability"
  | "Cervical referral"
  | "Red flags"
  | "Test science"
  | "Low back mechanics"
  | "Radiculopathy"
  | "Spinal stenosis"
  | "Inflammatory back pain"
  | "Spinal red flags";

export type Complaint = "Shoulder pain" | "Low back pain";

/** Which presenting-complaint module each topic belongs to. */
export const MODULE_OF_TOPIC: Record<Topic, Complaint> = {
  RCRSP: "Shoulder pain",
  "Frozen shoulder": "Shoulder pain",
  "Rotator cuff tear": "Shoulder pain",
  Instability: "Shoulder pain",
  "Cervical referral": "Shoulder pain",
  "Red flags": "Shoulder pain",
  "Test science": "Shoulder pain",
  "Low back mechanics": "Low back pain",
  Radiculopathy: "Low back pain",
  "Spinal stenosis": "Low back pain",
  "Inflammatory back pain": "Low back pain",
  "Spinal red flags": "Low back pain",
};

export interface TestStats {
  name: string;
  target: string;
  sensitivity: number; // 0–100
  specificity: number; // 0–100
  lrPlus?: number;
  lrMinus?: number;
}

// ── Atomic drills (the daily bread) ────────────────────────────────────────

/**
 * Content-verification status. Every clinical claim ships with a citation;
 * anything not yet checked against its source by a clinician is UNVERIFIED
 * and rendered with a visible badge rather than silently trusted.
 */
export type Verification = "verified" | "unverified" | "contested";

/**
 * Pedagogical category, orthogonal to the render type (`type`). Tracks the
 * bank's mix against the target split (35 interpretation / 35 psychometrics /
 * 30 outcome-measure / 25 recognition / 25 procedure per 150 items).
 */
export type ItemCategory =
  | "recognition"
  | "procedure"
  | "interpretation"
  | "psychometrics"
  | "outcome-measure";

interface DrillBase {
  id: string;
  topic: Topic;
  stem: string;
  explanation: string;
  pearl?: string;
  /** Source for every clinical value in the item (author, title, year, locator). */
  citation: string;
  /** ISO date the evidence was last reviewed against the citation, null if never. */
  evidenceReviewedOn: string | null;
  verification: Verification;
  /** For contested items: what the disagreement in the literature actually is. */
  contestedNote?: string;
  category?: ItemCategory;
}

export interface McqDrill extends DrillBase {
  type: "mcq";
  options: string[];
  correctIndex: number;
}

export interface RankDrill extends DrillBase {
  type: "rank";
  /** Options listed in the CORRECT order, most likely first. Shuffled at render. */
  orderedOptions: string[];
}

export interface RedFlagDrill extends DrillBase {
  type: "redflags";
  findings: { text: string; isRedFlag: boolean; note: string }[];
}

export interface InterpretDrill extends DrillBase {
  type: "interpret";
  test: TestStats;
  result: "positive" | "negative";
  options: string[];
  correctIndex: number;
}

export interface DiscriminatorDrill extends DrillBase {
  type: "discriminator";
  conditionA: string;
  conditionB: string;
  options: string[];
  correctIndex: number;
}

export type Drill =
  | McqDrill
  | RankDrill
  | RedFlagDrill
  | InterpretDrill
  | DiscriminatorDrill;

// ── Branching boss cases (the weekly centerpiece) ──────────────────────────

export interface CaseQuestion {
  id: string;
  question: string;
  answer: string; // what the patient says
  value: 2 | 1 | 0; // discriminative value of asking this
  valueNote: string; // why it was/wasn't worth asking
}

export interface CaseDifferential {
  name: string;
  expertRank: number; // 1 = most likely
  rationale: string;
}

export interface CaseExamSection {
  name: string;
  findings: string[];
  relevance: "high" | "medium" | "low";
  relevanceNote: string;
}

export interface CaseSpecialTest {
  stats: TestStats;
  resultInCase: "positive" | "negative";
  interpretation: string;
  recommended: boolean; // was this a smart pick for THIS case?
}

export interface CaseRedFlagItem {
  text: string;
  correct: boolean; // should the learner select this?
  note: string;
}

export interface ClinicalCase {
  id: string;
  title: string;
  presentingComplaint: string;
  difficulty: 1 | 2 | 3;
  patient: {
    age: number;
    sex: string;
    occupation: string;
    opening: string; // patient's own words
    bullets: string[]; // referral/triage info
  };
  standoutOptions: { text: string; isKey: boolean; note: string }[];
  subjective: { budget: number; questions: CaseQuestion[] };
  differentials: CaseDifferential[]; // learner ranks all of these
  examSections: CaseExamSection[];
  specialTests: { budget: number; tests: CaseSpecialTest[] };
  redFlagCheck: { prompt: string; items: CaseRedFlagItem[] };
  finalDiagnosis: { options: string[]; correctIndex: number };
  reveal: {
    diagnosis: string;
    reasoning: string[];
    excluded: { name: string; why: string }[];
  };
  evidence: { guidelines: string[]; pearls: string[]; mistakes: string[] };
}

// ── Learner state ──────────────────────────────────────────────────────────

/** FSRS memory state for one drill. See engine/fsrs.ts for the model. */
export interface SrsRecord {
  drillId: string;
  stability: number; // days until recall probability decays to 90%
  difficulty: number; // 1 (easy) … 10 (hard)
  dueDate: string; // ISO date (YYYY-MM-DD)
  lastReview: string | null; // ISO date of most recent review
  reps: number; // consecutive successful reviews
  lapses: number;
}

export interface CaseResult {
  caseId: string;
  completedAt: string;
  scores: { reasoning: number; redFlag: number; evidence: number }; // 0–100
  xp: number;
}

/** A learner-reported problem with a content item. Travels with the export. */
export interface ItemFlag {
  drillId: string;
  note: string;
  date: string; // ISO date
}

export interface Profile {
  /** Bumped on breaking changes so exports/imports can be migrated safely. */
  profileVersion: number;
  xp: number;
  streak: number;
  /** Banked rest days (max 2). Earned by practicing, spent automatically. */
  shields: number;
  /** Practice days accumulated toward the next shield (7 earns one). */
  shieldProgress: number;
  /** Days a shield covered — shown on the week strip so the mechanic is visible. */
  shieldedDates: string[];
  flags: ItemFlag[];
  /** Drills per daily session — the learner picks their own commitment. */
  dailyGoal: number;
  /** Whether the one-time "why am I grading myself?" hint has been shown. */
  seenGradeHint: boolean;
  /** Whether the first-launch guided tour of the app has been completed. */
  seenTour: boolean;
  /** Colour scheme: follow the device, or force one. */
  theme: "system" | "light" | "dark";
  /** Reading size for drill text — clinicians read this tired, in bad light. */
  textSize: "normal" | "large";
  lastActiveDate: string | null; // ISO date of last completed session/case
  activityLog: string[]; // ISO dates with at least one completed session/case
  srs: Record<string, SrsRecord>;
  caseResults: CaseResult[];
  sessionsCompleted: number;
  onboarded: boolean;
  xpByDate: Record<string, number>; // ISO date → XP earned that day
  achievements: string[]; // unlocked achievement ids
  topicAgg: Partial<Record<Topic, { n: number; sum: number }>>; // lifetime answer accuracy
  speedBest: number; // best speed-round correct count
  currentPath: Complaint; // module whose NEW drills feed the daily session
}

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
}
