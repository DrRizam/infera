// ── FSRS-4.5 scheduler ─────────────────────────────────────────────────────
// Free Spaced Repetition Scheduler (open-spaced-repetition/fsrs4anki, v4.5).
// Chosen over SM-2 because its two-component memory model (stability +
// difficulty) handles partial-credit procedural items far better than SM-2's
// single ease factor, and its state is portable: every record carries the full
// memory state, so exports survive engine upgrades and future cloud sync.
//
// Grades follow the clinical rubric agreed with the content owner:
//   1 Again — no idea / wrong construct
//   2 Hard  — right construct, flawed execution ("the idea is correct but the
//             execution isn't" is explicitly Hard, never Again)
//   3 Good  — correct with effort
//   4 Easy  — instant and certain

export type Grade = 1 | 2 | 3 | 4;
export const Again = 1, Hard = 2, Good = 3, Easy = 4;

/** Memory state for one item. Persisted; must stay JSON-serializable. */
export interface FsrsCard {
  stability: number; // days until retrievability decays to 90%
  difficulty: number; // 1 (easy) … 10 (hard)
  due: string; // ISO date (YYYY-MM-DD)
  lastReview: string | null; // ISO date of the most recent review
  reps: number; // successful review count
  lapses: number; // times graded Again after being learned
}

/** Default FSRS-4.5 parameters (fitted on the public Anki dataset). */
const W = [
  0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474,
  0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755,
];

const DECAY = -0.5;
const FACTOR = 19 / 81; // makes R(S, S) = 0.9
export const DESIRED_RETENTION = 0.9;
const MAX_INTERVAL_DAYS = 365;

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Probability of recall after `elapsedDays` given stability. */
export function retrievability(elapsedDays: number, stability: number): number {
  return Math.pow(1 + (FACTOR * Math.max(elapsedDays, 0)) / stability, DECAY);
}

/** Interval (days) at which retrievability falls to the desired retention. */
function nextIntervalDays(stability: number): number {
  const days = (stability / FACTOR) * (Math.pow(DESIRED_RETENTION, 1 / DECAY) - 1);
  return clamp(Math.round(days), 1, MAX_INTERVAL_DAYS);
}

function initStability(grade: Grade): number {
  return Math.max(W[grade - 1], 0.1);
}

function initDifficulty(grade: Grade): number {
  return clamp(W[4] - (grade - 3) * W[5], 1, 10);
}

function nextDifficulty(d: number, grade: Grade): number {
  const updated = d - W[6] * (grade - 3);
  // Mean reversion toward the initial difficulty of an Easy answer keeps
  // difficulty from saturating at the extremes over many reviews.
  return clamp(W[7] * initDifficulty(Easy) + (1 - W[7]) * updated, 1, 10);
}

function stabilityAfterRecall(d: number, s: number, r: number, grade: Grade): number {
  const hardPenalty = grade === Hard ? W[15] : 1;
  const easyBonus = grade === Easy ? W[16] : 1;
  return (
    s *
    (1 +
      Math.exp(W[8]) *
        (11 - d) *
        Math.pow(s, -W[9]) *
        (Math.exp(W[10] * (1 - r)) - 1) *
        hardPenalty *
        easyBonus)
  );
}

function stabilityAfterForget(d: number, s: number, r: number): number {
  const next =
    W[11] *
    Math.pow(d, -W[12]) *
    (Math.pow(s + 1, W[13]) - 1) *
    Math.exp(W[14] * (1 - r));
  return Math.min(next, s); // forgetting never increases stability
}

export function todayISO(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return todayISO(d);
}

function daysBetween(fromISO: string, toISO: string): number {
  const from = new Date(fromISO + "T00:00:00").getTime();
  const to = new Date(toISO + "T00:00:00").getTime();
  return Math.max(0, Math.round((to - from) / 86_400_000));
}

/** Apply one graded review and return the updated card. */
export function review(card: FsrsCard | undefined, grade: Grade, today = todayISO()): FsrsCard {
  if (!card || card.lastReview === null) {
    const stability = initStability(grade);
    return {
      stability,
      difficulty: initDifficulty(grade),
      due: addDays(today, grade === Again ? 1 : nextIntervalDays(stability)),
      lastReview: today,
      reps: grade === Again ? 0 : 1,
      lapses: card?.lapses ?? 0,
    };
  }

  const elapsed = daysBetween(card.lastReview, today);
  const r = retrievability(elapsed, card.stability);
  const difficulty = nextDifficulty(card.difficulty, grade);
  const stability = Math.max(
    grade === Again
      ? stabilityAfterForget(card.difficulty, card.stability, r)
      : stabilityAfterRecall(card.difficulty, card.stability, r, grade),
    0.1
  );

  return {
    stability,
    difficulty,
    due: addDays(today, grade === Again ? 1 : nextIntervalDays(stability)),
    lastReview: today,
    reps: grade === Again ? 0 : card.reps + 1,
    lapses: card.lapses + (grade === Again && card.reps > 0 ? 1 : 0),
  };
}

/**
 * Map an auto-scored answer (0–1, fractional credit allowed) to a grade.
 * Fully correct answers should instead ask the learner to self-grade
 * (Hard/Good/Easy) — this fallback covers the incorrect/partial cases.
 */
export function gradeFromScore(score: number): Grade {
  if (score >= 0.99) return Good;
  if (score >= 0.4) return Hard; // right construct, flawed execution
  return Again;
}
