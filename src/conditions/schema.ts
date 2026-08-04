// ── Condition lesson schema ────────────────────────────────────────────────
// Store comprehensively, teach selectively.
//
// The essential-lesson limits below are enforced by the validator rather than
// left to author discipline. A condition can hold as much clinical detail as
// you like — but it cannot put more than five symptoms in front of a learner,
// because the schema will refuse to load it. That is deliberate: conciseness
// that depends on good intentions does not survive contact with a subject
// expert who knows one more useful fact.

import { z } from "zod";

/** Controls which learning depth an item appears in. */
export const contentPriority = z.enum(["essential", "supportive", "advanced"]);
export type ContentPriority = z.infer<typeof contentPriority>;

/** Controls how an item is presented and whether it can raise a safety alert. */
export const findingCategory = z.enum(["typical", "possible", "atypical", "safety-critical"]);
export type FindingCategory = z.infer<typeof findingCategory>;

/**
 * One clinical item. `text` is what the learner reads and must stay short;
 * `detail` is Level 2 and only appears behind an expander.
 */
export const finding = z.object({
  id: z.string().min(1),
  text: z.string().min(1).max(120, "Keep findings to a single short line"),
  priority: contentPriority,
  category: findingCategory.default("typical"),
  /** Level 2 — shown behind "Why does this matter?". */
  detail: z.string().optional(),
});
export type Finding = z.infer<typeof finding>;

/** A tappable zone on the body map. */
export const painZone = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(60),
  kind: z.enum(["primary", "spread", "atypical"]),
  note: z.string().max(140).optional(),
});
export type PainZone = z.infer<typeof painZone>;

/** One row of a differential comparison table. Cells stay very short. */
export const discriminator = z.object({
  feature: z.string().min(1).max(40),
  thisCondition: z.string().min(1).max(60),
  alternative: z.string().min(1).max(60),
});

export const conditionDifferential = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(60),
  discriminators: z.array(discriminator).min(1).max(4),
});

/** A microlearning interaction attached to a lesson card. */
export const interaction = z.object({
  kind: z.enum(["tap-zone", "pick-multiple", "pick-one"]),
  prompt: z.string().min(1).max(120),
  /** Option ids: zone ids for tap-zone, otherwise free ids. */
  options: z
    .array(z.object({ id: z.string().min(1), text: z.string().min(1).max(90) }))
    .max(6)
    .default([]),
  correct: z.array(z.string().min(1)).min(1),
  feedbackCorrect: z.string().min(1).max(160),
  feedbackIncorrect: z.string().min(1).max(200),
});
export type Interaction = z.infer<typeof interaction>;

export const knowledgeQuestion = z.object({
  id: z.string().min(1),
  question: z.string().min(1).max(180),
  options: z.array(z.string().min(1).max(110)).min(2).max(4),
  correctIndex: z.number().int().min(0),
  /** One or two sentences. Not an essay. */
  feedback: z.string().min(1).max(240),
  /** Which essential concept this tests — drives review-card generation. */
  concept: z.enum([
    "pain-location",
    "core-symptoms",
    "discriminating-finding",
    "differential",
    "safety",
  ]),
});

export const testStatistic = z.object({
  test: z.string().min(1),
  sensitivity: z.number().min(0).max(100).nullable(),
  specificity: z.number().min(0).max(100).nullable(),
  status: z.enum(["published", "placeholder", "contested"]),
  source: z.string().min(1),
});

export const condition = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  alsoKnownAs: z.array(z.string()).max(3).default([]),
  bodyRegion: z.string().min(1),
  presentingComplaints: z.array(z.string().min(1)).min(1),
  estimatedMinutes: z.number().positive().max(10, "Essential lessons stay under 10 minutes"),

  // ── Level 1: essential ────────────────────────────────────────────
  // Every limit here is a UX constraint expressed as a validation rule.
  definition: z.string().min(1).max(220, "Definition must be one or two short sentences"),
  typicalPopulation: z.array(finding).max(3),
  painMap: z.object({
    /** Which schematic the body map renders. */
    diagram: z.enum(["knee", "shoulder", "lumbar", "generic"]),
    zones: z.array(painZone).min(1).max(5),
    caveat: z.string().max(140).optional(),
  }),
  symptoms: z.array(finding).min(3).max(5, "Show at most five symptoms in the essential lesson"),
  signs: z.array(finding).max(5),
  keyQuestions: z.array(finding).max(5),
  examination: z.object({
    expected: z.array(finding).max(4),
    supportive: z.array(finding).max(4),
    doesNotFit: z.array(finding).max(4),
  }),
  differentials: z.array(conditionDifferential).min(2).max(4),
  redFlags: z.array(finding).max(4),
  managementPrinciples: z.array(finding).max(5),
  takeaways: z.array(z.string().min(1).max(120)).min(1).max(5, "No more than five takeaways"),

  /** Optional interaction per card, keyed by card id. */
  interactions: z.record(z.string(), interaction).default({}),

  knowledgeCheck: z.array(knowledgeQuestion).min(3).max(5),

  // ── Level 2: clinical detail (behind expanders) ───────────────────
  deepDive: z
    .object({
      diagnosticCriteria: z.array(z.string()).default([]),
      prognosis: z.string().optional(),
      misconceptions: z.array(z.string()).default([]),
      additionalFindings: z.array(finding).default([]),
      managementDetail: z.array(z.string()).default([]),
    })
    .default({
      diagnosticCriteria: [],
      misconceptions: [],
      additionalFindings: [],
      managementDetail: [],
    }),

  // ── Level 3: evidence (drawer) ────────────────────────────────────
  evidence: z.object({
    references: z.array(z.string()).default([]),
    statistics: z.array(testStatistic).default([]),
    limitations: z.string().optional(),
    reviewer: z.string().nullable(),
    reviewDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    status: z.enum(["verified", "source-checked", "unverified", "contested"]),
  }),

  contentStatus: z.enum(["demonstration", "review", "published"]),
  version: z.number().int().positive(),
});
export type Condition = z.infer<typeof condition>;

/** Checks the shape alone cannot express. */
export function validateConditionIntegrity(c: Condition): string[] {
  const errors: string[] = [];
  const zoneIds = new Set(c.painMap.zones.map((z) => z.id));

  if (!c.painMap.zones.some((z) => z.kind === "primary")) {
    errors.push("painMap needs at least one primary zone");
  }
  for (const [cardId, i] of Object.entries(c.interactions)) {
    if (i.kind === "tap-zone") {
      for (const id of i.correct) {
        if (!zoneIds.has(id)) errors.push(`interaction "${cardId}" marks unknown zone "${id}" correct`);
      }
    } else {
      const optionIds = new Set(i.options.map((o) => o.id));
      for (const id of i.correct) {
        if (!optionIds.has(id)) errors.push(`interaction "${cardId}" marks unknown option "${id}" correct`);
      }
      if (i.options.length < 2) errors.push(`interaction "${cardId}" needs at least two options`);
    }
  }
  for (const q of c.knowledgeCheck) {
    if (q.correctIndex >= q.options.length) {
      errors.push(`knowledge question "${q.id}" correctIndex is out of range`);
    }
  }
  if (!c.symptoms.some((s) => s.priority === "essential")) {
    errors.push("at least one symptom must be priority 'essential'");
  }
  return errors;
}

/** Items shown in Quick View. Everything else waits for Deep Dive. */
export function essentialOnly(items: Finding[]): Finding[] {
  return items.filter((f) => f.priority === "essential");
}

export function safetyCritical(items: Finding[]): Finding[] {
  return items.filter((f) => f.category === "safety-critical");
}
