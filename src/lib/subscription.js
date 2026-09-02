// ── Subscription / paywall logic ─────────────────────────────────────────
// Free is a taste: the daily game (unlimited), a small daily allowance of
// full case practice, and a few Speed rounds a week. Everything else that
// makes Infera a study tool — Recall, the Anatomy quiz, OSCE checkpoints,
// spaced-repetition review, and weak-spot targeting — is Premium. Pure,
// storage-free, mirrors gamification.js.

// Full access without a subscription — checked against the authenticated
// Supabase user's email (server-verified, not spoofable via client state),
// never against anything stored in the profile.
export const ADMIN_EMAILS = ["rizamshaar2014@gmail.com"];

// Closed beta: paid checkout isn't live yet (Paddle still in verification),
// so every cap is lifted and every Premium-only feature is unlocked for all
// signed-in testers. Flip to false the moment billing goes live — the cap
// math below is the post-beta contract and stays fully exercised in tests.
export const BETA_UNLIMITED = true;

export function isAdmin(user) {
  return !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
}

export function isPremium(profile) {
  return profile?.subscription_status === "active" || profile?.subscription_status === "past_due";
}

/** Admin or a paying subscriber — the gate for every Premium-only feature. During the closed beta, everyone. */
export function hasFullAccess(profile, user) {
  return BETA_UNLIMITED || isAdmin(user) || isPremium(profile);
}

// ── Case practice: a small daily allowance for free users ────────────────
// The daily game (?daily=1) never counts against this — it's the free hook.
export const FREE_CASES_PER_DAY = 2;

/** Resets the daily case counter (and any ad-earned bonus) once the local calendar day has rolled over. `today` is a "YYYY-MM-DD" string. */
export function ensureCasePeriodFresh(profile, today) {
  if (profile.case_day === today) return profile;
  return { ...profile, case_day: today, case_count: 0, case_bonus_count: 0 };
}

/** Base daily allowance plus any cases earned by watching a rewarded ad (native only, see useRewardedAd.js). */
function effectiveCaseLimit(profile) {
  return FREE_CASES_PER_DAY + (profile.case_bonus_count || 0);
}

export function hasCasesRemaining(profile, user) {
  if (hasFullAccess(profile, user)) return true;
  return (profile.case_count || 0) < effectiveCaseLimit(profile);
}

/** How many practice cases are left today, or null if unlimited. */
export function casesRemaining(profile, user) {
  if (hasFullAccess(profile, user)) return null;
  return Math.max(0, effectiveCaseLimit(profile) - (profile.case_count || 0));
}

// ── Speed round: the one free drill, a few a week ────────────────────────
// Recall and the Anatomy quiz are Premium-only. Speed round is the taster,
// with a weekly (not daily) allowance since it's a quick habit.
export const FREE_SPEED_ROUNDS_PER_WEEK = 3;

/** A key that rolls over once every 7 days (not calendar-aligned). */
export function currentWeekKey(now = new Date()) {
  return `w${Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000))}`;
}

export function ensureSpeedPeriodFresh(profile, now = new Date()) {
  const key = currentWeekKey(now);
  if (profile.speed_week === key) return profile;
  return { ...profile, speed_week: key, speed_week_count: 0 };
}

export function hasSpeedRoundsRemaining(profile, user) {
  if (hasFullAccess(profile, user)) return true;
  return (profile.speed_week_count || 0) < FREE_SPEED_ROUNDS_PER_WEEK;
}

/** Speed rounds left this week, or null if unlimited. */
export function speedRoundsRemaining(profile, user) {
  if (hasFullAccess(profile, user)) return null;
  return Math.max(0, FREE_SPEED_ROUNDS_PER_WEEK - (profile.speed_week_count || 0));
}
