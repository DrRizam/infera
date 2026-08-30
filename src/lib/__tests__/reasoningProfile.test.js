import { describe, expect, it } from "vitest";
import {
  caseDimensionWeight,
  reasoningDimensions,
  recommendCasesFor,
  weakestDimension,
} from "../reasoningProfile";

describe("reasoningDimensions", () => {
  const competency = {
    "sports:history": 40,
    "sports:differential": 80,
    "msk:history": 60,
    "msk:red_flag": 90,
  };

  it("averages a dimension across the modules that have data", () => {
    const dims = reasoningDimensions(competency);
    expect(dims.find((d) => d.type === "history").score).toBe(50); // (40 + 60) / 2
    expect(dims.find((d) => d.type === "red_flag").score).toBe(90);
    expect(dims.find((d) => d.type === "exam").score).toBeNull(); // no data
  });

  it("narrows to a module filter", () => {
    const dims = reasoningDimensions(competency, ["sports"]);
    expect(dims.find((d) => d.type === "history").score).toBe(40);
    expect(dims.find((d) => d.type === "red_flag").score).toBeNull();
  });

  it("is all null with no competency", () => {
    expect(reasoningDimensions({}).every((d) => d.score === null)).toBe(true);
  });
});

describe("weakestDimension", () => {
  it("returns the lowest scored dimension", () => {
    const dims = reasoningDimensions({ "sports:history": 40, "sports:differential": 80 });
    expect(weakestDimension(dims).type).toBe("history");
  });

  it("ignores dimensions with no data", () => {
    const dims = reasoningDimensions({ "sports:differential": 55 });
    expect(weakestDimension(dims).type).toBe("differential");
  });

  it("is null when nothing is scored", () => {
    expect(weakestDimension(reasoningDimensions({}))).toBeNull();
  });
});

describe("caseDimensionWeight", () => {
  const caseData = {
    red_flags: [{ present: true }, { present: true }, { present: false }],
    differentials: [{ must_not_miss: true }, {}, {}, {}],
    disposition: { correct: "refer_urgent", options: [{ id: "refer_urgent", escalation: "refer_urgent" }] },
    history_questions: [{}, {}],
    examinations: [{ useful: true }, { useful: true }, { useful: false }, { useful: false }],
  };

  it("weights red-flag load by present flags plus a must-not-miss", () => {
    expect(caseDimensionWeight(caseData, "red_flag")).toBe(3); // 2 present + 1 must-not-miss
  });

  it("weights an urgent disposition highest", () => {
    expect(caseDimensionWeight(caseData, "disposition")).toBe(4);
    const treat = { disposition: { correct: "treat", options: [{ id: "treat", escalation: "treat" }] } };
    expect(caseDimensionWeight(treat, "disposition")).toBe(1);
  });
});

describe("recommendCasesFor", () => {
  const cases = [
    { id: "a", difficulty: 1, differentials: [{}, {}], history_questions: [{}] },
    { id: "b", difficulty: 3, differentials: [{}, {}, {}, {}], history_questions: [{}] },
    { id: "c", difficulty: 2, differentials: [{}, {}, {}], history_questions: [{}] },
  ];

  it("ranks unplayed cases by dimension weight, dropping completed non-due ones", () => {
    const progress = { a: { status: "completed" } };
    const recs = recommendCasesFor("differential", cases, progress, "2026-08-30", 3);
    expect(recs.map((c) => c.id)).toEqual(["b", "c"]);
  });

  it("includes a completed case that is due for review", () => {
    const progress = { a: { status: "completed", next_review_date: "2026-08-01" } };
    const recs = recommendCasesFor("differential", [cases[0]], progress, "2026-08-30", 3);
    expect(recs.map((c) => c.id)).toEqual(["a"]);
  });

  it("drops completed cases that aren't due", () => {
    const progress = { a: { status: "completed", next_review_date: "2027-01-01" } };
    expect(recommendCasesFor("differential", [cases[0]], progress, "2026-08-30", 3)).toEqual([]);
  });
});
