import type { Complaint, Drill, Profile, SrsRecord, Topic } from "../types";
import { MODULE_OF_TOPIC } from "../types";
import { drills } from "../content";
import { review, gradeFromScore, retrievability, todayISO, type Grade } from "./fsrs";

export { todayISO };
export type { Grade };

/**
 * Apply one review. `grade` comes from the learner's self-rating when they
 * answered fully correctly; otherwise it is derived from the auto-score
 * (0 → Again, partial credit → Hard: "right construct, flawed execution").
 */
export function reviewDrill(
  record: SrsRecord | undefined,
  drillId: string,
  score: number,
  selfGrade?: Grade
): SrsRecord {
  const grade = selfGrade ?? gradeFromScore(score);
  const card = review(
    record
      ? {
          stability: record.stability,
          difficulty: record.difficulty,
          due: record.dueDate,
          lastReview: record.lastReview,
          reps: record.reps,
          lapses: record.lapses,
        }
      : undefined,
    grade
  );
  return {
    drillId,
    stability: card.stability,
    difficulty: card.difficulty,
    dueDate: card.due,
    lastReview: card.lastReview,
    reps: card.reps,
    lapses: card.lapses,
  };
}

/**
 * Build today's session: due reviews first (weakest first, from ALL modules —
 * spaced repetition doesn't pause for a path change), then unseen drills from
 * the learner's current path, topping up from other modules only if the path
 * is exhausted.
 *
 * `size` overrides the learner's daily goal (used by the short "quick" session).
 */
export function buildSession(profile: Profile, size?: number): Drill[] {
  const today = todayISO();
  const byId = new Map(drills.map((d) => [d.id, d]));

  const due = Object.values(profile.srs)
    .filter((r) => r.dueDate <= today && byId.has(r.drillId))
    // Weakest first: lowest predicted recall probability right now.
    .map((r) => ({ r, p: recallNow(r, today) }))
    .sort((a, b) => a.p - b.p || a.r.dueDate.localeCompare(b.r.dueDate))
    .map(({ r }) => byId.get(r.drillId)!);

  const unseen = drills.filter((d) => !profile.srs[d.id]);
  // Interleave topics a little: shuffle unseen deterministically by day
  const seed = today.split("-").join("");
  const shuffled = [...unseen].sort((a, b) => hash(seed + a.id) - hash(seed + b.id));
  const onPath = shuffled.filter((d) => MODULE_OF_TOPIC[d.topic] === profile.currentPath);
  const offPath = shuffled.filter((d) => MODULE_OF_TOPIC[d.topic] !== profile.currentPath);

  return [...due, ...onPath, ...offPath].slice(0, size ?? profile.dailyGoal);
}

/** Predicted probability the learner still recalls this drill today. */
function recallNow(r: SrsRecord, today: string): number {
  if (!r.lastReview) return 0;
  const elapsed = Math.max(
    0,
    Math.round(
      (new Date(today + "T00:00:00").getTime() - new Date(r.lastReview + "T00:00:00").getTime()) /
        86_400_000
    )
  );
  return retrievability(elapsed, r.stability);
}

export interface TopicMastery {
  topic: Topic;
  pct: number;
  seen: number;
  total: number;
}

/** Per-topic mastery: a drill counts as mastered after ~4 surviving reps. */
export function masteryByTopic(profile: Profile): TopicMastery[] {
  const topics = [...new Set(drills.map((d) => d.topic))];
  return topics.map((topic) => {
    const inTopic = drills.filter((d) => d.topic === topic);
    let strength = 0;
    let seen = 0;
    for (const d of inTopic) {
      const r = profile.srs[d.id];
      if (!r) continue;
      seen++;
      strength += r.reps === 0 ? 0.1 : Math.min(r.reps, 4) / 4;
    }
    return { topic, pct: Math.round((strength / inTopic.length) * 100), seen, total: inTopic.length };
  });
}

/** Mastery of one module (0–100). */
export function moduleMastery(profile: Profile, module: Complaint): number {
  const rows = masteryByTopic(profile).filter((m) => MODULE_OF_TOPIC[m.topic] === module);
  if (!rows.length) return 0;
  const totals = rows.reduce(
    (a, m) => ({ w: a.w + m.total, s: a.s + (m.pct / 100) * m.total }),
    { w: 0, s: 0 }
  );
  return Math.round((totals.s / totals.w) * 100);
}

/** Overall foundation %: mastery across every drill in the library. */
export function overallMastery(profile: Profile): number {
  let strength = 0;
  for (const d of drills) {
    const r = profile.srs[d.id];
    if (!r) continue;
    strength += r.reps === 0 ? 0.1 : Math.min(r.reps, 4) / 4;
  }
  return Math.round((strength / drills.length) * 100);
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

export function dueCount(profile: Profile): number {
  const today = todayISO();
  return Object.values(profile.srs).filter((r) => r.dueDate <= today).length;
}
