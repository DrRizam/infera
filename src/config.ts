// ── v1 scope flags ─────────────────────────────────────────────────────────
// Features that are built and working but deliberately out of the v1 pilot.
// Flip a flag to restore the feature everywhere it appears — nav, home screen,
// and its achievements — without touching component code.

/**
 * Branching patient cases. Deferred to v2: the daily drill loop is what the
 * pilot is testing, and the case content is still prototype-quality.
 */
export const SHOW_BOSS_CASES = false;

/** Session length presets (number of drills). */
export const SESSION_PRESETS = [
  { size: 3, label: "Light", note: "when you're short on time" },
  { size: 8, label: "Standard", note: "the daily habit" },
  { size: 15, label: "Intense", note: "study-session mode" },
] as const;

export const DEFAULT_DAILY_GOAL = 8;

/**
 * The drill shown during onboarding. Picked to land the "this is properly
 * sourced" moment in one question. Falls back to the first MCQ in the library
 * if the id ever disappears from the content banks.
 */
export const ONBOARDING_DRILL_ID = "sh1-s5";

/** Rough minutes for a session of n drills — used in button labels. */
export function estimateMinutes(n: number): number {
  return Math.max(2, Math.round(n * 0.85));
}
