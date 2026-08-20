// ── OSCE-style mock assessment checkpoints ───────────────────────────────
// Bundles a few cases into one back-to-back graded session — an assessment
// layer on top of normal practice, not a replacement for it (see
// OsceCheckpoint.jsx for what that means for XP/streak/spaced-repetition).
// Pure, storage-free, mirrors dailyGame.js's style.

export const OSCE_CASE_COUNT = 3;
export const OSCE_TIME_BUDGET_SECONDS = 720; // 12 min, ~4 min/case
export const OSCE_PASS_THRESHOLD = 70;

/**
 * N random cases from a module (or the whole bank if moduleId is falsy,
 * i.e. "Mixed"). Every checkpoint attempt is personal, not a shared daily
 * event, so plain randomization is fine — no need for the date-seeded
 * determinism conditionOfTheDay/dailyHardCase use. Returns fewer than N if
 * the pool is smaller (the case bank is still small).
 */
export function selectOsceCases(cases, moduleId, count = OSCE_CASE_COUNT) {
  const pool = moduleId ? (cases || []).filter((c) => c.module === moduleId) : cases || [];
  return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
}

/** caseResults: [{ caseId, diagnosis, accuracy }] → the aggregate grade. */
export function scoreOsceSession(caseResults) {
  if (!caseResults?.length) return { overallAccuracy: 0, passed: false };
  const overallAccuracy = Math.round(caseResults.reduce((sum, r) => sum + r.accuracy, 0) / caseResults.length);
  return { overallAccuracy, passed: overallAccuracy >= OSCE_PASS_THRESHOLD };
}

/** A single end-of-checkpoint XP award, scaled to overall accuracy — roughly 2-3 normal cases' worth at 100%. */
export function xpForOsceSession(overallAccuracy) {
  return Math.round(overallAccuracy * 1.5);
}
