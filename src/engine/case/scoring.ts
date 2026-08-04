// ── Multi-dimensional case scoring ─────────────────────────────────────────
// A single right/wrong number can't distinguish "reached the right diagnosis
// safely" from "guessed it after missing a red flag". Each dimension is scored
// independently and every contribution is recorded as an event, so feedback
// can cite the specific decision rather than a percentage.

import type { ClinicalCase } from "../../cases/schema";
import type { EncounterState, RankedDifferential } from "./encounter";
import { examinationTimeSpent } from "./encounter";

export type ScoreDimension =
  | "subjective"
  | "redFlags"
  | "differential"
  | "examinationSelection"
  | "interpretation"
  | "diagnosis"
  | "management"
  | "efficiency"
  | "calibration"
  | "safety";

export const DIMENSION_LABELS: Record<ScoreDimension, string> = {
  subjective: "History taking",
  redFlags: "Red flag detection",
  differential: "Differential diagnosis",
  examinationSelection: "Examination selection",
  interpretation: "Finding interpretation",
  diagnosis: "Diagnostic conclusion",
  management: "Management reasoning",
  efficiency: "Clinical efficiency",
  calibration: "Confidence calibration",
  safety: "Patient safety",
};

export interface ScoreEvent {
  dimension: ScoreDimension;
  kind: "credit" | "penalty" | "info";
  label: string;
  detail: string;
}

export interface DimensionScore {
  dimension: ScoreDimension;
  /** 0–100, or null when the encounter never exercised this dimension. */
  score: number | null;
  events: ScoreEvent[];
}

export interface CaseScore {
  dimensions: Record<ScoreDimension, DimensionScore>;
  events: ScoreEvent[];
  /** Weighted overall, with safety weighted heaviest. */
  overall: number;
  /** True when a red flag was missed or a serious presentation under-referred. */
  safetyBreach: boolean;
}

const pct = (n: number) => Math.round(Math.max(0, Math.min(1, n)) * 100);

function rankOf(list: RankedDifferential[], id: string): number {
  return list.findIndex((d) => d.differentialId === id);
}

