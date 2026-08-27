import { describe, expect, it } from "vitest";
import {
  collectCitations,
  scoreDifferential,
  scoreDisposition,
  scoreEncounter,
  scoreExaminations,
  scoreHistory,
  scoreRedFlags,
  shuffleSeed,
} from "../caseEngine";

const differentials = [
  { id: "pfp", label: "Patellofemoral pain", correct_rank: 2, must_not_miss: false, notes: "" },
  { id: "bone-stress", label: "Tibial bone-stress injury", correct_rank: 1, must_not_miss: true, notes: "Re-examine anything not responding to load management." },
  { id: "tendinopathy", label: "Patellar tendinopathy", correct_rank: 3, must_not_miss: false, notes: "" },
];

const redFlags = [
  { id: "night-pain", label: "Night pain", present: true, rationale: "Bone-stress hallmark." },
  { id: "trauma", label: "Recent trauma", present: false, rationale: "Would suggest fracture instead." },
];

const examinations = [
  { id: "hop-test", label: "Single-leg hop test", finding: "positive", useful: true, cost: "low", rationale: "" },
  { id: "mri", label: "MRI", finding: "bone marrow edema", useful: true, cost: "high", rationale: "" },
  { id: "xray-lumbar", label: "Lumbar X-ray", finding: "unremarkable", useful: false, cost: "moderate", rationale: "" },
];

const disposition = {
  options: [
    { id: "monitor", label: "Monitor", escalation: "monitor" },
    { id: "treat", label: "Treat", escalation: "treat" },
    { id: "refer_routine", label: "Refer routinely", escalation: "refer_routine" },
    { id: "investigate", label: "Investigate", escalation: "investigate" },
    { id: "refer_urgent", label: "Refer urgently", escalation: "refer_urgent" },
  ],
  correct: "investigate",
  rationale: "Suspected bone-stress injury needs imaging before continued loading.",
};

const historyQuestions = [
  {
    id: "q1",
    context: "You want to understand how this started.",
    options: ["How did this start?", "How long have you had knee problems in general?", "Do you ice it after running?"],
    correct: 0,
    answer: "Gradual, no injury.",
    rationale: "",
    concept: "onset",
  },
  {
    id: "q2",
    context: "You're screening for a bone-stress hallmark.",
    options: ["Do you get pain at night, unrelated to activity?", "Is the pain worse in the morning?", "Does elevating the leg help?"],
    correct: 0,
    answer: "Yes, wakes her up.",
    rationale: "",
    concept: "night-pain",
  },
];

const clinicalCase = {
  id: "knee-case",
  history_questions: historyQuestions,
  red_flags: redFlags,
  differentials,
  examinations,
  disposition,
};

describe("scoreHistory", () => {
  it("scores the fraction of questions where the most appropriate one was picked", () => {
    expect(scoreHistory({ q1: 0, q2: 0 }, historyQuestions)).toBe(1);
    expect(scoreHistory({ q1: 0, q2: 1 }, historyQuestions)).toBe(0.5);
    expect(scoreHistory({}, historyQuestions)).toBe(0);
  });
});

describe("scoreRedFlags", () => {
  it("gives full credit for exactly flagging what's present", () => {
    const r = scoreRedFlags(["night-pain"], redFlags);
    expect(r.score).toBe(1);
    expect(r.missed).toEqual([]);
    expect(r.falsePos).toEqual([]);
  });

  it("penalizes a missed present flag harder than an extra false positive", () => {
    const missed = scoreRedFlags([], redFlags);
    const falsePositive = scoreRedFlags(["night-pain", "trauma"], redFlags);
    expect(missed.score).toBeLessThan(falsePositive.score);
    expect(missed.missed.map((f) => f.id)).toEqual(["night-pain"]);
    expect(falsePositive.falsePos.map((f) => f.id)).toEqual(["trauma"]);
  });

  it("reports correctly-caught flags as true positives", () => {
    const r = scoreRedFlags(["night-pain"], redFlags);
    expect(r.truePositives.map((f) => f.id)).toEqual(["night-pain"]);
  });

  it("weights a missed red flag twice as hard as a missed yellow flag", () => {
    const flags = [
      { id: "r", label: "Red", present: true, severity: "red", rationale: "" },
      { id: "y", label: "Yellow", present: true, severity: "yellow", rationale: "" },
    ];
    const missedYellow = scoreRedFlags(["r"], flags); // caught the red, missed the yellow
    const missedRed = scoreRedFlags(["y"], flags); // caught the yellow, missed the red
    expect(missedRed.score).toBeLessThan(missedYellow.score);
    expect(missedRed.missedRed.map((f) => f.id)).toEqual(["r"]);
    expect(missedYellow.missedYellow.map((f) => f.id)).toEqual(["y"]);
  });

  it("treats an entry with no severity as a red flag", () => {
    const flags = [{ id: "x", label: "X", present: true, rationale: "" }];
    const r = scoreRedFlags([], flags);
    expect(r.missedRed.map((f) => f.id)).toEqual(["x"]);
    expect(r.missedYellow).toEqual([]);
  });
});

describe("scoreDifferential", () => {
  it("gives full credit for the true diagnosis ranked first with exact order", () => {
    const score = scoreDifferential(["bone-stress", "pfp", "tendinopathy"], differentials);
    expect(score).toBe(1);
  });

  it("penalizes anchoring on the wrong diagnosis first", () => {
    const anchored = scoreDifferential(["pfp", "bone-stress", "tendinopathy"], differentials);
    expect(anchored).toBeLessThan(1);
  });

  it("scores zero when the true diagnosis is never listed", () => {
    expect(scoreDifferential(["pfp", "tendinopathy"], differentials)).toBe(0);
  });
});

