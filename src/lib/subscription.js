// ── Subscription / paywall logic ─────────────────────────────────────────
// Chess.com model: practicing cases is never throttled — only the full
// case debrief (the analysis layer, like chess.com's Game Review) is
// capped for free users. Pure, storage-free, mirrors gamification.js.

export const FREE_DEBRIEF_LIMIT = 10;

// Full access without a Stripe subscription — checked against the
// authenticated Supabase user's email (server-verified, not spoofable via
// client state), never against anything stored in the profile.
export const ADMIN_EMAILS = ["rizamshaar2014@gmail.com"];

export function isAdmin(user) {
  return !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
}

export function isPremium(profile) {
  return profile?.subscription_status === "active" || profile?.subscription_status === "past_due";
}

/** "2026-08" style key, used purely to detect a calendar-month rollover. */
export function currentPeriodKey(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Resets the monthly debrief counter (and any ad-earned bonus) once the calendar month has rolled over. */
export function ensureDebriefPeriodFresh(profile, now = new Date()) {
  const key = currentPeriodKey(now);
  if (profile.debrief_period === key) return profile;
  return { ...profile, debrief_period: key, debrief_count: 0, debrief_bonus_count: 0 };
}

/** Total debriefs allowed this month for a free user — the base limit plus any earned by watching a rewarded ad (Android only, see useRewardedAd.js). */
function effectiveDebriefLimit(profile) {
  return FREE_DEBRIEF_LIMIT + (profile.debrief_bonus_count || 0);
}

export function hasFullDebriefsRemaining(profile, user) {
  if (isAdmin(user) || isPremium(profile)) return true;
  return (profile.debrief_count || 0) < effectiveDebriefLimit(profile);
}

/** How many full debriefs are left this month, or null if unlimited. */
export function debriefsRemaining(profile, user) {
  if (isAdmin(user) || isPremium(profile)) return null;
  return Math.max(0, effectiveDebriefLimit(profile) - (profile.debrief_count || 0));
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