export function scoreEncounter(c: ClinicalCase, s: EncounterState): CaseScore {
  const events: ScoreEvent[] = [];
  const add = (
    dimension: ScoreDimension,
    kind: ScoreEvent["kind"],
    label: string,
    detail: string
  ) => events.push({ dimension, kind, label, detail });

  // ── History taking ──────────────────────────────────────────────────
  const asked = c.subjectiveQuestions.filter((q) => s.askedQuestionIds.includes(q.id));
  const essentials = c.subjectiveQuestions.filter((q) => q.relevance === "essential");
  const askedEssentials = essentials.filter((q) => s.askedQuestionIds.includes(q.id));
  const wasted = asked.filter((q) => q.relevance === "unnecessary");

  for (const q of essentials) {
    if (!s.askedQuestionIds.includes(q.id)) {
      add("subjective", "penalty", `Missed: ${q.question}`, q.explanation);
    }
  }
  for (const q of wasted) {
    add("subjective", "penalty", `Low-yield question: ${q.question}`, q.explanation);
  }
  if (askedEssentials.length === essentials.length && essentials.length > 0) {
    add("subjective", "credit", "Covered every essential line of questioning", "");
  }
  const subjectiveScore = essentials.length
    ? pct(askedEssentials.length / essentials.length - wasted.length * 0.1)
    : null;

  // ── Red flag detection ──────────────────────────────────────────────
  const presentFlags = c.redFlags.filter((f) => f.present);
  const missedFlags = presentFlags.filter((f) => !s.flaggedRedFlagIds.includes(f.id));
  const falseFlags = c.redFlags.filter(
    (f) => !f.present && s.flaggedRedFlagIds.includes(f.id)
  );

  for (const f of missedFlags) {
    add("redFlags", "penalty", `Missed red flag: ${f.label}`, f.explanation);
  }
  for (const f of falseFlags) {
    add("redFlags", "penalty", `Flagged when not present: ${f.label}`, f.explanation);
  }
  if (presentFlags.length > 0 && missedFlags.length === 0) {
    add("redFlags", "credit", "Identified every red flag present", "");
  }
  const flagDenominator = c.redFlags.length;
  const flagCorrect = c.redFlags.filter(
    (f) => f.present === s.flaggedRedFlagIds.includes(f.id)
  ).length;
  const redFlagScore = flagDenominator ? pct(flagCorrect / flagDenominator) : null;

  // ── Differential diagnosis ──────────────────────────────────────────
  // Judged on the UPDATED list: revising in light of findings is the skill.
  const finalList = s.updatedDifferential.length ? s.updatedDifferential : s.initialDifferential;
  const mustNotMiss = c.differentials.filter((d) => d.status === "must-not-miss");
  const omittedCritical = mustNotMiss.filter((d) => rankOf(s.initialDifferential, d.id) < 0);
  const implausibleIncluded = c.differentials.filter(
    (d) => d.status === "implausible" && rankOf(finalList, d.id) >= 0
  );

  for (const d of omittedCritical) {
    add(
      "differential",
      "penalty",
      `Never considered: ${d.label}`,
      `${d.rationale} This is a must-not-miss diagnosis for this presentation.`
    );
  }
  for (const d of implausibleIncluded) {
    add("differential", "penalty", `Implausible inclusion: ${d.label}`, d.rationale);
  }

  const expertOrder = [...c.differentials].sort((a, b) => a.expertRank - b.expertRank);
  const topExpert = expertOrder[0];
  if (finalList.length && finalList[0].differentialId === topExpert.id) {
    add("differential", "credit", `Led with ${topExpert.label}`, topExpert.rationale);
  }
  const differentialScore = finalList.length
    ? pct(
        concordance(finalList, c) -
          omittedCritical.length * 0.34 -
          implausibleIncluded.length * 0.15
      )
    : null;

  // ── Examination selection & efficiency ──────────────────────────────
  const performed = c.examinations.filter((e) => s.performedExaminationIds.includes(e.id));
  const appropriate = c.examinations.filter((e) => e.appropriate);
  const performedAppropriate = performed.filter((e) => e.appropriate);
  const performedInappropriate = performed.filter((e) => !e.appropriate);

  for (const e of performedInappropriate) {
    add("examinationSelection", "penalty", `Low-value test: ${e.name}`, e.rationale);
  }
  const highValueMissed = appropriate.filter(
    (e) => e.usefulness === "high" && !s.performedExaminationIds.includes(e.id)
  );
  for (const e of highValueMissed) {
    add("examinationSelection", "penalty", `Did not perform: ${e.name}`, e.rationale);
  }
  const examinationScore = appropriate.length
    ? pct(
        performedAppropriate.length / appropriate.length - performedInappropriate.length * 0.15
      )
    : null;

  // Efficiency rewards getting there without running the whole battery.
  const timeSpent = examinationTimeSpent(s, c);
  const idealTime = appropriate.reduce((a, e) => a + e.timeCost, 0);
  const efficiencyScore = performed.length
    ? pct(idealTime > 0 ? Math.min(1, idealTime / Math.max(timeSpent, 0.1)) : 1)
    : null;
  if (performed.length && timeSpent > idealTime * 1.5) {
    add(
      "efficiency",
      "penalty",
      "Examination took considerably longer than needed",
      `You spent about ${Math.round(timeSpent)} minutes examining; the findings that changed management were available in roughly ${Math.round(idealTime)}.`
    );
  }

  // ── Interpretation ──────────────────────────────────────────────────
  // Did the learner's revision move in the direction the findings pointed?
  const interpretationScore = scoreInterpretation(c, s, add);

  // ── Diagnostic conclusion ───────────────────────────────────────────
  const correctDx = s.finalDiagnosisId === c.finalDiagnosisId;
  const finalDx = c.differentials.find((d) => d.id === s.finalDiagnosisId);
  if (correctDx) {
    add("diagnosis", "credit", "Reached the supported diagnosis", c.diagnosisExplanation);
  } else if (finalDx) {
    add(
      "diagnosis",
      "penalty",
      `Concluded ${finalDx.label}`,
      `The findings better support ${c.differentials.find((d) => d.id === c.finalDiagnosisId)?.label}. ${c.diagnosisExplanation}`
    );
  }
  const diagnosisScore = s.finalDiagnosisId ? pct(correctDx ? 1 : 0) : null;

  // ── Disposition & safety ────────────────────────────────────────────
  const correctDisposition = s.disposition === c.correctDisposition;
  // Under-escalation is the dangerous direction, and it isn't only about
  // urgent referral: choosing to treat when the case called for investigating
  // a must-not-miss diagnosis sends the patient away still carrying the risk.
  const underReferred =
    s.disposition !== null && escalationLevel(s.disposition) < escalationLevel(c.correctDisposition);
  const trueDxMustNotMiss =
    c.differentials.find((d) => d.id === c.finalDiagnosisId)?.status === "must-not-miss";

  if (s.disposition) {
    if (correctDisposition) {
      add(
        "safety",
        "credit",
        `Correct disposition: ${dispositionLabel(c.correctDisposition)}`,
        c.dispositionRationale[c.correctDisposition] ?? ""
      );
    } else {
      add(
        "safety",
        underReferred ? "penalty" : "penalty",
        `Chose ${dispositionLabel(s.disposition)} rather than ${dispositionLabel(c.correctDisposition)}`,
        c.dispositionRationale[c.correctDisposition] ?? ""
      );
    }
  }

  const safetyBreach = missedFlags.length > 0 || (underReferred && trueDxMustNotMiss);
  // Safety is scored punitively on purpose: a missed emergency is not a
  // proportional deduction, it is a failed encounter on this dimension.
  let safetyScore: number | null = null;
  if (s.disposition || presentFlags.length) {
    let v = 1;
    if (missedFlags.some((f) => f.severity === "emergency")) v -= 0.7;
    else if (missedFlags.length) v -= 0.4;
    if (underReferred) v -= 0.5;
    else if (!correctDisposition && s.disposition) v -= 0.2;
    safetyScore = pct(v);
  }

  // ── Management ──────────────────────────────────────────────────────
  const chosenManagement = c.managementOptions.filter((m) => s.managementIds.includes(m.id));
  const goodManagement = chosenManagement.filter((m) => m.appropriate);
  const poorManagement = chosenManagement.filter((m) => !m.appropriate);
  for (const m of poorManagement) {
    add("management", "penalty", `Questionable choice: ${m.label}`, m.rationale);
  }
  const managementScore = chosenManagement.length
    ? pct(goodManagement.length / chosenManagement.length)
    : null;

  // ── Confidence calibration ──────────────────────────────────────────
  // Brier-style: penalise being confident and wrong far more than being
  // uncertain and wrong.
  let calibrationScore: number | null = null;
  if (s.finalDiagnosisId) {
    const p = s.finalConfidence / 100;
    const outcome = correctDx ? 1 : 0;
    calibrationScore = pct(1 - (p - outcome) ** 2);
    if (!correctDx && s.finalConfidence >= 75) {
      add(
        "calibration",
        "penalty",
        "High confidence in an unsupported diagnosis",
        `You reported ${s.finalConfidence}% confidence. The available findings did not justify that level of certainty.`
      );
    } else if (correctDx && s.finalConfidence <= 40) {
      add(
        "calibration",
        "info",
        "Correct, but you doubted it",
        `You reported ${s.finalConfidence}% confidence in a diagnosis the findings supported. Under-confidence has costs too — it drives unnecessary tests and referrals.`
      );
    }
  }

  const dimensions = {
    subjective: dim("subjective", subjectiveScore, events),
    redFlags: dim("redFlags", redFlagScore, events),
    differential: dim("differential", differentialScore, events),
    examinationSelection: dim("examinationSelection", examinationScore, events),
    interpretation: dim("interpretation", interpretationScore, events),
    diagnosis: dim("diagnosis", diagnosisScore, events),
    management: dim("management", managementScore, events),
    efficiency: dim("efficiency", efficiencyScore, events),
    calibration: dim("calibration", calibrationScore, events),
    safety: dim("safety", safetyScore, events),
  } satisfies Record<ScoreDimension, DimensionScore>;

  return { dimensions, events, overall: weightedOverall(dimensions), safetyBreach };
}

