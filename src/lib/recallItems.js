// ── Recall items ─────────────────────────────────────────────────────────
// Short, single-decision drill items derived from the existing case bank's
// examinations, red flags, and disposition data — not authored separately.
// Each case already carries a prompt-shaped fact (an examination worth
// choosing, a red flag worth catching, a disposition worth getting right)
// plus the rationale/evidence behind it; this just extracts that shape into
// a standalone 1-3 minute unit instead of the full multi-stage encounter.
//
// Pure and testable, same pattern as caseEngine.js/gamification.js — no
// storage access here.

import { shuffleSeed } from "@/lib/caseEngine";
import { todayStr } from "@/lib/gamification";

function vignetteFor(c) {
  const who = [c.patient_age ? `${c.patient_age}yo` : null, c.patient_sex, c.occupation].filter(Boolean).join(" ");
  return who ? `${c.presenting_complaint} — ${who}.` : c.presenting_complaint;
}

function examItem(c, exam, otherExams) {
  const distractors = shuffleSeed(otherExams, `${c.id}:${exam.id}:distractors`).slice(0, 2);
  if (!distractors.length) return null;
  const optionExams = shuffleSeed([exam, ...distractors], `${c.id}:${exam.id}:order`);
  return {
    id: `${c.id}__exam__${exam.id}`,
    type: "exam",
    caseId: c.id,
    module: c.module,
    topicId: exam.id,
    vignette: vignetteFor(c),
    prompt: "Which examination is most useful here?",
    options: optionExams.map((e) => e.label),
    correctIndex: optionExams.findIndex((e) => e.id === exam.id),
    evidence: [exam.finding, exam.rationale].filter(Boolean).join(" — "),
  };
}

function redFlagItem(c, flag) {
  return {
    id: `${c.id}__redflag__${flag.id}`,
    type: "red_flag",
    caseId: c.id,
    module: c.module,
    topicId: flag.id,
    vignette: vignetteFor(c),
    prompt: `Is "${flag.label}" present in this presentation?`,
    options: ["Present in this case", "Not present in this case"],
    correctIndex: flag.present ? 0 : 1,
    evidence: flag.rationale || "",
  };
}

function dispositionItem(c) {
  const options = c.disposition?.options;
  if (!options?.length) return null;
  const correctIndex = options.findIndex((o) => o.id === c.disposition.correct);
  if (correctIndex === -1) return null;
  return {
    id: `${c.id}__disposition`,
    type: "disposition",
    caseId: c.id,
    module: c.module,
    topicId: `${c.id}-disposition`,
    vignette: vignetteFor(c),
    prompt: "What happens to this patient now?",
    options: options.map((o) => o.label),
    correctIndex,
    evidence: c.disposition.rationale || "",
  };
}

/** Derives the full recall-item pool from the case bank. */
export function generateRecallItems(cases) {
  const items = [];
  for (const c of cases || []) {
    const exams = c.examinations || [];
    for (const exam of exams.filter((e) => e.useful)) {
      const item = examItem(c, exam, exams.filter((e) => e.id !== exam.id));
      if (item) items.push(item);
    }
    for (const flag of c.red_flags || []) {
      items.push(redFlagItem(c, flag));
    }
    const dispo = dispositionItem(c);
    if (dispo) items.push(dispo);
  }
  return items;
}

/**
 * Picks a session's worth of items: overdue items first (oldest-due first),
 * then never-attempted items, then everything else least-recently-seen —
 * so a short session always surfaces what's actually due before novelty.
 */
export function selectRecallSession(items, itemProgress, { today = todayStr(), size = 8, moduleFilter } = {}) {
  const pool = moduleFilter ? items.filter((i) => i.module === moduleFilter) : items;
  const progress = itemProgress || {};

  const due = [];
  const fresh = [];
  const seen = [];
  for (const item of pool) {
    const p = progress[item.id];
    if (!p) fresh.push(item);
    else if (p.next_review_date && p.next_review_date <= today) due.push({ item, dueDate: p.next_review_date });
    else seen.push({ item, lastPlayed: p.last_played_date || "" });
  }
  due.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  seen.sort((a, b) => a.lastPlayed.localeCompare(b.lastPlayed));

  return [...due.map((d) => d.item), ...fresh, ...seen.map((s) => s.item)].slice(0, size);
}

/** Count of items past their next_review_date — drives the Home due-badge. */
export function countDueRecallItems(items, itemProgress, today = todayStr()) {
  const progress = itemProgress || {};
  return items.filter((i) => progress[i.id]?.next_review_date && progress[i.id].next_review_date <= today).length;
}
