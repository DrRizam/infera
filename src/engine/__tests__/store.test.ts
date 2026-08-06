import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Profile } from "../../types";
import {
  DAYS_PER_SHIELD,
  MAX_SHIELDS,
  PROFILE_VERSION,
  addXp,
  effectiveStreak,
  exportProfile,
  importProfile,
  levelFor,
  loadProfile,
  logAnswer,
  migrateProfile,
  reconcileStreak,
  saveProfile,
  touchStreak,
} from "../store";

// ── In-memory localStorage ──────────────────────────────────────────────────
// The default vitest environment is Node, which has no localStorage. A tiny
// stand-in keeps these tests hermetic and fast rather than pulling in jsdom
// for what is otherwise pure logic.
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

beforeEach(() => {
  (globalThis as unknown as { localStorage: MemoryStorage }).localStorage = new MemoryStorage();
});

afterEach(() => {
  vi.useRealTimers();
});

function freshProfile(): Profile {
  // Bypasses localStorage entirely — exercises loadProfile's own default.
  return loadProfile();
}

/** A profile shaped exactly as profileVersion 1 left it: no version field,
 * SM-2 scheduling records, none of the fields introduced by v2-v7. Typed as
 * `Profile` for call-site convenience even though it deliberately doesn't
 * satisfy that shape yet — migrateProfile's whole job is closing the gap. */
function legacyV1Profile(): Profile {
  return {
    xp: 250,
    streak: 5,
    lastActiveDate: "2026-07-20",
    activityLog: ["2026-07-18", "2026-07-19", "2026-07-20"],
    srs: {
      "drill-1": { drillId: "drill-1", ease: 2.1, intervalDays: 7, dueDate: "2026-07-27", reps: 3, lapses: 1 },
      "drill-2": { drillId: "drill-2", ease: 2.8, intervalDays: 30, dueDate: "2026-08-19", reps: 6, lapses: 0 },
    },
    caseResults: [],
    sessionsCompleted: 12,
    onboarded: true,
    currentPath: "Shoulder pain",
  } as unknown as Profile;
}

describe("migrateProfile", () => {
  it("brings a v1 profile fully up to the current version", () => {
    const migrated = migrateProfile(legacyV1Profile());
    expect(migrated.profileVersion).toBe(PROFILE_VERSION);
    expect(migrated.shields).toBeTypeOf("number");
    expect(migrated.shieldedDates).toEqual([]);
    expect(migrated.dailyGoal).toBeTypeOf("number");
    expect(migrated.theme).toBe("system");
    expect(migrated.textSize).toBe("normal");
    expect(migrated.seenTour).toBeTypeOf("boolean");
    expect(migrated.experienceLevel).toBe("clinician");
    expect(migrated.conditionProgress).toEqual({});
    expect(migrated.flags).toEqual([]);
    expect(migrated.reviewItems).toEqual({});
  });

  it("defaults reviewItems to {} for a pre-v8 profile and leaves existing ones alone", () => {
    const withoutReviewItems = { ...legacyV1Profile(), profileVersion: 7 } as unknown as Profile;
    delete (withoutReviewItems as unknown as Record<string, unknown>).reviewItems;
    const migrated = migrateProfile(withoutReviewItems);
    expect(migrated.profileVersion).toBe(PROFILE_VERSION);
    expect(migrated.reviewItems).toEqual({});

    // Re-migrating an already-current profile must be a no-op (idempotent).
    const already: Profile = { ...migrated, reviewItems: { "case:x": {} as never } };
    expect(migrateProfile(already).reviewItems).toEqual({ "case:x": {} });
  });

  it("converts SM-2 records to FSRS state using the documented formula", () => {
    const migrated = migrateProfile(legacyV1Profile());
    const r = migrated.srs["drill-1"];
    // stability = max(intervalDays, 0.5); difficulty = clamp(1 + 9*(2.8-ease)/1.5, 1, 10)
    expect(r.stability).toBe(7);
    expect(r.difficulty).toBeCloseTo(1 + (9 * (2.8 - 2.1)) / 1.5, 5);
    expect(r.dueDate).toBe("2026-07-27");
    expect(r.reps).toBe(3);
    expect(r.lapses).toBe(1);
    // reps > 0, so the record must carry a lastReview rather than null —
    // an unreviewed-looking record would make it eligible to be treated as new.
    expect(r.lastReview).not.toBeNull();
  });

  it("clamps converted difficulty into the valid 1-10 range", () => {
    const extreme = legacyV1Profile() as Record<string, any>;
    extreme.srs = {
      "very-easy": { drillId: "very-easy", ease: 2.8, intervalDays: 60, dueDate: "2026-09-01", reps: 10, lapses: 0 },
      "very-hard": { drillId: "very-hard", ease: 1.3, intervalDays: 1, dueDate: "2026-07-21", reps: 0, lapses: 8 },
    };
    const migrated = migrateProfile(extreme as unknown as Profile);
    expect(migrated.srs["very-easy"].difficulty).toBeGreaterThanOrEqual(1);
    expect(migrated.srs["very-hard"].difficulty).toBeLessThanOrEqual(10);
  });

  it("gives an existing streak-holder exactly one shield, not zero and not the cap", () => {
    const withStreak = migrateProfile(legacyV1Profile()); // streak: 5
    expect(withStreak.shields).toBe(1);

    const noStreak = migrateProfile({ ...legacyV1Profile(), streak: 0 } as unknown as Profile);
    expect(noStreak.shields).toBe(0);
  });

  it("does not re-run a step whose version has already passed", () => {
    const migrated = migrateProfile(legacyV1Profile());
    const again = migrateProfile(JSON.parse(JSON.stringify(migrated)));
    expect(again).toEqual(migrated);
  });

  it("never overwrites a value the user has already customised", () => {
    // A profile mid-migration (already at v3) with a non-default daily goal
    // must keep it — the v4 guard is `if (typeof p.dailyGoal !== "number")`,
    // and a bug there would silently reset a learner's chosen commitment.
    const midMigration = {
      ...legacyV1Profile(),
      profileVersion: 3,
      shields: 2,
      shieldProgress: 4,
      shieldedDates: [],
      flags: [],
      dailyGoal: 15,
    };
    const migrated = migrateProfile(midMigration as unknown as Profile);
    expect(migrated.dailyGoal).toBe(15);
    expect(migrated.shields).toBe(2);
  });

  it("treats a missing profileVersion the same as version 1", () => {
    const noVersion = legacyV1Profile();
    delete (noVersion as unknown as Record<string, unknown>).profileVersion;
    expect(migrateProfile(noVersion as unknown as Profile).profileVersion).toBe(PROFILE_VERSION);
  });
});

