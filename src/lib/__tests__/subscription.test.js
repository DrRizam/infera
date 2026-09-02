import { describe, expect, it } from "vitest";
import {
  ADMIN_EMAILS,
  BETA_UNLIMITED,
  FREE_CASES_PER_DAY,
  FREE_SPEED_ROUNDS_PER_WEEK,
  casesRemaining,
  currentWeekKey,
  ensureCasePeriodFresh,
  ensureSpeedPeriodFresh,
  hasCasesRemaining,
  hasFullAccess,
  hasSpeedRoundsRemaining,
  isAdmin,
  isPremium,
  speedRoundsRemaining,
} from "../subscription";

const ADMIN_USER = { email: ADMIN_EMAILS[0] };
const REGULAR_USER = { email: "someone@example.com" };

describe("isAdmin", () => {
  it("is true for an admin email", () => {
    expect(isAdmin(ADMIN_USER)).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isAdmin({ email: ADMIN_EMAILS[0].toUpperCase() })).toBe(true);
  });

  it("is false for a non-admin email", () => {
    expect(isAdmin(REGULAR_USER)).toBe(false);
  });

  it("is false with no user", () => {
    expect(isAdmin(null)).toBe(false);
  });
});

describe("isPremium", () => {
  it("is true for active", () => {
    expect(isPremium({ subscription_status: "active" })).toBe(true);
  });

  it("is true for past_due (grace period, not yet canceled)", () => {
    expect(isPremium({ subscription_status: "past_due" })).toBe(true);
  });

  it("is false for free or canceled", () => {
    expect(isPremium({ subscription_status: "free" })).toBe(false);
    expect(isPremium({ subscription_status: "canceled" })).toBe(false);
  });
});

describe("ensureCasePeriodFresh", () => {
  it("resets case_count on a new day", () => {
    const p = ensureCasePeriodFresh({ case_day: "2026-08-25", case_count: 3 }, "2026-08-26");
    expect(p.case_count).toBe(0);
    expect(p.case_day).toBe("2026-08-26");
  });

  it("leaves case_count alone on the same day", () => {
    const p = ensureCasePeriodFresh({ case_day: "2026-08-26", case_count: 2 }, "2026-08-26");
    expect(p.case_count).toBe(2);
  });

  it("resets case_bonus_count (rewarded-ad credit) on a new day too", () => {
    const p = ensureCasePeriodFresh({ case_day: "2026-08-25", case_bonus_count: 2 }, "2026-08-26");
    expect(p.case_bonus_count).toBe(0);
  });
});

describe("hasCasesRemaining / casesRemaining", () => {
  it("is always true for an admin or premium user regardless of count", () => {
    expect(hasCasesRemaining({ case_count: 999 }, ADMIN_USER)).toBe(true);
    expect(hasCasesRemaining({ case_count: 999, subscription_status: "active" }, REGULAR_USER)).toBe(true);
  });

  // The daily cap is lifted for everyone during the closed beta; these assert
  // the post-beta contract and reactivate when BETA_UNLIMITED flips to false.
  describe.skipIf(BETA_UNLIMITED)("free-user daily cap (post-beta)", () => {
    it("is true under the cap, false at it, for a free user", () => {
      expect(hasCasesRemaining({ case_count: FREE_CASES_PER_DAY - 1 }, REGULAR_USER)).toBe(true);
      expect(hasCasesRemaining({ case_count: FREE_CASES_PER_DAY }, REGULAR_USER)).toBe(false);
    });

    it("extends the cap by a rewarded-ad bonus for a free user", () => {
      expect(hasCasesRemaining({ case_count: FREE_CASES_PER_DAY, case_bonus_count: 1 }, REGULAR_USER)).toBe(true);
      expect(hasCasesRemaining({ case_count: FREE_CASES_PER_DAY + 1, case_bonus_count: 1 }, REGULAR_USER)).toBe(false);
    });

    it("counts down for a free user, never negative", () => {
      expect(casesRemaining({ case_count: 1 }, REGULAR_USER)).toBe(FREE_CASES_PER_DAY - 1);
      expect(casesRemaining({ case_count: FREE_CASES_PER_DAY + 5 }, REGULAR_USER)).toBe(0);
    });
  });

  it("is null (unlimited) for admin/premium", () => {
    expect(casesRemaining({ case_count: 0 }, ADMIN_USER)).toBeNull();
    expect(casesRemaining({ case_count: 0, subscription_status: "active" }, REGULAR_USER)).toBeNull();
  });
});

describe("hasFullAccess", () => {
  it("is true for admin or an active/past_due subscriber", () => {
    expect(hasFullAccess({}, ADMIN_USER)).toBe(true);
    expect(hasFullAccess({ subscription_status: "active" }, REGULAR_USER)).toBe(true);
    expect(hasFullAccess({ subscription_status: "past_due" }, REGULAR_USER)).toBe(true);
  });

  it.skipIf(BETA_UNLIMITED)("is false for a free user (post-beta)", () => {
    expect(hasFullAccess({ subscription_status: "free" }, REGULAR_USER)).toBe(false);
  });

  it.runIf(BETA_UNLIMITED)("is true for every signed-in user during the closed beta", () => {
    expect(hasFullAccess({ subscription_status: "free" }, REGULAR_USER)).toBe(true);
    expect(hasCasesRemaining({ case_count: 999 }, REGULAR_USER)).toBe(true);
    expect(hasSpeedRoundsRemaining({ speed_week_count: 999 }, REGULAR_USER)).toBe(true);
  });
});

describe("ensureSpeedPeriodFresh", () => {
  it("resets speed_week_count when the week rolls over", () => {
    const old = currentWeekKey(new Date(2026, 7, 1));
    const p = ensureSpeedPeriodFresh({ speed_week: old, speed_week_count: 3 }, new Date(2026, 7, 20));
    expect(p.speed_week_count).toBe(0);
  });

  it("leaves speed_week_count alone within the same week", () => {
    const now = new Date(2026, 7, 20);
    const p = ensureSpeedPeriodFresh({ speed_week: currentWeekKey(now), speed_week_count: 2 }, now);
    expect(p.speed_week_count).toBe(2);
  });
});

describe("hasSpeedRoundsRemaining / speedRoundsRemaining", () => {
  it("is always true for admin or premium", () => {
    expect(hasSpeedRoundsRemaining({ speed_week_count: 999 }, ADMIN_USER)).toBe(true);
    expect(hasSpeedRoundsRemaining({ speed_week_count: 999, subscription_status: "active" }, REGULAR_USER)).toBe(true);
  });

  it("is null (unlimited) for admin/premium", () => {
    expect(speedRoundsRemaining({ speed_week_count: 0 }, ADMIN_USER)).toBeNull();
  });

  // Lifted for everyone during the closed beta — see hasCasesRemaining above.
  describe.skipIf(BETA_UNLIMITED)("free-user weekly cap (post-beta)", () => {
    it("is true under the weekly cap, false at it, for a free user", () => {
      expect(hasSpeedRoundsRemaining({ speed_week_count: FREE_SPEED_ROUNDS_PER_WEEK - 1 }, REGULAR_USER)).toBe(true);
      expect(hasSpeedRoundsRemaining({ speed_week_count: FREE_SPEED_ROUNDS_PER_WEEK }, REGULAR_USER)).toBe(false);
    });

    it("counts down for a free user", () => {
      expect(speedRoundsRemaining({ speed_week_count: 1 }, REGULAR_USER)).toBe(FREE_SPEED_ROUNDS_PER_WEEK - 1);
    });
  });
});