function dim(
  dimension: ScoreDimension,
  score: number | null,
  events: ScoreEvent[]
): DimensionScore {
  return { dimension, score, events: events.filter((e) => e.dimension === dimension) };
}

const WEIGHTS: Record<ScoreDimension, number> = {
  safety: 3,
  redFlags: 2,
  diagnosis: 2,
  differential: 2,
  interpretation: 1.5,
  subjective: 1.5,
  examinationSelection: 1,
  management: 1,
  calibration: 1,
  efficiency: 0.5,
};

export function weightedOverall(dimensions: Record<ScoreDimension, DimensionScore>): number {
  let total = 0;
  let weight = 0;
  for (const [key, d] of Object.entries(dimensions) as [ScoreDimension, DimensionScore][]) {
    if (d.score === null) continue;
    total += d.score * WEIGHTS[key];
    weight += WEIGHTS[key];
  }
  return weight ? Math.round(total / weight) : 0;
}

/** Pairwise concordance between the learner's ranking and the expert's. */
function concordance(list: RankedDifferential[], c: ClinicalCase): number {
  const rankById = new Map(c.differentials.map((d) => [d.id, d.expertRank]));
  let concordant = 0;
  let pairs = 0;
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = rankById.get(list[i].differentialId);
      const b = rankById.get(list[j].differentialId);
      if (a === undefined || b === undefined) continue;
      pairs++;
      if (a < b) concordant++;
    }
  }
  return pairs ? concordant / pairs : 0;
}

