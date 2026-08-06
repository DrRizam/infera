import { afterEach, describe, expect, it, vi } from "vitest";
import type { Profile } from "../../types";
import type { ReviewQueueItem } from "../reviewQueue";
import { buildSession, dueCount, isReviewItem } from "../srs";

afterEach(() => {
  vi.useRealTimers();
});

function baseProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    profileVersion: 8,
    xp: 0,
    streak: 0,
    shields: 0,
    shieldProgress: 0,
    shieldedDates: [],
    flags: [],
    dailyGoal: 20,
    seenGradeHint: true,
    seenTour: true,
    experienceLevel: "clinician",
    conditionProgress: {},
    theme: "system",
    textSize: "normal",
    lastActiveDate: null,
    activityLog: [],
    srs: {},
    reviewItems: {},
    caseResults: [],
    sessionsCompleted: 0,
    onboarded: true,
    xpByDate: {},
    achievements: [],
    topicAgg: {},
    speedBest: 0,
    currentPath: "Shoulder pain",
    ...overrides,
  };
}

function makeReviewItem(overrides: Partial<ReviewQueueItem> = {}): ReviewQueueItem {
  return {
    id: "case:x",
    source: "case",
    prompt: "p",
    answer: "a",
    severity: "critical",
    because: "b",
    createdOn: "2026-08-01",
    stability: 5,
    difficulty: 5,
    dueDate: "2026-08-10",
    lastReview: null,
    reps: 0,
    lapses: 0,
    ...overrides,
  };
}

describe("buildSession", () => {
  it("interleaves due review items with due drills, weakest recall first", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-10T09:00:00"));

    // sh1-r1 has been reviewed before and has some residual recall (> 0).
    // The review item has never been reviewed (lastReview: null), so its
    // predicted recall is exactly 0 — it must come out weakest-first, ahead
    // of the drill, regardless of source.
    const profile = baseProfile({
      dailyGoal: 200,
      srs: {
        "sh1-r1": {
          drillId: "sh1-r1",
          stability: 10,
          difficulty: 5,
          dueDate: "2026-08-10",
          lastReview: "2026-07-20",
          reps: 3,
          lapses: 0,
        },
      },
      reviewItems: { "case:x": makeReviewItem({ dueDate: "2026-08-10", lastReview: null }) },
    });

    const session = buildSession(profile);
    expect(session[0].id).toBe("case:x");
    expect(isReviewItem(session[0])).toBe(true);
    expect(session[1].id).toBe("sh1-r1");
  });

  it("still fills remaining slots with unseen drills after due items are placed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-10T09:00:00"));

    const profile = baseProfile({
      dailyGoal: 5,
      reviewItems: { "case:x": makeReviewItem({ dueDate: "2026-08-10" }) },
    });

    const session = buildSession(profile);
    expect(session).toHaveLength(5);
    expect(isReviewItem(session[0])).toBe(true);
    // Everything after the one due review item is an unseen drill.
    expect(session.slice(1).every((item) => !isReviewItem(item))).toBe(true);
  });

  it("excludes review items that are not yet due or already mastered", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-10T09:00:00"));

    const profile = baseProfile({
      reviewItems: {
        notDue: makeReviewItem({ id: "notDue", dueDate: "2026-08-20" }),
        mastered: makeReviewItem({ id: "mastered", dueDate: "2026-08-01", reps: 5, stability: 90 }),
      },
    });

    expect(dueCount(profile)).toBe(0);
    const session = buildSession(profile);
    expect(session.some((item) => isReviewItem(item))).toBe(false);
  });
});
