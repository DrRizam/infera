// ── Diagnostic probability ─────────────────────────────────────────────────
// The point of this module is pedagogical: a test result MOVES a probability,
// it rarely settles one. Everything here exists to make that visible.

import type { ProbabilityEffect, TestStatistics } from "../../cases/schema";

/** Convert a percentage probability to odds. */
export function toOdds(percent: number): number {
  const p = Math.min(Math.max(percent, 0.01), 99.99) / 100;
  return p / (1 - p);
}

export function fromOdds(odds: number): number {
  return (odds / (1 + odds)) * 100;
}

/**
 * Bayesian update. Post-test odds = pre-test odds x likelihood ratio.
 * Returns a percentage.
 */
export function applyLikelihoodRatio(priorPercent: number, lr: number): number {
  return fromOdds(toOdds(priorPercent) * lr);
}

/** Derive LR+ and LR− from sensitivity and specificity when not supplied. */
export function derivedLikelihoodRatios(stats: TestStatistics): {
  lrPositive: number | null;
  lrNegative: number | null;
} {
  const { sensitivity: sn, specificity: sp } = stats;
  let lrPositive = stats.lrPositive;
  let lrNegative = stats.lrNegative;
  if (sn !== null && sp !== null) {
    if (lrPositive === null && sp < 100) lrPositive = sn / 100 / (1 - sp / 100);
    if (lrNegative === null && sp > 0) lrNegative = (1 - sn / 100) / (sp / 100);
  }
  return { lrPositive, lrNegative };
}

/**
 * Fallback multipliers for findings with no published statistics. These are
 * intentionally modest — a qualitative "this makes it more likely" should
 * never move probability as decisively as a measured likelihood ratio.
 */
const QUALITATIVE_LR: Record<ProbabilityEffect["direction"], number> = {
  "strong-up": 4,
  up: 2,
  neutral: 1,
  down: 0.5,
  "strong-down": 0.25,
};

export function qualitativeLikelihoodRatio(direction: ProbabilityEffect["direction"]): number {
  return QUALITATIVE_LR[direction];
}

export interface ProbabilityUpdate {
  differentialId: string;
  prior: number;
  posterior: number;
  likelihoodRatio: number;
  /** True when the shift came from published statistics rather than a label. */
  fromStatistics: boolean;
  note?: string;
}

/**
 * Apply one finding to a set of current probabilities.
 *
 * When the examination carries statistics AND a positive/negative result, the
 * matching likelihood ratio is used for the differentials that finding bears
 * on. Otherwise the authored qualitative direction is used.
 */
export function applyFinding(
  current: Record<string, number>,
  effects: ProbabilityEffect[],
  stats?: TestStatistics,
  result?: "positive" | "negative" | "equivocal" | "not-applicable"
): ProbabilityUpdate[] {
  const updates: ProbabilityUpdate[] = [];
  const usable =
    stats && (result === "positive" || result === "negative") && stats.status !== "placeholder";
  const { lrPositive, lrNegative } = usable
    ? derivedLikelihoodRatios(stats)
    : { lrPositive: null, lrNegative: null };
  const statLr = result === "positive" ? lrPositive : lrNegative;

  for (const effect of effects) {
    const prior = current[effect.differentialId] ?? 0;
    // A qualitative "down" must still read as down even when the statistics
    // point up, so statistics are only used where the two agree in direction.
    const qualitative = qualitativeLikelihoodRatio(effect.direction);
    const agrees = statLr !== null && ((statLr > 1) === (qualitative > 1) || qualitative === 1);
    const lr = statLr !== null && agrees ? statLr : qualitative;

    updates.push({
      differentialId: effect.differentialId,
      prior,
      posterior: applyLikelihoodRatio(prior, lr),
      likelihoodRatio: lr,
      fromStatistics: statLr !== null && agrees,
      note: effect.note,
    });
  }
  return updates;
}

/**
 * Rescale a set of probabilities so they sum to 100. Differential probability
 * across mutually exclusive diagnoses should behave like a distribution; left
 * unnormalised, sequential Bayesian updates drift far above 100% in total.
 */
export function normalise(probabilities: Record<string, number>): Record<string, number> {
  const total = Object.values(probabilities).reduce((a, b) => a + b, 0);
  if (total <= 0) return probabilities;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(probabilities)) out[k] = (v / total) * 100;
  return out;
}

/** Plain-language reading of how much a likelihood ratio actually matters. */
export function describeLikelihoodRatio(lr: number): string {
  if (lr >= 10) return "Large shift toward the diagnosis";
  if (lr >= 5) return "Moderate shift toward the diagnosis";
  if (lr >= 2) return "Small shift toward the diagnosis";
  if (lr > 0.5) return "Barely changes the probability";
  if (lr > 0.2) return "Small shift away from the diagnosis";
  if (lr > 0.1) return "Moderate shift away from the diagnosis";
  return "Large shift away from the diagnosis";
}
