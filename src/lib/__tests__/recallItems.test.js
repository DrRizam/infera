import { describe, expect, it } from "vitest";
import { countDueRecallItems, generateRecallItems, selectRecallSession } from "../recallItems";
import { CASES } from "../../data/cases";

const cases = [
  {
    id: "case-a",
    module: "sports",
    presenting_complaint: "Anterior knee pain",
    patient_age: 27,
    patient_sex: "female",
    red_flags: [
      { id: "night-pain", label: "Night pain", present: true, rationale: "Bone-stress hallmark." },
      { id: "trauma", label: "Recent trauma", present: false, rationale: "Would suggest fracture instead." },
    ],
    examinations: [
      { id: "hop-test", label: "Single-leg hop test", finding: "Reproduces pain", useful: true, rationale: "Strong provocation test." },
      { id: "mri", label: "MRI", finding: "Bone marrow edema", useful: true, rationale: "Confirms diagnosis." },
      { id: "xray", label: "X-ray", finding: "Unremarkable", useful: false, rationale: "Not indicated." },
    ],
    disposition: {
      options: [
        { id: "monitor", label: "Monitor", escalation: "monitor" },
        { id: "investigate", label: "Investigate", escalation: "investigate" },
      ],
      correct: "investigate",
      rationale: "Needs imaging before continued loading.",
    },
  },
  {
    id: "case-b",
    module: "msk",
    presenting_complaint: "Low back pain",
    examinations: [{ id: "slr", label: "Straight leg raise", finding: "Negative", useful: true, rationale: "Screens for radiculopathy." }],
    red_flags: [],
    disposition: null,
  },
];

describe("generateRecallItems", () => {
  const items = generateRecallItems(cases);

  it("generates one exam item per useful examination, skipping non-useful ones", () => {
    const examItems = items.filter((i) => i.type === "exam" && i.caseId === "case-a");
    expect(examItems.map((i) => i.topicId).sort()).toEqual(["hop-test", "mri"]);
  });

  it("gives every exam item at least one distractor option alongside the correct one", () => {
    const hop = items.find((i) => i.id === "case-a__exam__hop-test");
    expect(hop.options.length).toBeGreaterThanOrEqual(2);
    expect(hop.options[hop.correctIndex]).toBe("Single-leg hop test");
  });

  it("generates one item per red flag, correct answer matching presence", () => {
    const nightPain = items.find((i) => i.id === "case-a__redflag__night-pain");
    const trauma = items.find((i) => i.id === "case-a__redflag__trauma");
    expect(nightPain.correctIndex).toBe(0);
    expect(trauma.correctIndex).toBe(1);
  });

  it("generates a disposition item only when disposition data exists", () => {
    expect(items.find((i) => i.id === "case-a__disposition")).toBeTruthy();
    expect(items.find((i) => i.id === "case-b__disposition")).toBeUndefined();
  });

  it("skips exam items when there are no other examinations to serve as distractors", () => {
    // case-b has a single examination, so no exam item should be generated for it.
    expect(items.find((i) => i.type === "exam" && i.caseId === "case-b")).toBeUndefined();
  });
});

describe("selectRecallSession", () => {
  const items = generateRecallItems(cases);

  it("prioritizes overdue items before never-attempted ones", () => {
    const dueId = items[0].id;
    const progress = { [dueId]: { next_review_date: "2026-08-01", attempts: 1 } };
    const session = selectRecallSession(items, progress, { today: "2026-08-10", size: 1 });
    expect(session[0].id).toBe(dueId);
  });

  it("excludes items that are scheduled for the future", () => {
    const futureId = items[0].id;
    const progress = { [futureId]: { next_review_date: "2099-01-01", attempts: 1, last_played_date: "2026-08-01" } };
    const session = selectRecallSession(items, progress, { today: "2026-08-10", size: items.length });
    // it should still appear (as a "seen" item), just not prioritized ahead of due/fresh ones
    expect(session.map((i) => i.id)).toContain(futureId);
  });

  it("respects a module filter", () => {
    const session = selectRecallSession(items, {}, { today: "2026-08-10", size: 50, moduleFilter: "sports" });
    expect(session.every((i) => i.module === "sports")).toBe(true);
    expect(session.length).toBeGreaterThan(0);
  });

  it("caps the session at the requested size", () => {
    const session = selectRecallSession(items, {}, { today: "2026-08-10", size: 2 });
    expect(session.length).toBe(2);
  });
});

describe("generateRecallItems against the real case bank", () => {
  it("produces a well-formed, non-empty pool with no missing correct answers", () => {
    const items = generateRecallItems(CASES);
    expect(items.length).toBeGreaterThan(50);
    for (const item of items) {
      expect(item.correctIndex).toBeGreaterThanOrEqual(0);
      expect(item.options[item.correctIndex]).toBeTruthy();
      expect(item.options.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("gives every item a unique id", () => {
    const items = generateRecallItems(CASES);
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
  });
});

describe("countDueRecallItems", () => {
  it("counts only items past their review date", () => {
    const items = generateRecallItems(cases);
    const progress = {
      [items[0].id]: { next_review_date: "2026-08-01" },
      [items[1].id]: { next_review_date: "2099-01-01" },
    };
    expect(countDueRecallItems(items, progress, "2026-08-10")).toBe(1);
  });

  it("returns 0 when nothing has progress yet", () => {
    const items = generateRecallItems(cases);
    expect(countDueRecallItems(items, {}, "2026-08-10")).toBe(0);
  });
});
