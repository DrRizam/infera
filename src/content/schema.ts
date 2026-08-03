// ── Content bank schema ────────────────────────────────────────────────────
// Validates the JSON banks under banks/ at load time so a typo in hand-edited
// content fails loudly with a path to the bad field, never as a blank screen
// or a silently wrong drill. Mirror of the Drill types in ../types.ts.

import { z } from "zod";

const topic = z.enum([
  "RCRSP",
  "Frozen shoulder",
  "Rotator cuff tear",
  "Instability",
  "Cervical referral",
  "Red flags",
  "Test science",
  "Low back mechanics",
  "Radiculopathy",
  "Spinal stenosis",
  "Inflammatory back pain",
  "Spinal red flags",
]);

const drillBase = z.object({
  id: z.string().min(1),
  topic,
  stem: z.string().min(1),
  explanation: z.string().min(1),
  pearl: z.string().optional(),
  citation: z.string().min(1),
  evidenceReviewedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  verification: z.enum(["verified", "unverified", "contested"]),
  contestedNote: z.string().optional(),
  category: z
    .enum(["recognition", "procedure", "interpretation", "psychometrics", "outcome-measure"])
    .optional(),
});

const testStats = z.object({
  name: z.string(),
  target: z.string(),
  sensitivity: z.number().min(0).max(100),
  specificity: z.number().min(0).max(100),
  lrPlus: z.number().optional(),
  lrMinus: z.number().optional(),
});

const choiceFields = {
  options: z.array(z.string()).min(2),
  correctIndex: z.number().int().min(0),
};

const drill = z.discriminatedUnion("type", [
  drillBase.extend({ type: z.literal("mcq"), ...choiceFields }),
  drillBase.extend({ type: z.literal("rank"), orderedOptions: z.array(z.string()).min(2) }),
  drillBase.extend({
    type: z.literal("redflags"),
    findings: z
      .array(z.object({ text: z.string(), isRedFlag: z.boolean(), note: z.string() }))
      .min(2),
  }),
  drillBase.extend({
    type: z.literal("interpret"),
    test: testStats,
    result: z.enum(["positive", "negative"]),
    ...choiceFields,
  }),
  drillBase.extend({
    type: z.literal("discriminator"),
    conditionA: z.string(),
    conditionB: z.string(),
    ...choiceFields,
  }),
]);

export const bankSchema = z.object({
  module: z.enum(["Shoulder pain", "Low back pain"]),
  items: z.array(drill).superRefine((items, ctx) => {
    for (const [i, item] of items.entries()) {
      if ("correctIndex" in item && item.correctIndex >= item.options.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [i, "correctIndex"],
          message: `correctIndex ${item.correctIndex} out of range for ${item.options.length} options (item "${item.id}")`,
        });
      }
    }
  }),
});

export type Bank = z.infer<typeof bankSchema>;
