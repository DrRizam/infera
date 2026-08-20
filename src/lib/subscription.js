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

/** Resets the monthly debrief counter once the calendar month has rolled over. */
export function ensureDebriefPeriodFresh(profile, now = new Date()) {
  const key = currentPeriodKey(now);
  if (profile.debrief_period === key) return profile;
  return { ...profile, debrief_period: key, debrief_count: 0 };
}

export function hasFullDebriefsRemaining(profile, user) {
  if (isAdmin(user) || isPremium(profile)) return true;
  return (profile.debrief_count || 0) < FREE_DEBRIEF_LIMIT;
}

/** How many full debriefs are left this month, or null if unlimited. */
export function debriefsRemaining(profile, user) {
  if (isAdmin(user) || isPremium(profile)) return null;
  return Math.max(0, FREE_DEBRIEF_LIMIT - (profile.debrief_count || 0));
}

// Second paywall lever (Phase 2, deferred at launch): the Recall drill is
// study tooling, not raw case practice, so it's capped the same way full
// debriefs are — a session limit per week rather than per month, since
// Recall is meant to be a frequent short habit, not a monthly-scale thing.
export const FREE_RECALL_SESSIONS_PER_WEEK = 5;

/** A key that changes once every 7 days — not calendar-aligned to any particular start-of-week, just needs to roll over weekly. */
export function currentWeekKey(now = new Date()) {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  return `w${Math.floor(now.getTime() / msPerWeek)}`;
}

/** Resets the weekly Recall-session counter once the week has rolled over. */
export function ensureRecallPeriodFresh(profile, now = new Date()) {
  const key = currentWeekKey(now);
  if (profile.recall_period === key) return profile;
  return { ...profile, recall_period: key, recall_session_count: 0 };
}

export function hasRecallSessionsRemaining(profile, user) {
  if (isAdmin(user) || isPremium(profile)) return true;
  return (profile.recall_session_count || 0) < FREE_RECALL_SESSIONS_PER_WEEK;
}

/** How many Recall sessions are left this week, or null if unlimited. */
export function recallSessionsRemaining(profile, user) {
  if (isAdmin(user) || isPremium(profile)) return null;
  return Math.max(0, FREE_RECALL_SESSIONS_PER_WEEK - (profile.recall_session_count || 0));
}
