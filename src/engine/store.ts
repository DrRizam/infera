import type { Profile, SrsRecord } from "../types";
import { todayISO } from "./srs";
import { DEFAULT_DAILY_GOAL } from "../config";

const KEY = "clinician-profile-v1";
export const PROFILE_VERSION = 4;

/** Rest-day mechanic: how many days can be banked, and what earns one. */
export const MAX_SHIELDS = 2;
export const DAYS_PER_SHIELD = 7;

/** SM-2 record shape written by profileVersion 1 (pre-FSRS). */
interface LegacySrsRecord {
  drillId: string;
  ease: number;
  intervalDays: number;
  dueDate: string;
  reps: number;
  lapses: number;
}

/**
 * Convert an SM-2 record to FSRS state. Approximation: the scheduled interval
 * is a fair proxy for stability, and ease (1.3 hard … 2.8 easy) maps linearly
 * onto difficulty (10 … 1). Due dates and rep counts carry over unchanged, so
 * nothing is re-learned from scratch.
 */
function migrateSrsRecord(r: LegacySrsRecord): SrsRecord {
  return {
    drillId: r.drillId,
    stability: Math.max(r.intervalDays, 0.5),
    difficulty: Math.min(10, Math.max(1, 1 + (9 * (2.8 - r.ease)) / 1.5)),
    dueDate: r.dueDate,
    lastReview: r.reps > 0 || r.lapses > 0 ? r.dueDate : null,
    reps: r.reps,
    lapses: r.lapses,
  };
}

export function migrateProfile(p: Profile): Profile {
  // Migrate profiles saved by earlier versions
  if (!Array.isArray(p.activityLog)) {
    p.activityLog = p.lastActiveDate ? [p.lastActiveDate] : [];
  }
  if (typeof p.onboarded !== "boolean") p.onboarded = true; // existing users skip onboarding
  if (!p.xpByDate) p.xpByDate = p.lastActiveDate ? { [p.lastActiveDate]: p.xp } : {};
  if (!Array.isArray(p.achievements)) p.achievements = [];
  if (!p.topicAgg) p.topicAgg = {};
  if (typeof p.speedBest !== "number") p.speedBest = 0;
  if (!p.currentPath) p.currentPath = "Shoulder pain";
  if (!p.profileVersion || p.profileVersion < 2) {
    const migrated: Record<string, SrsRecord> = {};
    for (const [id, rec] of Object.entries(p.srs ?? {})) {
      const anyRec = rec as unknown as LegacySrsRecord & SrsRecord;
      migrated[id] = typeof anyRec.stability === "number" ? anyRec : migrateSrsRecord(anyRec);
    }
    p.srs = migrated;
    p.profileVersion = 2;
  }
  if (p.profileVersion < 3) {
    // Existing users start with one shield banked rather than none — losing a
    // streak to a mechanic that didn't exist when you earned it feels unfair.
    if (typeof p.shields !== "number") p.shields = p.streak > 0 ? 1 : 0;
    if (typeof p.shieldProgress !== "number") p.shieldProgress = 0;
    if (!Array.isArray(p.shieldedDates)) p.shieldedDates = [];
    if (!Array.isArray(p.flags)) p.flags = [];
    p.profileVersion = 3;
  }
  if (p.profileVersion < 4) {
    if (typeof p.dailyGoal !== "number") p.dailyGoal = DEFAULT_DAILY_GOAL;
    // Existing users have already met the grade buttons, so don't re-explain.
    if (typeof p.seenGradeHint !== "boolean") p.seenGradeHint = p.sessionsCompleted > 0;
    p.profileVersion = 4;
  }
  return p;
}

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const migrated = reconcileStreak(migrateProfile(JSON.parse(raw) as Profile));
      const reserialized = JSON.stringify(migrated);
      if (reserialized !== raw) localStorage.setItem(KEY, reserialized);
      return migrated;
    }
  } catch {
    /* corrupt state → fresh profile */
  }
  return {
    profileVersion: PROFILE_VERSION,
    xp: 0,
    streak: 0,
    lastActiveDate: null,
    activityLog: [],
    srs: {},
    caseResults: [],
    sessionsCompleted: 0,
    onboarded: false,
    xpByDate: {},
    achievements: [],
    topicAgg: {},
    speedBest: 0,
    currentPath: "Shoulder pain",
    shields: 0,
    shieldProgress: 0,
    shieldedDates: [],
    flags: [],
    dailyGoal: DEFAULT_DAILY_GOAL,
    seenGradeHint: false,
  };
}

// ── Active session (interruption safety) ───────────────────────────────────
// Clinicians get interrupted mid-anything, and an iOS PWA can be evicted from
// memory while backgrounded. The in-progress session is mirrored to storage so
// reopening the app resumes exactly where it left off instead of silently
// starting over.

const SESSION_KEY = "clinician-active-session-v1";

export interface ActiveSession {
  date: string;
  drillIds: string[];
  idx: number;
  scores: number[];
}

