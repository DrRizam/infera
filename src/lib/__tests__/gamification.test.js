import { describe, expect, it } from "vitest";
import {
  achievementProgress,
  classifyCalibration,
  daysBetween,
  ensureDailyFresh,
  isAchievementEarned,
  levelFromXp,
  nextReviewDate,
  retentionStats,
  rollStreak,
  speedRoundTimerDelta,
  todayStr,
  updateCalibration,
  updateMastery,
  weekStreakDays,
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

describe("weekStreakDays", () => {
  it("labels Monday through Sunday and marks today", () => {
    // 2026-08-19 is a Wednesday.
    const days = weekStreakDays({ caseProgress: {} }, "2026-08-19");
    expect(days.map((d) => d.label)).toEqual(["M", "T", "W", "T", "F", "S", "S"]);
    expect(days.map((d) => d.date)).toEqual([
      "2026-08-17",
      "2026-08-18",
      "2026-08-19",
      "2026-08-20",
      "2026-08-21",
      "2026-08-22",
      "2026-08-23",
    ]);
    expect(days.find((d) => d.isToday).date).toBe("2026-08-19");
  });

  it("marks a day done only when a case was completed that day", () => {
    const profile = {
      caseProgress: {
        "case-a": { completed_date: "2026-08-17" },
        "case-b": { completed_date: "2026-08-19" },
      },
    };
    const days = weekStreakDays(profile, "2026-08-19");
    expect(days.filter((d) => d.done).map((d) => d.date)).toEqual(["2026-08-17", "2026-08-19"]);
  });

  it("rolls back to the prior week's Monday when today is a Sunday", () => {
    const days = weekStreakDays({ caseProgress: {} }, "2026-08-23");
    expect(days[0].date).toBe("2026-08-17");
    expect(days[6].date).toBe("2026-08-23");
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

describe("retentionStats", () => {
  it("returns null percent when nothing has been learned yet", () => {
    expect(retentionStats({}, "2026-08-19")).toEqual({ retained: 0, overdue: 0, total: 0, percent: null });
  });

  it("counts overdue items against retention, not-yet-due items for it", () => {
    const profile = {
      caseProgress: {
        a: { next_review_date: "2026-08-10" }, // overdue
        b: { next_review_date: "2026-08-25" }, // still fresh
      },
      itemProgress: {
        c: { next_review_date: "2026-08-19" }, // due today counts as overdue
      },
    };
    const stats = retentionStats(profile, "2026-08-19");
    expect(stats).toEqual({ retained: 1, overdue: 2, total: 3, percent: 33 });
  });

  it("reports 100% when nothing is currently overdue", () => {
    const profile = { caseProgress: { a: { next_review_date: "2026-09-01" } } };
    expect(retentionStats(profile, "2026-08-19").percent).toBe(100);
  });
});

describe("classifyCalibration", () => {
  it("flags high confidence on a wrong call as overconfident", () => {
    expect(classifyCalibration(90, false)).toBe("overconfident");
  });

  it("flags low confidence on a right call as underconfident", () => {
    expect(classifyCalibration(25, true)).toBe("underconfident");
  });

  it("treats high confidence + correct, and low confidence + wrong, as calibrated", () => {
    expect(classifyCalibration(90, true)).toBe("calibrated");
    expect(classifyCalibration(25, false)).toBe("calibrated");
  });

  it("treats mid-range confidence as calibrated regardless of outcome", () => {
    expect(classifyCalibration(60, true)).toBe("calibrated");
    expect(classifyCalibration(60, false)).toBe("calibrated");
  });
});

describe("updateCalibration", () => {
  it("starts a fresh tally from undefined", () => {
    expect(updateCalibration(undefined, "overconfident")).toEqual({ calibrated: 0, overconfident: 1, underconfident: 0 });
  });

  it("increments the right bucket without touching the others", () => {
    const start = { calibrated: 3, overconfident: 1, underconfident: 0 };
    expect(updateCalibration(start, "calibrated")).toEqual({ calibrated: 4, overconfident: 1, underconfident: 0 });
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

describe("speedRoundTimerDelta", () => {
  it("costs 10s on any wrong answer, regardless of combo", () => {
    expect(speedRoundTimerDelta(false, 0)).toBe(-10);
    expect(speedRoundTimerDelta(false, 5)).toBe(-10);
  });

  it("gives no bonus for a correct answer that hasn't reached a combo of 2", () => {
    expect(speedRoundTimerDelta(true, 1)).toBe(0);
  });

  it("gives a 5s bonus starting at combo 2, and on every combo beyond it", () => {
    expect(speedRoundTimerDelta(true, 2)).toBe(5);
    expect(speedRoundTimerDelta(true, 3)).toBe(5);
    expect(speedRoundTimerDelta(true, 10)).toBe(5);
  });
});
