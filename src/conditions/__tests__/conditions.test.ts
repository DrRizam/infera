import { describe, expect, it } from "vitest";
import { condition, essentialOnly, validateConditionIntegrity, type Condition } from "../schema";
import pfp from "../data/patellofemoral-pain.json";
import {
  MAX_REVIEW_CARDS_PER_CONDITION,
  buildLesson,
  createProgress,
  progressLabel,
  recordAnswer,
  reviewSeeds,
  seedReviewCards,
} from "../lesson";

const c: Condition = condition.parse(pfp);

describe("condition schema", () => {
  it("parses the sample condition and passes integrity checks", () => {
    expect(validateConditionIntegrity(c)).toEqual([]);
  });

  // These are UX constraints expressed as validation. If someone relaxes them
  // to fit "one more useful fact", these tests should fail loudly.
  it("caps symptoms at five so the essential lesson stays scannable", () => {
    const tooMany = {
      ...pfp,
      symptoms: [...c.symptoms, ...c.symptoms].slice(0, 6).map((s, i) => ({ ...s, id: `s${i}` })),
    };
    expect(condition.safeParse(tooMany).success).toBe(false);
  });

  it("caps takeaways at five", () => {
    const tooMany = { ...pfp, takeaways: ["a", "b", "c", "d", "e", "f"] };
    expect(condition.safeParse(tooMany).success).toBe(false);
  });

  it("rejects a definition long enough to be a paragraph", () => {
    const wordy = { ...pfp, definition: "x".repeat(400) };
    expect(condition.safeParse(wordy).success).toBe(false);
  });

  it("keeps the essential lesson under ten minutes", () => {
    expect(condition.safeParse({ ...pfp, estimatedMinutes: 25 }).success).toBe(false);
    expect(c.estimatedMinutes).toBeLessThanOrEqual(8);
  });

  it("keeps comparison table cells short", () => {
    for (const d of c.differentials) {
      for (const row of d.discriminators) {
        expect(row.thisCondition.length).toBeLessThanOrEqual(60);
        expect(row.alternative.length).toBeLessThanOrEqual(60);
      }
    }
  });

  it("rejects an interaction whose correct answer is not an option", () => {
    const broken: Condition = {
      ...c,
      interactions: {
        ...c.interactions,
        presentation: { ...c.interactions.presentation, correct: ["does-not-exist"] },
      },
    };
    expect(validateConditionIntegrity(broken)).toContain(
      'interaction "presentation" marks unknown option "does-not-exist" correct'
    );
  });

  it("rejects a tap-zone interaction pointing at an unknown zone", () => {
    const broken: Condition = {
      ...c,
      interactions: { ...c.interactions, location: { ...c.interactions.location, correct: ["z-nope"] } },
    };
    expect(validateConditionIntegrity(broken)).toContain(
      'interaction "location" marks unknown zone "z-nope" correct'
    );
  });
});

describe("content levels", () => {
  it("shows only essential findings in Quick View", () => {
    const shown = essentialOnly(c.symptoms);
    expect(shown.length).toBeLessThanOrEqual(5);
    expect(shown.every((s) => s.priority === "essential")).toBe(true);
    // The supportive item exists in the data but is withheld from the lesson.
    expect(c.symptoms.some((s) => s.priority === "supportive")).toBe(true);
    expect(shown.some((s) => s.priority === "supportive")).toBe(false);
  });

  it("keeps detailed content in the model rather than deleting it", () => {
    expect(c.deepDive.misconceptions.length).toBeGreaterThan(0);
    expect(c.evidence.references.length).toBeGreaterThan(0);
  });

  it("marks placeholder statistics rather than inventing figures", () => {
    const placeholder = c.evidence.statistics.find((s) => s.status === "placeholder");
    expect(placeholder).toBeDefined();
    expect(placeholder!.sensitivity).toBeNull();
  });
});

describe("lesson assembly", () => {
  it("builds one card per concept, each with a label", () => {
    const cards = buildLesson(c);
    expect(cards.length).toBeGreaterThanOrEqual(8);
    expect(cards[0].id).toBe("snapshot");
    expect(cards.at(-1)!.id).toBe("knowledge-check");
    expect(cards.every((k) => k.label.length > 0)).toBe(true);
  });

  it("skips cards the condition has no essential content for", () => {
    const noDifferentials: Condition = { ...c, differentials: [] };
    const ids = buildLesson(noDifferentials).map((k) => k.id);
    expect(ids).not.toContain("differentials");
  });

  it("reports progress in the required format", () => {
    const cards = buildLesson(c);
    expect(progressLabel(cards, 2)).toBe(`3 of ${cards.length} · Typical symptoms`);
  });

  it("records an answered interaction without duplicating it", () => {
    let p = createProgress(c.id);
    p = recordAnswer(p, "location");
    p = recordAnswer(p, "location");
    expect(p.answered).toEqual(["location"]);
  });
});

describe("review seeds", () => {
  it("generates nothing when the learner answered everything correctly", () => {
    expect(reviewSeeds(c, [])).toEqual([]);
  });

  it("generates seeds only for wrong answers", () => {
    const seeds = reviewSeeds(c, ["kc-location"]);
    expect(seeds).toHaveLength(1);
    expect(seeds[0].concept).toBe("pain-location");
  });

  it("caps seeds so one lesson cannot flood the queue", () => {
    const allWrong = c.knowledgeCheck.map((q) => q.id);
    expect(reviewSeeds(c, allWrong).length).toBeLessThanOrEqual(MAX_REVIEW_CARDS_PER_CONDITION);
  });

  it("puts safety-critical concepts first", () => {
    const seeds = reviewSeeds(c, ["kc-location", "kc-safety", "kc-aggravator"]);
    expect(seeds[0].concept).toBe("safety");
  });
});

describe("seedReviewCards", () => {
  it("FSRS-seeds each seed, id-prefixed by condition and concept, into the shared queue shape", () => {
    const items = seedReviewCards(c, ["kc-location"], "2026-08-01");
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe(`condition:${c.id}:pain-location`);
    expect(items[0].source).toBe("condition");
    expect(items[0].createdOn).toBe("2026-08-01");
    expect(items[0].dueDate).toBeTruthy();
  });

  it("seeds a missed safety question harder than other misses", () => {
    const [safetyItem] = seedReviewCards(c, ["kc-safety"], "2026-08-01");
    const [otherItem] = seedReviewCards(c, ["kc-location"], "2026-08-01");
    expect(safetyItem.severity).toBe("high");
    expect(otherItem.severity).toBe("moderate");
    // Hard-seeded cards come back sooner than Good-seeded ones.
    expect(safetyItem.dueDate <= otherItem.dueDate).toBe(true);
  });

  it("still respects the review-seed cap", () => {
    const allWrong = c.knowledgeCheck.map((q) => q.id);
    expect(seedReviewCards(c, allWrong).length).toBeLessThanOrEqual(MAX_REVIEW_CARDS_PER_CONDITION);
  });
});
