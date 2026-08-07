import { describe, expect, it } from "vitest";
import {
  achievementProgress,
  daysBetween,
  ensureDailyFresh,
  heartsAfterCase,
  isAchievementEarned,
  levelFromXp,
  nextReviewDate,
  rollStreak,
  todayStr,
  updateMastery,
  xpForCase,
} from "../gamification";

describe("levelFromXp", () => {
  it("starts at level 1 with the first title", () => {
    const r = levelFromXp(0);
    expect(r.level).toBe(1);
    expect(r.title).toBe("Pre-Clinical Observer");
  });

  it("advances at each threshold", () => {
    expect(levelFromXp(99).level).toBe(1);
    expect(levelFromXp(100).level).toBe(2);
    expect(levelFromXp(8200).level).toBe(14);
  });

  it("caps the title at the last one once levels exceed titles", () => {
    expect(levelFromXp(8200).title).toBe("Expert Diagnostician");
  });

  it("reports 0 xpToNext and full progress at max level", () => {
    const r = levelFromXp(50000);
    expect(r.xpToNext).toBe(0);
    expect(r.progress).toBe(1);
  });
});

describe("rollStreak", () => {
  it("starts a streak of 1 with no prior activity", () => {
    const { profile } = rollStreak({}, "2026-08-06");
    expect(profile.streak_count).toBe(1);
  });

  it("continues the streak on a 1-day gap", () => {
    const { profile } = rollStreak(
      { last_active_date: "2026-08-05", streak_count: 3, rest_shields: 1 },
      "2026-08-06"
    );
    expect(profile.streak_count).toBe(4);
    expect(profile.rest_shields).toBe(1);
  });

  it("does not change on the same day", () => {
    const { profile } = rollStreak({ last_active_date: "2026-08-06", streak_count: 3 }, "2026-08-06");
    expect(profile.streak_count).toBe(3);
  });

  it("spends a shield to forgive a 2-day gap", () => {
    const { profile, shieldUsed } = rollStreak(
      { last_active_date: "2026-08-04", streak_count: 3, rest_shields: 1 },
      "2026-08-06"
    );
    expect(shieldUsed).toBe(true);
    expect(profile.streak_count).toBe(4);
    expect(profile.rest_shields).toBe(0);
  });

  it("resets a 2-day gap with no shields", () => {
    const { profile, shieldUsed } = rollStreak(
      { last_active_date: "2026-08-04", streak_count: 3, rest_shields: 0 },
      "2026-08-06"
    );
    expect(shieldUsed).toBe(false);
    expect(profile.streak_count).toBe(1);
  });

  it("resets on a longer gap even with shields banked", () => {
    const { profile } = rollStreak(
      { last_active_date: "2026-08-01", streak_count: 5, rest_shields: 2 },
      "2026-08-06"
    );
    expect(profile.streak_count).toBe(1);
  });

  it("earns a shield every 5 practice days, capped at 3", () => {
    let profile = { rest_shields: 0, practice_days: 4, last_active_date: "2026-08-05", streak_count: 4 };
    ({ profile } = rollStreak(profile, "2026-08-06"));
    expect(profile.practice_days).toBe(0);
    expect(profile.rest_shields).toBe(1);
  });
});

describe("ensureDailyFresh", () => {
  it("resets daily_xp on a new day", () => {
    const p = ensureDailyFresh({ daily_xp: 40, daily_goal_date: "2026-08-05" }, "2026-08-06");
    expect(p.daily_xp).toBe(0);
    expect(p.daily_goal_date).toBe("2026-08-06");
  });

  it("leaves daily_xp alone on the same day", () => {
    const p = ensureDailyFresh({ daily_xp: 40, daily_goal_date: "2026-08-06" }, "2026-08-06");
    expect(p.daily_xp).toBe(40);
  });
});

describe("updateMastery", () => {
  it("sets mastery directly on first exposure", () => {
    expect(updateMastery({}, "knee", 80).knee).toBe(80);
  });

  it("blends toward the new score 60/40", () => {
    const m = updateMastery({ knee: 60 }, "knee", 90);
    expect(m.knee).toBe(Math.round(60 * 0.6 + 90 * 0.4));
  });
});

describe("nextReviewDate", () => {
  it("schedules further out for higher accuracy", () => {
    expect(daysBetween("2026-08-06", nextReviewDate(95, 1, "2026-08-06"))).toBe(7);
    expect(daysBetween("2026-08-06", nextReviewDate(80, 1, "2026-08-06"))).toBe(4);
    expect(daysBetween("2026-08-06", nextReviewDate(40, 1, "2026-08-06"))).toBe(2);
  });

  it("adds up to 4 bonus days for repeated attempts", () => {
    expect(daysBetween("2026-08-06", nextReviewDate(95, 3, "2026-08-06"))).toBe(9);
    expect(daysBetween("2026-08-06", nextReviewDate(95, 20, "2026-08-06"))).toBe(11);
  });
});

describe("xpForCase", () => {
  it("scales with accuracy but never drops below 5", () => {
    expect(xpForCase(40, 100)).toBe(40);
    expect(xpForCase(40, 50)).toBe(20);
    expect(xpForCase(40, 1)).toBe(5);
  });
});

describe("heartsAfterCase", () => {
  it("gains a heart on a perfect case, capped at 5", () => {
    expect(heartsAfterCase(2, 100)).toBe(3);
    expect(heartsAfterCase(5, 100)).toBe(5);
  });

  it("costs hearts on a poor case, never below 0", () => {
    expect(heartsAfterCase(1, 0)).toBe(0);
  });
});

describe("achievements", () => {
  const a = { metric: "total_cases_completed", goal: 10 };

  it("is earned once the metric reaches the goal", () => {
    expect(isAchievementEarned(a, { total_cases_completed: 10 })).toBe(true);
    expect(isAchievementEarned(a, { total_cases_completed: 9 })).toBe(false);
  });

  it("reports progress capped at 1", () => {
    expect(achievementProgress(a, { total_cases_completed: 5 })).toBe(0.5);
    expect(achievementProgress(a, { total_cases_completed: 50 })).toBe(1);
  });
});

describe("todayStr", () => {
  it("formats as UTC YYYY-MM-DD", () => {
    expect(todayStr(new Date("2026-08-06T23:59:00Z"))).toBe("2026-08-06");
  });
});
