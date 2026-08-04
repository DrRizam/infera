// ── Reasoning feedback engine ──────────────────────────────────────────────
// Feedback here talks about HOW the learner reasoned, not what the answer was.
// Conditions are detected from the encounter and the score, then cases may
// attach their own messages to the same condition names via `feedbackRules`.

import type { ClinicalCase } from "../../cases/schema";
import type { EncounterState } from "./encounter";
import type { CaseScore } from "./scoring";
import { dispositionLabel, escalationLevel } from "./scoring";

export type ReasoningCondition =
  | "missed-red-flag"
  | "unsafe-disposition"
  | "identified-flag-wrong-action"
  | "omitted-must-not-miss"
  | "anchored-early"
  | "ignored-findings"
  | "revised-against-evidence"
  | "good-revision"
  | "overconfident"
  | "underconfident"
  | "over-tested"
  | "thin-history"
  | "correct-but-lucky"
  | "clean-encounter";

export interface FeedbackItem {
  condition: ReasoningCondition;
  severity: "critical" | "warning" | "note" | "praise";
  title: string;
  detail: string;
}

const SEVERITY_ORDER: Record<FeedbackItem["severity"], number> = {
  critical: 0,
  warning: 1,
  note: 2,
  praise: 3,
};

export function generateFeedback(
  c: ClinicalCase,
  s: EncounterState,
  score: CaseScore
): FeedbackItem[] {
  const out: FeedbackItem[] = [];
  const push = (
    condition: ReasoningCondition,
    severity: FeedbackItem["severity"],
    title: string,
    detail: string
  ) => out.push({ condition, severity, title, detail });

  const presentFlags = c.redFlags.filter((f) => f.present);
  const missedFlags = presentFlags.filter((f) => !s.flaggedRedFlagIds.includes(f.id));
  const caughtFlags = presentFlags.filter((f) => s.flaggedRedFlagIds.includes(f.id));
  const correctDx = s.finalDiagnosisId === c.finalDiagnosisId;
  const trueDxMustNotMiss =
    c.differentials.find((d) => d.id === c.finalDiagnosisId)?.status === "must-not-miss";
  const underEscalated =
    s.disposition !== null &&
    escalationLevel(s.disposition) < escalationLevel(c.correctDisposition);
  const urgentNeeded = c.correctDisposition === "refer-urgent" || (underEscalated && trueDxMustNotMiss);

  // ── Safety first, always ────────────────────────────────────────────
  for (const f of missedFlags) {
    push(
      "missed-red-flag",
      "critical",
      `You did not identify ${f.label.toLowerCase()}`,
      `${f.explanation} A missed ${f.severity === "emergency" ? "emergency" : "serious"} finding is not an ordinary wrong answer — it is the failure mode this training exists to prevent.`
    );
  }

  if (caughtFlags.length && urgentNeeded && s.disposition !== "refer-urgent") {
    push(
      "identified-flag-wrong-action",
      "critical",
      "You spotted the red flag but did not act on it",
      `You correctly identified ${caughtFlags.map((f) => f.label.toLowerCase()).join(" and ")}, then chose ${dispositionLabel(s.disposition ?? "")}. Recognition without escalation leaves the patient in the same position as if you had missed it.`
    );
  } else if (urgentNeeded && s.disposition !== "refer-urgent" && !missedFlags.length) {
    push(
      "unsafe-disposition",
      "critical",
      "This presentation needed urgent referral",
      c.dispositionRationale["refer-urgent"] ?? ""
    );
  }

  // ── Differential breadth ────────────────────────────────────────────
  const omitted = c.differentials.filter(
    (d) =>
      d.status === "must-not-miss" &&
      !s.initialDifferential.some((x) => x.differentialId === d.id)
  );
  for (const d of omitted) {
    push(
      "omitted-must-not-miss",
      "warning",
      `${d.label} never entered your differential`,
      `${d.rationale} You do not have to rank it highly — but a diagnosis you never listed is one you cannot rule out.`
    );
  }

  // ── Anchoring and revision ──────────────────────────────────────────
  const initialTop = s.initialDifferential[0]?.differentialId;
  const updatedTop = s.updatedDifferential[0]?.differentialId;
  const orderUnchanged =
    s.initialDifferential.length > 0 &&
    s.updatedDifferential.length > 0 &&
    s.initialDifferential.every(
      (d, i) => s.updatedDifferential[i]?.differentialId === d.differentialId
    );
  const confidenceUnchanged =
    orderUnchanged &&
    s.initialDifferential.every(
      (d, i) => s.updatedDifferential[i]?.confidence === d.confidence
    );
  const thinHistory = s.askedQuestionIds.length <= Math.max(2, Math.floor(c.subjectiveBudget / 2));

  if (confidenceUnchanged && s.performedExaminationIds.length > 0) {
    push(
      "ignored-findings",
      "warning",
      "Your differential did not move after examining the patient",
      "You performed an examination and then left every probability exactly where it was. If findings never change your thinking, the examination was ceremonial — decide in advance what result would change your mind."
    );
  } else if (orderUnchanged && thinHistory && correctDx) {
    push(
      "anchored-early",
      "warning",
      "You reached the right answer, but you appear to have anchored",
      "Your first-choice diagnosis never changed, and you gathered relatively little before committing to it. That works until it doesn't: the same habit produces confident errors in the presentations that look similar but aren't."
    );
  }

  const revisedAgainst = score.dimensions.interpretation.events.filter(
    (e) => e.kind === "penalty"
  );
  if (revisedAgainst.length) {
    push(
      "revised-against-evidence",
      "warning",
      "Some revisions ran against your own findings",
      revisedAgainst.map((e) => e.detail).join(" ")
    );
  } else if (
    !orderUnchanged &&
    initialTop !== updatedTop &&
    correctDx &&
    s.performedExaminationIds.length > 0
  ) {
    push(
      "good-revision",
      "praise",
      "You changed your mind for the right reason",
      "Your leading diagnosis after examination differed from your first impression, and the findings supported the change. Willingness to revise is the single most protective reasoning habit there is."
    );
  }

  // ── Calibration ─────────────────────────────────────────────────────
  if (!correctDx && s.finalConfidence >= 75) {
    push(
      "overconfident",
      "warning",
      "Your confidence outran your evidence",
      `You committed at ${s.finalConfidence}% to a diagnosis the findings did not support. Ask what result would have changed your mind — if nothing would have, the confidence was not derived from the examination.`
    );
  } else if (correctDx && s.finalConfidence <= 40) {
    push(
      "underconfident",
      "note",
      "You were right but hedged",
      `${s.finalConfidence}% confidence in a well-supported diagnosis tends to produce unnecessary imaging and referrals. Your reasoning was sound — trust it a little more.`
    );
  }

  // ── Efficiency and thoroughness ─────────────────────────────────────
  const inappropriate = c.examinations.filter(
    (e) => !e.appropriate && s.performedExaminationIds.includes(e.id)
  );
  if (inappropriate.length >= 2) {
    push(
      "over-tested",
      "note",
      `${inappropriate.length} of your examinations would not have changed management`,
      `You performed ${inappropriate.map((e) => e.name).join(", ")}. Before each test, it is worth asking what you would do differently depending on the result — if the answer is "nothing", the test costs time you could spend treating.`
    );
  }
  if (thinHistory && !correctDx) {
    push(
      "thin-history",
      "warning",
      "The diagnosis was reachable from the history you skipped",
      "You committed after a limited subjective examination. Most diagnostic information in musculoskeletal practice comes from the history; examination usually confirms rather than discovers."
    );
  }

  if (correctDx && score.safetyBreach) {
    push(
      "correct-but-lucky",
      "critical",
      "Right diagnosis, unsafe encounter",
      "You identified the condition correctly, but the safety steps around it failed. Grading this as a success would teach exactly the wrong lesson."
    );
  }

  if (
    out.every((f) => f.severity === "praise") &&
    correctDx &&
    !score.safetyBreach &&
    score.overall >= 80
  ) {
    push(
      "clean-encounter",
      "praise",
      "A clean encounter",
      "Safe, efficient, and well-reasoned. Harder presentations are where this gets tested — the ambiguous ones are coming."
    );
  }

  // Case-authored messages layer on top of the detected conditions.
  const detected = new Set(out.map((f) => f.condition));
  for (const rule of c.feedbackRules) {
    if (detected.has(rule.when as ReasoningCondition)) {
      push(rule.when as ReasoningCondition, rule.severity, "From this case", rule.message);
    }
  }

  return out.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

/** Essential questions the learner never asked, for the debrief. */
export function missedInformation(c: ClinicalCase, s: EncounterState) {
  return c.subjectiveQuestions
    .filter((q) => q.relevance === "essential" && !s.askedQuestionIds.includes(q.id))
    .map((q) => ({ question: q.question, answer: q.answer, why: q.explanation }));
}
