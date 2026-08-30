// ── Subscription / paywall logic ─────────────────────────────────────────
// Free users get a daily allowance of full case practice (presentation →
// debrief, nothing held back) plus the daily game unlimited; Premium removes
// the case cap. A separate shared daily budget covers the drills. Pure,
// storage-free, mirrors gamification.js.

// Full access without a subscription — checked against the authenticated
// Supabase user's email (server-verified, not spoofable via client state),
// never against anything stored in the profile.
export const ADMIN_EMAILS = ["rizamshaar2014@gmail.com"];

export function isAdmin(user) {
  return !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
}

export function isPremium(profile) {
  return profile?.subscription_status === "active" || profile?.subscription_status === "past_due";
}

// ── Case practice: a daily allowance for free users ──────────────────────
// The daily game (?daily=1) never counts against this — it's the free hook.
export const FREE_CASES_PER_DAY = 3;

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
  if (isAdmin(user) || isPremium(profile)) return true;
  return (profile.case_count || 0) < effectiveCaseLimit(profile);
}

/** How many practice cases are left today, or null if unlimited. */
export function casesRemaining(profile, user) {
  if (isAdmin(user) || isPremium(profile)) return null;
  return Math.max(0, effectiveCaseLimit(profile) - (profile.case_count || 0));
}

// Second paywall lever: the drills (Recall + Speed round) are study tooling,
// not raw case practice — practicing cases and the daily game stay free and
// uncapped. One shared daily budget across both drill modes, since they're
// the same kind of frequent short-session habit.
export const FREE_DRILLS_PER_DAY = 5;

/** Resets the daily drill counter once the calendar day (local) has rolled over. `today` is a "YYYY-MM-DD" string (see gamification.todayStr). */
export function ensureDrillPeriodFresh(profile, today) {
  if (profile.drill_day === today) return profile;
  return { ...profile, drill_day: today, drill_count: 0 };
}

export function hasDrillsRemaining(profile, user) {
  if (isAdmin(user) || isPremium(profile)) return true;
  return (profile.drill_count || 0) < FREE_DRILLS_PER_DAY;
}

/** How many drills (Recall + Speed, combined) are left today, or null if unlimited. */
export function drillsRemaining(profile, user) {
  if (isAdmin(user) || isPremium(profile)) return null;
  return Math.max(0, FREE_DRILLS_PER_DAY - (profile.drill_count || 0));
}
