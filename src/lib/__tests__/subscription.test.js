import { describe, expect, it } from "vitest";
import {
  ADMIN_EMAILS,
  FREE_DEBRIEF_LIMIT,
  FREE_RECALL_SESSIONS_PER_WEEK,
  currentPeriodKey,
  currentWeekKey,
  debriefsRemaining,
  ensureDebriefPeriodFresh,
  ensureRecallPeriodFresh,
  hasFullDebriefsRemaining,
  hasRecallSessionsRemaining,
  isAdmin,
  isPremium,
  recallSessionsRemaining,
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

describe("currentPeriodKey", () => {
  it("formats as YYYY-MM", () => {
    expect(currentPeriodKey(new Date(2026, 7, 20))).toBe("2026-08");
  });
});

describe("ensureDebriefPeriodFresh", () => {
  it("resets debrief_count on a new month", () => {
    const p = ensureDebriefPeriodFresh({ debrief_period: "2026-07", debrief_count: 9 }, new Date(2026, 7, 1));
    expect(p.debrief_count).toBe(0);
    expect(p.debrief_period).toBe("2026-08");
  });

  it("leaves debrief_count alone within the same month", () => {
    const p = ensureDebriefPeriodFresh({ debrief_period: "2026-08", debrief_count: 4 }, new Date(2026, 7, 20));
    expect(p.debrief_count).toBe(4);
  });
});

describe("hasFullDebriefsRemaining", () => {
  it("is true under the cap for a free user", () => {
    expect(hasFullDebriefsRemaining({ debrief_count: FREE_DEBRIEF_LIMIT - 1 }, REGULAR_USER)).toBe(true);
  });

  it("is false at the cap for a free user", () => {
    expect(hasFullDebriefsRemaining({ debrief_count: FREE_DEBRIEF_LIMIT }, REGULAR_USER)).toBe(false);
  });

  it("is always true for an admin regardless of count", () => {
    expect(hasFullDebriefsRemaining({ debrief_count: 999 }, ADMIN_USER)).toBe(true);
  });

  it("is always true for a premium user regardless of count", () => {
    expect(hasFullDebriefsRemaining({ debrief_count: 999, subscription_status: "active" }, REGULAR_USER)).toBe(true);
  });
});

describe("debriefsRemaining", () => {
  it("counts down for a free user", () => {
    expect(debriefsRemaining({ debrief_count: 3 }, REGULAR_USER)).toBe(FREE_DEBRIEF_LIMIT - 3);
  });

  it("never goes negative past the cap", () => {
    expect(debriefsRemaining({ debrief_count: FREE_DEBRIEF_LIMIT + 5 }, REGULAR_USER)).toBe(0);
  });

  it("is null (unlimited) for admin or premium", () => {
    expect(debriefsRemaining({ debrief_count: 0 }, ADMIN_USER)).toBeNull();
    expect(debriefsRemaining({ debrief_count: 0, subscription_status: "active" }, REGULAR_USER)).toBeNull();
  });
});

describe("currentWeekKey", () => {
  it("is stable within the same week", () => {
    const a = currentWeekKey(new Date(2026, 7, 17)); // Monday
    const b = currentWeekKey(new Date(2026, 7, 19)); // Wednesday, same week
    expect(a).toBe(b);
  });

  it("changes after 7 days", () => {
    const a = currentWeekKey(new Date(2026, 7, 17));
    const b = currentWeekKey(new Date(2026, 7, 24));
    expect(a).not.toBe(b);
  });
});

describe("ensureRecallPeriodFresh", () => {
  it("resets recall_session_count on a new week", () => {
    const p = ensureRecallPeriodFresh(
      { recall_period: currentWeekKey(new Date(2026, 7, 10)), recall_session_count: 4 },
      new Date(2026, 7, 20)
    );
    expect(p.recall_session_count).toBe(0);
  });

  it("leaves recall_session_count alone within the same week", () => {
    const now = new Date(2026, 7, 20);
    const p = ensureRecallPeriodFresh({ recall_period: currentWeekKey(now), recall_session_count: 2 }, now);
    expect(p.recall_session_count).toBe(2);
  });
});

describe("hasRecallSessionsRemaining / recallSessionsRemaining", () => {
  it("is true under the cap, false at it, for a free user", () => {
    expect(hasRecallSessionsRemaining({ recall_session_count: FREE_RECALL_SESSIONS_PER_WEEK - 1 }, REGULAR_USER)).toBe(true);
    expect(hasRecallSessionsRemaining({ recall_session_count: FREE_RECALL_SESSIONS_PER_WEEK }, REGULAR_USER)).toBe(false);
  });

  it("is always true for admin or premium", () => {
    expect(hasRecallSessionsRemaining({ recall_session_count: 999 }, ADMIN_USER)).toBe(true);
    expect(hasRecallSessionsRemaining({ recall_session_count: 999, subscription_status: "active" }, REGULAR_USER)).toBe(true);
  });

  it("counts down for a free user and is null (unlimited) for admin", () => {
    expect(recallSessionsRemaining({ recall_session_count: 2 }, REGULAR_USER)).toBe(FREE_RECALL_SESSIONS_PER_WEEK - 2);
    expect(recallSessionsRemaining({ recall_session_count: 0 }, ADMIN_USER)).toBeNull();
  });
});
