// ── Context-aware prompt ─────────────────────────────────────────────────
// Notices when recent activity has clustered in one module and suggests a
// focused recall session there, instead of a generic daily reminder. Reads
// only data already loaded on the client (caseProgress/itemProgress
// timestamps) — no extra backend query.

import { daysBetween, todayStr } from "@/lib/gamification";

/**
 * Finds the module with the most activity in the last `windowDays`, if it
 * clears `minActivity` — otherwise there's nothing worth prompting about.
 */
export function suggestModuleFocus(profile, cases, { today = todayStr(), windowDays = 3, minActivity = 3 } = {}) {
  const caseById = new Map((cases || []).map((c) => [c.id, c]));
  const counts = {};
  const bump = (moduleId) => {
    if (!moduleId) return;
    counts[moduleId] = (counts[moduleId] || 0) + 1;
  };

  const withinWindow = (isoDate) => {
    const date = (isoDate || "").slice(0, 10);
    if (!date) return false;
    const gap = daysBetween(date, today);
    return gap >= 0 && gap <= windowDays;
  };

  for (const [caseId, p] of Object.entries(profile?.caseProgress || {})) {
    if (withinWindow(p.last_played_date)) bump(caseById.get(caseId)?.module);
  }
  for (const p of Object.values(profile?.itemProgress || {})) {
    if (withinWindow(p.last_played_date)) bump(p.module);
  }

  let best = null;
  for (const [moduleId, count] of Object.entries(counts)) {
    if (count >= minActivity && (!best || count > best.count)) best = { moduleId, count };
  }
  return best;
}
