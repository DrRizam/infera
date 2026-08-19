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

/**
 * Resets daily_xp and refills hearts to full when the calendar date has
 * rolled over since last play. Hearts have no other regen mechanic, so a
 * daily reset is what keeps a bad session from being a permanent lockout.
 */
export function ensureDailyFresh(profile, today = todayStr()) {
  if (profile.daily_goal_date === today) return profile;
  return { ...profile, daily_xp: 0, daily_goal_date: today, hearts: 5 };
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

/** A perfect case refills hearts to full; a poor one costs hearts. */
export function heartsAfterCase(hearts, accuracy) {
  const wrongs = Math.round(((100 - accuracy) / 100) * 5);
  return Math.min(5, Math.max(0, hearts - wrongs + 1));
}

/** Speed round timer: wrong answers cost 10s; a correct-answer streak of 2+ earns 5s each time. */
export function speedRoundTimerDelta(isCorrect, comboAfter) {
  if (!isCorrect) return -10;
  return comboAfter >= 2 ? 5 : 0;
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
