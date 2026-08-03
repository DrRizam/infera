import type { Profile, SrsRecord } from "../types";
import { todayISO } from "./srs";

const KEY = "clinician-profile-v1";
export const PROFILE_VERSION = 2;

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
  return p;
}

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const migrated = migrateProfile(JSON.parse(raw) as Profile);
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
  };
}

export function saveProfile(p: Profile): void {
  localStorage.setItem(KEY, JSON.stringify(p));
}

/** Streak logic: completing any session/case today extends or starts the streak. */
export function touchStreak(p: Profile): Profile {
  const today = todayISO();
  if (p.lastActiveDate === today) return p;
  const activityLog = p.activityLog.includes(today) ? p.activityLog : [...p.activityLog, today];
  p = { ...p, activityLog };
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yISO = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
  const streak = p.lastActiveDate === yISO ? p.streak + 1 : 1;
  return { ...p, streak, lastActiveDate: today };
}

/** Has the streak lapsed since last visit? (display only) */
export function effectiveStreak(p: Profile): number {
  if (!p.lastActiveDate) return 0;
  const today = todayISO();
  if (p.lastActiveDate === today) return p.streak;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yISO = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
  return p.lastActiveDate === yISO ? p.streak : 0;
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