describe("loadProfile", () => {
  it("returns a fresh, unonboarded profile when nothing is stored", () => {
    const p = freshProfile();
    expect(p.profileVersion).toBe(PROFILE_VERSION);
    expect(p.onboarded).toBe(false);
    expect(p.xp).toBe(0);
    expect(p.srs).toEqual({});
  });

  it("falls back to a fresh profile rather than throwing on corrupt storage", () => {
    localStorage.setItem("clinician-profile-v1", "{not valid json");
    expect(() => loadProfile()).not.toThrow();
    expect(loadProfile().profileVersion).toBe(PROFILE_VERSION);
  });

  it("migrates a stored legacy profile and persists the upgraded shape", () => {
    localStorage.setItem("clinician-profile-v1", JSON.stringify(legacyV1Profile()));
    const loaded = loadProfile();
    expect(loaded.profileVersion).toBe(PROFILE_VERSION);

    const persisted = JSON.parse(localStorage.getItem("clinician-profile-v1")!);
    expect(persisted.profileVersion).toBe(PROFILE_VERSION);
  });

  it("reaches a fixed point: loading twice does not change the stored data again", () => {
    localStorage.setItem("clinician-profile-v1", JSON.stringify(legacyV1Profile()));
    loadProfile();
    const afterFirst = localStorage.getItem("clinician-profile-v1");
    loadProfile();
    const afterSecond = localStorage.getItem("clinician-profile-v1");
    expect(afterSecond).toBe(afterFirst);
  });
});

describe("reconcileStreak", () => {
  it("leaves the profile untouched with no prior activity", () => {
    const p = freshProfile();
    expect(reconcileStreak(p)).toEqual(p);
  });

  it("is a no-op the same day or the day after (grace period)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-10T09:00:00"));
    const p = { ...freshProfile(), lastActiveDate: "2026-08-09", streak: 3 };
    expect(reconcileStreak(p)).toEqual(p);
  });

  it("spends shields to cover missed days and preserves the streak", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-10T09:00:00"));
    const p: Profile = { ...freshProfile(), lastActiveDate: "2026-08-06", streak: 9, shields: 2 };
    // Gap of 4 days -> 3 missed days (Aug 7, 8, 9), within the 2-shield budget? No: 3 > 2.
    // Use a smaller gap that IS coverable to test the covering branch precisely.
    const covered: Profile = { ...p, lastActiveDate: "2026-08-08" }; // 1 missed day (Aug 9)
    const next = reconcileStreak(covered);
    expect(next.shields).toBe(1);
    expect(next.shieldedDates).toEqual(["2026-08-09"]);
    expect(next.streak).toBe(9); // untouched — the streak survives
    expect(next.lastActiveDate).toBe("2026-08-09"); // rolled to yesterday, not today
  });

  it("resets the streak, but not the shield balance, when shields can't cover the gap", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-10T09:00:00"));
    const p: Profile = { ...freshProfile(), lastActiveDate: "2026-08-05", streak: 20, shields: 1 };
    // Gap of 5 days -> 4 missed days, only 1 shield available.
    const next = reconcileStreak(p);
    expect(next.streak).toBe(0);
    expect(next.shieldProgress).toBe(0);
    expect(next.shields).toBe(1); // not spent — an insufficient shield stays banked
  });
});

