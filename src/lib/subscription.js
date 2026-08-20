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