/**
 * Interpretation is judged by whether the learner's revision moved with the
 * evidence: diagnoses the findings supported should rise, those they argued
 * against should fall.
 */
function scoreInterpretation(
  c: ClinicalCase,
  s: EncounterState,
  add: (d: ScoreDimension, k: ScoreEvent["kind"], l: string, detail: string) => void
): number | null {
  if (!s.initialDifferential.length || !s.updatedDifferential.length) return null;

  const before = new Map(s.initialDifferential.map((d) => [d.differentialId, d.confidence]));
  const after = new Map(s.updatedDifferential.map((d) => [d.differentialId, d.confidence]));

  // Net direction each differential should have moved, from the findings the
  // learner actually obtained.
  const net = new Map<string, number>();
  for (const e of c.examinations) {
    if (!s.performedExaminationIds.includes(e.id)) continue;
    for (const eff of e.effects) {
      const delta =
        eff.direction === "strong-up" ? 2 : eff.direction === "up" ? 1 :
        eff.direction === "down" ? -1 : eff.direction === "strong-down" ? -2 : 0;
      net.set(eff.differentialId, (net.get(eff.differentialId) ?? 0) + delta);
    }
  }
  if (net.size === 0) return null;

  let correct = 0;
  let counted = 0;
  for (const [id, expected] of net) {
    if (expected === 0) continue;
    counted++;
    const moved = (after.get(id) ?? 0) - (before.get(id) ?? 0);
    const label = c.differentials.find((d) => d.id === id)?.label ?? id;
    if (Math.sign(moved) === Math.sign(expected)) {
      correct++;
      add(
        "interpretation",
        "credit",
        `Moved ${label} in the right direction`,
        `Your findings argued ${expected > 0 ? "for" : "against"} it and your confidence followed.`
      );
    } else if (moved === 0) {
      add(
        "interpretation",
        "info",
        `Left ${label} unchanged`,
        `Your findings pointed ${expected > 0 ? "toward" : "away from"} this diagnosis, but your confidence did not move.`
      );
    } else {
      add(
        "interpretation",
        "penalty",
        `Moved ${label} against the evidence`,
        `Your findings pointed ${expected > 0 ? "toward" : "away from"} this diagnosis, but your confidence went the other way.`
      );
    }
  }
  return counted ? pct(correct / counted) : null;
}

/**
 * How protective each disposition is. Ordered by what happens to the patient
 * if the worst candidate diagnosis is true, not by how much work it creates.
 */
const ESCALATION: Record<string, number> = {
  monitor: 0,
  treat: 1,
  "refer-routine": 2,
  investigate: 3,
  "refer-urgent": 4,
};

export function escalationLevel(d: string): number {
  return ESCALATION[d] ?? 0;
}

export function dispositionLabel(d: string): string {
  return (
    {
      treat: "Treat",
      "refer-urgent": "Refer urgently",
      "refer-routine": "Refer routinely",
      investigate: "Investigate further",
      monitor: "Monitor and reassess",
    }[d] ?? d
  );
}