describe("touchStreak", () => {
  it("starts a streak at 1 on first-ever completion", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-10T09:00:00"));
    const next = touchStreak(freshProfile());
    expect(next.streak).toBe(1);
    expect(next.lastActiveDate).toBe("2026-08-10");
    expect(next.activityLog).toContain("2026-08-10");
    expect(next.shieldProgress).toBe(1);
  });

  it("increments the streak on a consecutive day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-10T09:00:00"));
    const p = { ...freshProfile(), lastActiveDate: "2026-08-09", streak: 4 };
    expect(touchStreak(p).streak).toBe(5);
  });

  it("resets to 1 after a real gap", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-10T09:00:00"));
    const p = { ...freshProfile(), lastActiveDate: "2026-08-05", streak: 12 };
    expect(touchStreak(p).streak).toBe(1);
  });

  it("does nothing on a second completion the same day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-10T09:00:00"));
    const p = { ...freshProfile(), lastActiveDate: "2026-08-10", streak: 3, xp: 40 };
    expect(touchStreak(p)).toEqual(p);
  });

  it("earns a shield every DAYS_PER_SHIELD consecutive days, capped at MAX_SHIELDS", () => {
    let p = freshProfile();
    for (let day = 1; day <= DAYS_PER_SHIELD * 3; day++) {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(`2026-08-${String(day).padStart(2, "0")}T09:00:00`));
      p = touchStreak(p);
    }
    // 21 consecutive days = 3 shield-earning intervals, hard-capped at 2.
    expect(p.shields).toBe(MAX_SHIELDS);
    expect(p.streak).toBe(DAYS_PER_SHIELD * 3);
  });
});

describe("effectiveStreak", () => {
  it("is 0 when the learner has never practised", () => {
    expect(effectiveStreak(freshProfile())).toBe(0);
  });

  it("reports the live streak when last active today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-10T09:00:00"));
    const p = { ...freshProfile(), lastActiveDate: "2026-08-10", streak: 6 };
    expect(effectiveStreak(p)).toBe(6);
  });

  it("still reports the streak during yesterday's grace period", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-10T09:00:00"));
    const p = { ...freshProfile(), lastActiveDate: "2026-08-09", streak: 6 };
    expect(effectiveStreak(p)).toBe(6);
  });

  it("reports 0 once the grace period has passed, without mutating anything", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-10T09:00:00"));
    const p = { ...freshProfile(), lastActiveDate: "2026-08-01", streak: 6 };
    expect(effectiveStreak(p)).toBe(0);
    expect(p.streak).toBe(6); // display-only — the stored streak is untouched
  });
});

describe("export / import round trip", () => {
  it("preserves every field through export then import", () => {
    const original = touchStreak({ ...freshProfile(), xp: 340, dailyGoal: 12 });
    const restored = importProfile(exportProfile(original));
    expect(restored).toEqual(original);
  });

  it("rejects a file that isn't a Clinician backup", () => {
    expect(() => importProfile(JSON.stringify({ app: "someone-else", profile: {} }))).toThrow();
  });

  it("rejects malformed JSON", () => {
    expect(() => importProfile("{not json")).toThrow();
  });

  it("migrates an old backup on the way in", () => {
    const legacyBackup = JSON.stringify({
      app: "clinician",
      profileVersion: 1,
      exportedAt: new Date().toISOString(),
      profile: legacyV1Profile(),
    });
    const restored = importProfile(legacyBackup);
    expect(restored.profileVersion).toBe(PROFILE_VERSION);
    expect(restored.srs["drill-1"].stability).toBe(7);
  });
});

describe("saveProfile / resetProfile", () => {
  it("round-trips through localStorage", () => {
    const p = { ...freshProfile(), xp: 55 };
    saveProfile(p);
    expect(loadProfile().xp).toBe(55);
  });
});

describe("levelFor", () => {
  it("starts at level 1 with 0 xp", () => {
    expect(levelFor(0)).toEqual({ level: 1, into: 0, needed: 100 });
  });

  it("stays at level 1 just under the threshold", () => {
    expect(levelFor(99)).toEqual({ level: 1, into: 99, needed: 100 });
  });

  it("advances to level 2 exactly at 100 xp", () => {
    expect(levelFor(100)).toEqual({ level: 2, into: 0, needed: 200 });
  });

  it("advances to level 3 at the cumulative 300 xp threshold", () => {
    expect(levelFor(299)).toEqual({ level: 2, into: 199, needed: 200 });
    expect(levelFor(300)).toEqual({ level: 3, into: 0, needed: 300 });
  });
});

describe("addXp / logAnswer", () => {
  it("accumulates xp against today's date across repeated calls", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-10T09:00:00"));
    let p = addXp(freshProfile(), 10);
    p = addXp(p, 15);
    expect(p.xp).toBe(25);
    expect(p.xpByDate["2026-08-10"]).toBe(25);
  });

  it("accumulates topic accuracy across repeated answers", () => {
    let p = logAnswer(freshProfile(), "Rotator cuff tear", 1);
    p = logAnswer(p, "Rotator cuff tear", 0.5);
    expect(p.topicAgg["Rotator cuff tear"]).toEqual({ n: 2, sum: 1.5 });
  });
});
