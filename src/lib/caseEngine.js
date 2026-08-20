// ── Clinical encounter engine ───────────────────────────────────────────
// Pure scoring + reasoning-error detection. No entity/SDK access — CasePlay
// collects the learner's answers and hands the whole thing to
// scoreEncounter(); everything below is deterministic and independently
// testable.
//
// Expected `answers` shape:
//   {
//     history: { [questionId]: pickedOptionIndex }, // which candidate question was chosen to ask
//     redFlags: [flagId, ...],            // flags the learner marked present
//     differentialRanking: [diffId, ...], // learner's order, most likely first
//     examinations: [examId, ...],        // examinations performed
//     disposition: dispositionOptionId,
//   }

const ESCALATION_LADDER = { monitor: 1, treat: 2, refer_routine: 3, investigate: 4, refer_urgent: 5 };

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Deterministic shuffle — same seed always produces the same order, so the
 * expert-authored order (which would leak the answer) never renders as-is. */
export function shuffleSeed(arr, seed) {
  const a = [...arr];
  let s = hashSeed(String(seed)) || 1;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Each history_question is an MCQ over candidate *questions to ask*, not candidate
 * patient answers — `answers[q.id]` is the index of the option the learner picked,
 * scored against `q.correct` (the most clinically appropriate one to ask). */
export function scoreHistory(answers, questions) {
  if (!questions?.length) return 1;
  const correct = questions.filter((q) => answers?.[q.id] === q.correct).length;
  return correct / questions.length;
}

/** Recall-weighted: missing a present red flag costs far more than an extra one. */
export function scoreRedFlags(selected, redFlags) {
  const list = redFlags || [];
  const sel = selected || [];
  const present = list.filter((f) => f.present);
  const selectedSet = new Set(sel);
  const missed = present.filter((f) => !selectedSet.has(f.id));
  const truePositives = present.filter((f) => selectedSet.has(f.id));
  const falsePos = list.filter((f) => !f.present && selectedSet.has(f.id));

  const recall = present.length ? truePositives.length / present.length : 1;
  const precision = sel.length ? truePositives.length / sel.length : present.length ? 0 : 1;
  const score = recall * 0.8 + precision * 0.2;

  return { score, missed, falsePos, truePositives };
}

/** How close the true diagnosis landed to the learner's top, plus exact-order credit. */
export function scoreDifferential(rankedIds, differentials) {
  const list = differentials || [];
  const ranked = rankedIds || [];
  const n = list.length;
  if (!n) return 1;

  const trueDx = list.find((d) => d.correct_rank === 1);
  const learnerPos = trueDx ? ranked.indexOf(trueDx.id) : -1;
  const rankScore = trueDx && learnerPos >= 0 ? Math.max(0, 1 - learnerPos / Math.max(1, n - 1)) : 0;

  let matches = 0;
  ranked.forEach((id, i) => {
    const d = list.find((x) => x.id === id);
    if (d && d.correct_rank === i + 1) matches += 1;
  });
  const orderScore = matches / n;

  return rankScore * 0.6 + orderScore * 0.4;
}

/** Picking indicated tests raises sensitivity; picking non-indicated ones costs specificity. */
export function scoreExaminations(selected, examinations) {
  const list = examinations || [];
  const sel = selected || [];
  const selectedSet = new Set(sel);
  const useful = list.filter((e) => e.useful);
  const notUseful = list.filter((e) => !e.useful);
  const usefulPicked = useful.filter((e) => selectedSet.has(e.id));
  const notUsefulPicked = notUseful.filter((e) => selectedSet.has(e.id));

  const sensitivity = useful.length ? usefulPicked.length / useful.length : 1;
  const specificity = notUseful.length ? (notUseful.length - notUsefulPicked.length) / notUseful.length : 1;

  return sensitivity * 0.6 + specificity * 0.4;
}

/** Exact escalation match = full credit; one rung off = half; further off = a fifth. */
export function scoreDisposition(choice, disposition) {
  const chosenOpt = disposition?.options?.find((o) => o.id === choice);
  const correctOpt = disposition?.options?.find((o) => o.id === disposition.correct);
  if (!chosenOpt || !correctOpt) return { score: 0, under: false, over: false };

  const chosenRung = ESCALATION_LADDER[chosenOpt.escalation];
  const correctRung = ESCALATION_LADDER[correctOpt.escalation];
  const diff = chosenRung - correctRung;
  const score = diff === 0 ? 1 : Math.abs(diff) === 1 ? 0.5 : 0.2;

  return { score, under: diff < 0, over: diff > 0 };
}

/**
 * Evidence for what the learner got right, not just what they missed — a
 * correct answer reveal should cite the same rationale/evidence an error
 * would, not just a checkmark. Kept separate from detectErrors() since this
 * is a citation list, not a reasoning-error list.
 */
export function collectCitations({ clinicalCase: c, redFlagResult, dispositionResult, disposition }) {
  const citations = [];

  for (const f of redFlagResult.truePositives) {
    if (f.rationale) citations.push({ kind: "red_flag", label: f.label, detail: f.rationale });
  }

  if (dispositionResult.score === 1 && c.disposition?.rationale) {
    const chosenOpt = c.disposition.options.find((o) => o.id === disposition);
    citations.push({ kind: "disposition", label: chosenOpt?.label || "Disposition", detail: c.disposition.rationale });
  }

  return citations;
}

/** Named reasoning errors, not just a score — the debrief cites the actual decision. */
export function detectErrors({ clinicalCase: c, answers, redFlagResult, dispositionResult }) {
  const errors = [];

  for (const f of redFlagResult.missed) {
    errors.push({ kind: "missed_red_flag", label: `Missed red flag: ${f.label}`, detail: f.rationale });
  }
  for (const f of redFlagResult.falsePos) {
    errors.push({ kind: "false_red_flag", label: `Flagged as a red flag: ${f.label}`, detail: f.rationale });
  }

  const trueDx = c.differentials.find((d) => d.correct_rank === 1);
  const learnerPos = trueDx ? (answers.differentialRanking || []).indexOf(trueDx.id) : -1;
  if (trueDx && learnerPos > 0) {
    errors.push({
      kind: "anchoring",
      label: `${trueDx.label} was ranked #${learnerPos + 1}, not #1`,
      detail: trueDx.notes || "Premature closure on an earlier, more familiar diagnosis.",
    });
  }

  if (dispositionResult.under) {
    errors.push({
      kind: "under_escalation",
      label: "Chose a lower level of care than the case required",
      detail: c.disposition.rationale,
    });
  }
  if (dispositionResult.over) {
    errors.push({
      kind: "over_escalation",
      label: "Escalated further than the case required",
      detail: c.disposition.rationale,
    });
  }

  const performed = answers.examinations || [];
  const overInvestigated = c.examinations.filter((e) => !e.useful && performed.includes(e.id));
  if (overInvestigated.length) {
    errors.push({
      kind: "over_investigation",
      label: `Selected ${overInvestigated.length} low-value examination${overInvestigated.length === 1 ? "" : "s"}`,
      detail: overInvestigated.map((e) => e.label).join(", "),
    });
  }

  const missedUseful = c.examinations.filter((e) => e.useful && !performed.includes(e.id));
  if (missedUseful.length) {
    errors.push({
      kind: "incomplete_exam",
      label: `Missed ${missedUseful.length} informative examination${missedUseful.length === 1 ? "" : "s"}`,
      detail: missedUseful.map((e) => e.label).join(", "),
    });
  }

  const historyAnswers = answers.history || {};
  const missedHistory = c.history_questions.filter((q) => historyAnswers[q.id] === undefined);
  if (missedHistory.length) {
    errors.push({
      kind: "history_gap",
      label: `${missedHistory.length} history question${missedHistory.length === 1 ? "" : "s"} left unanswered`,
      detail: missedHistory.map((q) => q.concept).join(", "),
    });
  }

  const askedWrong = c.history_questions.filter(
    (q) => historyAnswers[q.id] !== undefined && historyAnswers[q.id] !== q.correct
  );
  if (askedWrong.length) {
    errors.push({
      kind: "suboptimal_question",
      label: `Asked a lower-yield question instead of the most useful one, ${askedWrong.length} time${askedWrong.length === 1 ? "" : "s"}`,
      detail: askedWrong.map((q) => q.options[q.correct]).join(", "),
    });
  }

  return errors;
}

/**
 * A literal count of wrong decisions (not a weighted/blended score) — one
 * per wrong history question, missed or false-positive red flag, non-useful
 * examination picked, and a wrong disposition. Kept alongside `accuracy` as
 * a plain mistake tally distinct from the calibration tracking (see
 * gamification.js classifyCalibration), which is about confidence vs.
 * correctness, not raw mistake count.
 */
function countWrongDecisions({ clinicalCase: c, answers, redFlagResult, dispositionResult }) {
  const historyAnswers = answers.history || {};
  const historyWrong = (c.history_questions || []).filter((q) => historyAnswers[q.id] !== q.correct).length;

  const redFlagWrong = redFlagResult.missed.length + redFlagResult.falsePos.length;

  const performedExams = answers.examinations || [];
  const examWrong = (c.examinations || []).filter((e) => !e.useful && performedExams.includes(e.id)).length;

  const dispositionWrong = c.disposition?.options?.length && dispositionResult.score < 1 ? 1 : 0;

  return historyWrong + redFlagWrong + examWrong + dispositionWrong;
}

/** Weighted total: history 15%, red flags 25%, differential 20%, examinations 15%, disposition 25%. */
export function scoreEncounter(answers, clinicalCase) {
  const historyScore = scoreHistory(answers.history, clinicalCase.history_questions);
  const redFlagResult = scoreRedFlags(answers.redFlags, clinicalCase.red_flags);
  const differentialScore = scoreDifferential(answers.differentialRanking, clinicalCase.differentials);
  const examScore = scoreExaminations(answers.examinations, clinicalCase.examinations);
  const dispositionResult = scoreDisposition(answers.disposition, clinicalCase.disposition);

  const weighted =
    historyScore * 0.15 +
    redFlagResult.score * 0.25 +
    differentialScore * 0.2 +
    examScore * 0.15 +
    dispositionResult.score * 0.25;

  const accuracy = Math.round(weighted * 100);

  const errors = detectErrors({ clinicalCase, answers, redFlagResult, dispositionResult });
  const citations = collectCitations({ clinicalCase, redFlagResult, dispositionResult, disposition: answers.disposition });
  const wrongCount = countWrongDecisions({ clinicalCase, answers, redFlagResult, dispositionResult });

  return {
    accuracy,
    breakdown: {
      history: Math.round(historyScore * 100),
      redFlags: Math.round(redFlagResult.score * 100),
      differential: Math.round(differentialScore * 100),
      examinations: Math.round(examScore * 100),
      disposition: Math.round(dispositionResult.score * 100),
    },
    errors,
    citations,
    wrongCount,
    missedRedFlags: redFlagResult.missed,
    falsePositiveRedFlags: redFlagResult.falsePos,
  };
}

/**
 * Which of a case's stages actually have content, in order — presentation
 * always runs, the rest skip if the case has nothing for them. Doesn't
 * include a terminal debrief/results stage; callers append their own
 * (CasePlay wants a per-case debrief, an OSCE checkpoint doesn't).
 */
export function buildCaseStages(clinicalCase) {
  if (!clinicalCase) return [];
  const list = ["presentation"];
  if (clinicalCase.history_questions?.length) list.push("history");
  if (clinicalCase.red_flags?.length) list.push("red_flags");
  if (clinicalCase.differentials?.length) list.push("differential");
  if (clinicalCase.examinations?.length) list.push("examination");
  if (clinicalCase.disposition?.options?.length) list.push("disposition");
  return list;
}