export function saveActiveSession(s: ActiveSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

/** Returns an in-progress session from today, or null. */
export function loadActiveSession(): ActiveSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as ActiveSession;
    if (s.date !== todayISO() || !Array.isArray(s.drillIds) || s.idx >= s.drillIds.length) {
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function clearActiveSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function saveProfile(p: Profile): void {
  localStorage.setItem(KEY, JSON.stringify(p));
}

function shiftISO(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(fromISO: string, toISO: string): number {
  const from = new Date(fromISO + "T00:00:00").getTime();
  const to = new Date(toISO + "T00:00:00").getTime();
  return Math.max(0, Math.round((to - from) / 86_400_000));
}

/**
 * Settle any missed days since the last visit. Called once on app load.
 *
 * Rest-day mechanic (chosen over Duolingo's hearts): a clinician finishing a
 * 12-hour clinic day should not be punished for skipping, so shields are
 * EARNED by practicing rather than bought, spend themselves silently, and
 * never block a session. Missing a day with a shield banked costs the shield,
 * not the streak — and a shielded day never increments the streak either, so
 * the number still means "days I actually practiced".
 */
export function reconcileStreak(p: Profile): Profile {
  if (!p.lastActiveDate) return p;
  const today = todayISO();
  const gap = daysBetween(p.lastActiveDate, today);
  if (gap <= 1) return p; // active today, or yesterday with today still open

  const missed = gap - 1;
  if (p.shields >= missed) {
    const covered: string[] = [];
    for (let i = 1; i <= missed; i++) covered.push(shiftISO(p.lastActiveDate, i));
    return {
      ...p,
      shields: p.shields - missed,
      shieldedDates: [...p.shieldedDates, ...covered],
      // Carry the streak forward to yesterday; today is still unearned.
      lastActiveDate: shiftISO(today, -1),
    };
  }
  return { ...p, streak: 0, shieldProgress: 0 };
}

/** Streak logic: completing any session/case today extends or starts the streak. */
export function touchStreak(p: Profile): Profile {
  const today = todayISO();
  if (p.lastActiveDate === today) return p;
  const activityLog = p.activityLog.includes(today) ? p.activityLog : [...p.activityLog, today];
  const yISO = shiftISO(today, -1);
  const streak = p.lastActiveDate === yISO ? p.streak + 1 : 1;

  // Earn a shield every DAYS_PER_SHIELD practice days, capped at MAX_SHIELDS.
  let shieldProgress = p.shieldProgress + 1;
  let shields = p.shields;
  if (shieldProgress >= DAYS_PER_SHIELD) {
    shieldProgress -= DAYS_PER_SHIELD;
    shields = Math.min(shields + 1, MAX_SHIELDS);
  }

  return { ...p, activityLog, streak, lastActiveDate: today, shields, shieldProgress };
}

/** Has the streak lapsed since last visit? (display only) */
export function effectiveStreak(p: Profile): number {
  if (!p.lastActiveDate) return 0;
  const today = todayISO();
  if (p.lastActiveDate === today) return p.streak;
  return p.lastActiveDate === shiftISO(today, -1) ? p.streak : 0;
}

/** Add XP and log it against today's date (for the stats chart). */
export function addXp(p: Profile, amount: number): Profile {
  const today = todayISO();
  return {
    ...p,
    xp: p.xp + amount,
    xpByDate: { ...p.xpByDate, [today]: (p.xpByDate[today] ?? 0) + amount },
  };
}

/** Record an answered drill against its topic for lifetime accuracy stats. */
export function logAnswer(p: Profile, topic: import("../types").Topic, score: number): Profile {
  const cur = p.topicAgg[topic] ?? { n: 0, sum: 0 };
  return { ...p, topicAgg: { ...p.topicAgg, [topic]: { n: cur.n + 1, sum: cur.sum + score } } };
}

export function resetProfile(): void {
  localStorage.removeItem(KEY);
}

// ── Backup / restore ───────────────────────────────────────────────────────
// The full profile (scheduling state included) exports as one JSON file.
// This is the user's insurance against WebView storage eviction and the
// bridge to future cloud sync — the export format is the sync format.

export interface ProfileExport {
  app: "clinician";
  profileVersion: number;
  exportedAt: string; // ISO datetime
  profile: Profile;
}

export function exportProfile(p: Profile): string {
  const payload: ProfileExport = {
    app: "clinician",
    profileVersion: p.profileVersion,
    exportedAt: new Date().toISOString(),
    profile: p,
  };
  return JSON.stringify(payload, null, 2);
}

/** Parse and migrate an exported backup. Throws with a readable message. */
export function importProfile(json: string): Profile {
  const parsed = JSON.parse(json) as Partial<ProfileExport>;
  if (parsed.app !== "clinician" || !parsed.profile) {
    throw new Error("Not a Clinician backup file.");
  }
  return migrateProfile(parsed.profile as Profile);
}

export function levelFor(xp: number): { level: number; into: number; needed: number } {
  // Level n requires 100 * n XP beyond the previous level.
  let level = 1;
  let remaining = xp;
  while (remaining >= level * 100) {
    remaining -= level * 100;
    level++;
  }
  return { level, into: remaining, needed: level * 100 };
}