describe("scoreExaminations", () => {
  it("rewards picking useful tests and penalizes non-useful ones", () => {
    const good = scoreExaminations(["hop-test", "mri"], examinations);
    const bad = scoreExaminations(["xray-lumbar"], examinations);
    expect(good).toBe(1);
    expect(bad).toBeLessThan(good);
  });
});

describe("scoreDisposition", () => {
  it("gives full credit for an exact match", () => {
    expect(scoreDisposition("investigate", disposition).score).toBe(1);
  });

  it("gives half credit one rung off and flags direction", () => {
    const under = scoreDisposition("refer_routine", disposition);
    expect(under.score).toBe(0.5);
    expect(under.under).toBe(true);

    const over = scoreDisposition("refer_urgent", disposition);
    expect(over.score).toBe(0.5);
    expect(over.over).toBe(true);
  });

  it("gives minimal credit further than one rung off", () => {
    expect(scoreDisposition("monitor", disposition).score).toBe(0.2);
  });
});

describe("scoreEncounter", () => {
  it("scores an ideal encounter near 100", () => {
    const answers = {
      history: { q1: 0, q2: 0 },
      redFlags: ["night-pain"],
      differentialRanking: ["bone-stress", "pfp", "tendinopathy"],
      examinations: ["hop-test", "mri"],
      disposition: "investigate",
    };
    const result = scoreEncounter(answers, clinicalCase);
    expect(result.accuracy).toBe(100);
    expect(result.errors).toEqual([]);
    expect(result.wrongCount).toBe(0);
  });

  it("counts exactly one wrong per mistake, not a blended score", () => {
    const answers = {
      history: { q1: 1, q2: 0 }, // one wrong history question
      redFlags: ["trauma"], // missed the real flag (night-pain) + one false positive (trauma)
      differentialRanking: ["bone-stress", "pfp", "tendinopathy"],
      examinations: ["xray-lumbar"], // one non-useful exam picked
      disposition: "treat", // wrong disposition
    };
    const result = scoreEncounter(answers, clinicalCase);
    // 1 history + 1 missed flag + 1 false-positive flag + 1 bad exam + 1 wrong disposition
    expect(result.wrongCount).toBe(5);
  });

  it("cites evidence for what was caught correctly, not just errors", () => {
    const answers = {
      history: { q1: 0, q2: 0 },
      redFlags: ["night-pain"],
      differentialRanking: ["bone-stress", "pfp", "tendinopathy"],
      examinations: ["hop-test", "mri"],
      disposition: "investigate",
    };
    const result = scoreEncounter(answers, clinicalCase);
    const kinds = result.citations.map((c) => c.kind);
    expect(kinds).toContain("red_flag");
    expect(kinds).toContain("disposition");
  });

  it("flags under-escalation as a safety error on an unsafe encounter", () => {
    const answers = {
      history: {},
      redFlags: [],
      differentialRanking: ["pfp", "tendinopathy", "bone-stress"],
      examinations: ["xray-lumbar"],
      disposition: "treat",
    };
    const result = scoreEncounter(answers, clinicalCase);
    expect(result.accuracy).toBeLessThan(50);
    const kinds = result.errors.map((e) => e.kind);
    expect(kinds).toContain("missed_red_flag");
    expect(kinds).toContain("anchoring");
    expect(kinds).toContain("under_escalation");
    expect(kinds).toContain("over_investigation");
    expect(kinds).toContain("incomplete_exam");
    expect(kinds).toContain("history_gap");
  });
});

describe("collectCitations", () => {
  it("cites a true-positive red flag's rationale", () => {
    const redFlagResult = scoreRedFlags(["night-pain"], redFlags);
    const dispositionResult = scoreDisposition("treat", disposition);
    const citations = collectCitations({ clinicalCase, redFlagResult, dispositionResult, disposition: "treat" });
    expect(citations).toEqual([{ kind: "red_flag", label: "Night pain", detail: "Bone-stress hallmark." }]);
  });

  it("cites the disposition rationale only when the choice was correct", () => {
    const redFlagResult = scoreRedFlags([], redFlags);
    const wrong = collectCitations({
      clinicalCase,
      redFlagResult,
      dispositionResult: scoreDisposition("treat", disposition),
      disposition: "treat",
    });
    expect(wrong.some((c) => c.kind === "disposition")).toBe(false);

    const right = collectCitations({
      clinicalCase,
      redFlagResult,
      dispositionResult: scoreDisposition("investigate", disposition),
      disposition: "investigate",
    });
    expect(right.some((c) => c.kind === "disposition")).toBe(true);
  });
});

describe("shuffleSeed", () => {
  it("is deterministic for the same seed", () => {
    const a = shuffleSeed(["a", "b", "c", "d"], "case-1");
    const b = shuffleSeed(["a", "b", "c", "d"], "case-1");
    expect(a).toEqual(b);
  });

  it("differs across seeds (not guaranteed, but true for this input)", () => {
    const a = shuffleSeed(["a", "b", "c", "d", "e"], "case-1");
    const b = shuffleSeed(["a", "b", "c", "d", "e"], "case-2");
    expect(a).not.toEqual(b);
  });

  it("never loses or duplicates elements", () => {
    const shuffled = shuffleSeed(["a", "b", "c", "d"], "seed");
    expect([...shuffled].sort()).toEqual(["a", "b", "c", "d"]);
  });
});
