// ── Reasoning profile ───────────────────────────────────────────────────
// Turns the per-module competency EMAs (profile.competency, keyed
// "{module}:{type}") into one score per reasoning dimension, and picks the
// cases that would best move a given dimension. Pure — mirrors the rest of
// src/lib. Drives the weak-spot view that replaced the linear case path.

export const REASONING_DIMENSIONS = [
  { type: "history", label: "History-taking", blurb: "Asking the question that discriminates, not the obvious one." },
  { type: "red_flag", label: "Red-flag screening", blurb: "Catching what has to be ruled out before you proceed." },
  { type: "differential", label: "Differential reasoning", blurb: "Ranking the possibilities and defending the order." },
  { type: "exam", label: "Examination selection", blurb: "Choosing tests that separate your top hypotheses." },
  { type: "disposition", label: "Disposition & escalation", blurb: "Landing the right level of care." },
];

/**
 * One 0–100 score per reasoning dimension, averaged across the modules the
 * learner has data in. `moduleFilter` (array of module ids) narrows it;
 * empty means all. `score` is null when there's no signal yet.
 */
export function reasoningDimensions(competency, moduleFilter = []) {
  const c = competency || {};
  return REASONING_DIMENSIONS.map((d) => {
    const scores = Object.entries(c)
      .filter(([k]) => {
        const [mod, type] = k.split(":");
        return type === d.type && (moduleFilter.length === 0 || moduleFilter.includes(mod));
      })
      .map(([, v]) => v);
    const score = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    return { ...d, score };
  });
}

/** The dimension most worth working on: lowest score, with any real signal. Null if nothing scored yet. */
export function weakestDimension(dimensions) {
  const scored = dimensions.filter((d) => d.score != null);
  if (!scored.length) return null;
  return scored.reduce((lo, d) => (d.score < lo.score ? d : lo));
}

/** A rough 0–4 measure of how hard a case leans on one reasoning dimension, read off the case's own structure. */
export function caseDimensionWeight(c, type) {
  switch (type) {
    case "red_flag": {
      const present = (c.red_flags || []).filter((f) => f.present).length;
      const mustNotMiss = (c.differentials || []).some((d) => d.must_not_miss) ? 1 : 0;
      return Math.min(4, present + mustNotMiss);
    }
    case "disposition": {
      const correct = c.disposition?.options?.find((o) => o.id === c.disposition?.correct)?.escalation;
      if (correct === "refer_urgent") return 4;
      if (correct === "investigate" || correct === "refer_routine") return 3;
      return 1;
    }
    case "differential":
      return Math.min(4, Math.max(1, (c.differentials || []).length - 1));
    case "history":
      return Math.min(4, (c.history_questions || []).length + 1);
    case "exam": {
      const ex = c.examinations || [];
      const useful = ex.filter((e) => e.useful).length;
      return Math.min(4, Math.min(useful, ex.length - useful) + 1);
    }
    default:
      return 1;
  }
}

/**
 * Cases to drill a dimension, best first: unplayed and review-due cases
 * come before completed ones, then by how hard the case leans on that
 * dimension, then by difficulty.
 */
export function recommendCasesFor(type, cases, progressByCaseId, today, limit = 3) {
  return (cases || [])
    .map((c) => {
      const p = progressByCaseId?.[c.id];
      const freshness = p?.status !== "completed" ? 2 : p?.next_review_date && p.next_review_date <= today ? 1 : 0;
      return { c, freshness, rank: freshness * 100 + caseDimensionWeight(c, type) * 10 + (c.difficulty || 0) };
    })
    .filter((x) => x.freshness > 0)
    .sort((a, b) => b.rank - a.rank)
    .slice(0, limit)
    .map((x) => x.c);
}
