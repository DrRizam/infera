// ── Gamification ────────────────────────────────────────────────────────
// Pure functions only — no storage access here, so this stays testable and
// reusable from any screen. src/lib/store.js owns persistence.

export const LEVEL_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000, 5000, 6500, 8200];

export const LEVEL_TITLES = [
  "Pre-Clinical Observer",
  "Chart Reviewer",
  "Bedside Novice",
  "Clinical Trainee",
  "Junior Clinician",
  "Case Reasoner",
  "Differential Builder",
  "Senior Clinician",
  "Diagnostic Specialist",
  "Expert Diagnostician",
];

export function todayStr(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function daysBetween(a, b) {
  const da = new Date(`${a}T00:00:00Z`).getTime();
  const db = new Date(`${b}T00:00:00Z`).getTime();
  return Math.round((db - da) / 86400000);
}

export function addDays(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Elapsed duration as "m:ss" (or "h:mm:ss" past an hour) — for live/final session timers. */
export function formatElapsedTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

const WEEK_DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"]; // Monday-first

/**
 * The current calendar week (Mon-Sun) as 7 days, each flagged done if a case
 * was completed that day — driven by `caseProgress[].completed_date`, the
 * same source rollStreak() itself advances from, so this never shows a day
 * as "done" that didn't actually count toward the streak.
 */
export function weekStreakDays(profile, today = todayStr()) {
  const completedDates = new Set(
    Object.values(profile?.caseProgress || {})
      .map((p) => p.completed_date)
      .filter(Boolean)
  );

  const dow = new Date(`${today}T00:00:00Z`).getUTCDay(); // 0=Sun..6=Sat
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = addDays(today, mondayOffset);

  return WEEK_DAY_LABELS.map((label, i) => {
    const date = addDays(monday, i);
    return { date, label, done: completedDates.has(date), isToday: date === today };
  });
}

/** Level, title, and progress toward the next level from lifetime XP. */
export function levelFromXp(xp) {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  const title = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
  const floor = LEVEL_THRESHOLDS[level - 1];
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? null;
  const levelSpan = nextThreshold != null ? nextThreshold - floor : 0;
  const intoLevel = xp - floor;
  const progress = nextThreshold != null && levelSpan > 0 ? Math.min(1, intoLevel / levelSpan) : 1;
  const xpToNext = nextThreshold != null ? Math.max(0, nextThreshold - xp) : 0;
  return { level, title, intoLevel, levelSpan, progress, xpToNext };
}

/**
 * Forgiving streak logic: a 1-day gap is normal continuation; a 2-day gap is
 * forgiven once by spending a rest-day shield (earned every 5 practice days,
 * capped at 3); anything longer resets the streak. Returns the patched
 * profile fields plus whether a shield was spent, so the caller can show it.
 */
export function rollStreak(profile, today = todayStr()) {
  const last = profile.last_active_date;
  let streak = profile.streak_count || 0;
  let shields = profile.rest_shields || 0;
  let shieldUsed = false;
  let isNewDay = true;

  if (!last) {
    streak = 1;
  } else {
    const gap = daysBetween(last, today);
    isNewDay = gap !== 0;
    if (gap === 0) {
      // already active today — no change
    } else if (gap === 1) {
      streak += 1;
    } else if (gap === 2 && shields > 0) {
      shields -= 1;
      streak += 1;
      shieldUsed = true;
    } else {
      streak = 1;
    }
  }

  const longest = Math.max(profile.longest_streak || 0, streak);

  let practiceDays = profile.practice_days || 0;
  if (isNewDay) practiceDays += 1;
  if (practiceDays >= 5) {
    practiceDays -= 5;
    shields = Math.min(3, shields + 1);
  }

  return {
    profile: {
      ...profile,
      streak_count: streak,
      longest_streak: longest,
      rest_shields: shields,
      practice_days: practiceDays,
      last_active_date: today,
    },
    shieldUsed,
  };
}

/** Resets daily_xp when the calendar date has rolled over since last play. */
export function ensureDailyFresh(profile, today = todayStr()) {
  if (profile.daily_goal_date === today) return profile;
  return { ...profile, daily_xp: 0, daily_goal_date: today };
}

/** Exponential moving average — recent performance matters more than history. */
export function updateMastery(mastery, subject, accuracy) {
  const prev = mastery?.[subject] ?? accuracy;
  const next = Math.round(prev * 0.6 + accuracy * 0.4);
  return { ...(mastery || {}), [subject]: next };
}

/**
 * Spaced-repetition interval for a case: a stronger result comes back later.
 * `attempts` adds up to 4 extra days on top of the base interval — repeated
 * attempts at the same case signal it's already getting drilled, so the gap
 * widens further.
 */
export function nextReviewDate(accuracy, attempts = 1, today = todayStr()) {
  const base = accuracy >= 90 ? 7 : accuracy >= 70 ? 4 : 2;
  const bonus = Math.min(4, Math.max(0, attempts - 1));
  return addDays(today, base + bonus);
}

export function xpForCase(reward, accuracy) {
  return Math.max(5, Math.round(reward * (accuracy / 100)));
}

/**
 * Retention isn't "did you open the app today" — it's "of everything
 * you've learned, how much is still fresh vs. overdue for review." Streaks
 * built on daily activity alone don't mean anything clinically; this ties
 * the number to real forgetting-debt, using the same next_review_date data
 * that drives the review queue itself.
 */
export function retentionStats(profile, today = todayStr()) {
  const learned = [...Object.values(profile?.caseProgress || {}), ...Object.values(profile?.itemProgress || {})];
  const total = learned.length;
  if (!total) return { retained: 0, overdue: 0, total: 0, percent: null };

  const overdue = learned.filter((p) => p.next_review_date && p.next_review_date <= today).length;
  const retained = total - overdue;
  return { retained, overdue, total, percent: Math.round((retained / total) * 100) };
}

/**
 * Classifies a stated confidence level (0-100) against whether the call was
 * actually right — not a hard lives/hearts mechanic. Clinical answers are
 * rarely fully right or wrong, so what matters more than "wrong = penalty"
 * is whether the learner's confidence matches their actual accuracy.
 * Overconfidence (sure of a wrong call) is the clinically dangerous
 * direction; underconfidence (unsure despite being right) is a lesser but
 * still real miscalibration. Anything else counts as calibrated.
 */
export function classifyCalibration(confidence, wasCorrect) {
  if (confidence >= 66 && !wasCorrect) return "overconfident";
  if (confidence <= 33 && wasCorrect) return "underconfident";
  return "calibrated";
}

/** Tallies a calibration outcome into the running per-category counts. */
export function updateCalibration(calibration, outcome) {
  const c = calibration || { calibrated: 0, overconfident: 0, underconfident: 0 };
  return { ...c, [outcome]: (c[outcome] || 0) + 1 };
}

// Every other reward in this app is deterministic (fixed XP for a given
// accuracy, a streak shield earned on a known schedule) — the unpredictable
// payoff is what a variable-ratio reward adds on top, not a bigger number.
// Kept as its own low-odds roll on top of normal case XP rather than folded
// into xpForCase, so it stays visibly a "surprise" and not just more grind.
export const SURPRISE_CHEST_CHANCE = 0.15;
export const SURPRISE_CHEST_XP_RANGE = [15, 40];

/**
 * Rolls for a bonus XP chest on a completed case. `rng` is injectable so
 * this stays deterministic in tests; callers use the default Math.random.
 */
export function rollSurpriseChest(rng = Math.random) {
  if (rng() >= SURPRISE_CHEST_CHANCE) return null;
  const [min, max] = SURPRISE_CHEST_XP_RANGE;
  const bonusXp = min + Math.floor(rng() * (max - min + 1));
  return { bonusXp };
}

export function isAchievementEarned(achievement, profile) {
  const value = profile?.[achievement.metric] ?? 0;
  return value >= achievement.goal;
}

export function achievementProgress(achievement, profile) {
  const value = profile?.[achievement.metric] ?? 0;
  if (!achievement.goal) return 1;
  return Math.min(1, value / achievement.goal);
}
