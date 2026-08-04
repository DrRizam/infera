import { describe, expect, it } from "vitest";
import { clinicalCase, validateCaseIntegrity, type ClinicalCase } from "../../../cases/schema";
import kneeCase from "../../../cases/data/knee-anterior-runner.json";
import {
  canAdvance,
  createEncounter,
  distributeConfidence,
  isConfidenceValid,
  nextStage,
  stageIndex,
  type EncounterState,
} from "../encounter";
import { scoreEncounter } from "../scoring";
import { generateFeedback } from "../feedback";
import { dueCards, generateReviewCards, isMastered, reviewCard } from "../reviewCards";
import { applyLikelihoodRatio, derivedLikelihoodRatios, normalise, toOdds } from "../probability";
import { Good } from "../../fsrs";

const c: ClinicalCase = clinicalCase.parse(kneeCase);

/** An encounter that does everything right. */
function idealEncounter(): EncounterState {
  const s = createEncounter(c.id);
  s.askedQuestionIds = c.subjectiveQuestions
    .filter((q) => q.relevance === "essential")
    .map((q) => q.id);
  s.flaggedRedFlagIds = c.redFlags.filter((f) => f.present).map((f) => f.id);
  s.initialDifferential = [
    { differentialId: "pfp", confidence: 50 },
    { differentialId: "bone-stress", confidence: 30 },
    { differentialId: "patellar-tendinopathy", confidence: 20 },
  ];
  s.performedExaminationIds = c.examinations.filter((e) => e.appropriate).map((e) => e.id);
  s.updatedDifferential = [
    { differentialId: "bone-stress", confidence: 65 },
    { differentialId: "pfp", confidence: 30 },
    { differentialId: "patellar-tendinopathy", confidence: 5 },
  ];
  s.finalDiagnosisId = c.finalDiagnosisId;
  s.finalConfidence = 70;
  s.disposition = c.correctDisposition;
  s.managementIds = c.managementOptions.filter((m) => m.appropriate).map((m) => m.id);
  return s;
}

/** An encounter that misses the dangerous diagnosis entirely. */
function unsafeEncounter(): EncounterState {
  const s = createEncounter(c.id);
  s.askedQuestionIds = ["q-location", "q-aggravating"];
  s.flaggedRedFlagIds = [];
  s.initialDifferential = [
    { differentialId: "pfp", confidence: 70 },
    { differentialId: "patellar-tendinopathy", confidence: 20 },
    { differentialId: "meniscal", confidence: 10 },
  ];
  s.performedExaminationIds = ["ex-mcmurray", "ex-lachman", "ex-patellar-grind"];
  s.updatedDifferential = [...s.initialDifferential];
  s.finalDiagnosisId = "pfp";
  s.finalConfidence = 85;
  s.disposition = "treat";
  s.managementIds = ["m-quads-loading", "m-continue-training"];
  return s;
}

describe("case schema", () => {
  it("parses the sample case and passes integrity checks", () => {
    expect(validateCaseIntegrity(c)).toEqual([]);
  });

  it("does not leak the diagnosis in learner-facing framing", () => {
    const dxLabel = c.differentials.find((d) => d.id === c.finalDiagnosisId)!.label.toLowerCase();
    const facing = `${c.title} ${c.presentingComplaint} ${c.patient.opening}`.toLowerCase();
    expect(facing).not.toContain(dxLabel);
    expect(facing).not.toContain("bone stress");
  });

  it("rejects a case whose finalDiagnosisId is not a differential", () => {
    const broken = { ...c, finalDiagnosisId: "not-a-real-id" };
    expect(validateCaseIntegrity(broken)).toContain(
      'finalDiagnosisId "not-a-real-id" is not one of the differentials'
    );
  });
});

describe("confidence handling", () => {
  it("distributes exactly 100% across any number of entries", () => {
    for (const n of [1, 3, 5, 7]) {
      const ids = Array.from({ length: n }, (_, i) => `d${i}`);
      const dist = distributeConfidence(ids);
      expect(dist.reduce((a, d) => a + d.confidence, 0)).toBe(100);
      expect(isConfidenceValid(dist)).toBe(true);
    }
  });

  it("ranks earlier entries higher", () => {
    const dist = distributeConfidence(["a", "b", "c"]);
    expect(dist[0].confidence).toBeGreaterThan(dist[1].confidence);
    expect(dist[1].confidence).toBeGreaterThan(dist[2].confidence);
  });

  it("rejects lists that do not total 100", () => {
    expect(isConfidenceValid([{ differentialId: "a", confidence: 90 }])).toBe(false);
    expect(isConfidenceValid([])).toBe(false);
  });
});

describe("stage progression", () => {
  it("advances through every stage in order", () => {
    let stage = createEncounter(c.id).stage;
    const seen = [stage];
    while (stage !== "feedback") {
      stage = nextStage(stage);
      seen.push(stage);
    }
    expect(seen[0]).toBe("presentation");
    expect(seen).toContain("disposition");
    expect(seen.at(-1)).toBe("feedback");
    expect(stageIndex("diagnosis")).toBeGreaterThan(stageIndex("examination"));
  });

  it("blocks advancing from the differential stage without 3 ranked diagnoses summing to 100", () => {
    const s = createEncounter(c.id);
    s.stage = "differential-initial";
    expect(canAdvance(s, c)).toBe(false);

    s.initialDifferential = [
      { differentialId: "pfp", confidence: 50 },
      { differentialId: "bone-stress", confidence: 30 },
    ];
    expect(canAdvance(s, c)).toBe(false); // only two

    s.initialDifferential.push({ differentialId: "meniscal", confidence: 10 });
    expect(canAdvance(s, c)).toBe(false); // totals 90

    s.initialDifferential[2].confidence = 20;
    expect(canAdvance(s, c)).toBe(true);
  });

  it("requires a disposition before leaving the disposition stage", () => {
    const s = createEncounter(c.id);
    s.stage = "disposition";
    expect(canAdvance(s, c)).toBe(false);
    s.disposition = "investigate";
    expect(canAdvance(s, c)).toBe(true);
  });
});

describe("probability updates", () => {
  it("converts percentages to odds correctly", () => {
    expect(toOdds(50)).toBeCloseTo(1, 5);
    expect(toOdds(75)).toBeCloseTo(3, 5);
  });

  it("applies a likelihood ratio via odds", () => {
    // 50% prior, LR+ 10 -> odds 1 x 10 = 10 -> 10/11 = 90.9%
    expect(applyLikelihoodRatio(50, 10)).toBeCloseTo(90.909, 2);
    // A likelihood ratio of 1 must not move the probability at all.
    expect(applyLikelihoodRatio(37, 1)).toBeCloseTo(37, 5);
  });

  it("lowers probability for likelihood ratios below 1", () => {
    expect(applyLikelihoodRatio(60, 0.2)).toBeLessThan(60);
  });

  it("derives likelihood ratios from sensitivity and specificity", () => {
    const { lrPositive, lrNegative } = derivedLikelihoodRatios({
      sensitivity: 85,
      specificity: 94,
      lrPositive: null,
      lrNegative: null,
      status: "published",
      source: "test",
    });
    expect(lrPositive).toBeCloseTo(14.17, 1);
    expect(lrNegative).toBeCloseTo(0.16, 2);
  });

  it("normalises a set of probabilities to total 100", () => {
    const out = normalise({ a: 60, b: 60, c: 30 });
    expect(Object.values(out).reduce((x, y) => x + y, 0)).toBeCloseTo(100, 5);
    expect(out.a).toBeCloseTo(40, 5);
  });
});

describe("scoring", () => {
  it("scores a well-run encounter highly and flags no safety breach", () => {
    const score = scoreEncounter(c, idealEncounter());
    expect(score.safetyBreach).toBe(false);
    expect(score.overall).toBeGreaterThan(75);
    expect(score.dimensions.diagnosis.score).toBe(100);
    expect(score.dimensions.redFlags.score).toBe(100);
  });

  it("records a safety breach when a present red flag is missed", () => {
    const score = scoreEncounter(c, unsafeEncounter());
    expect(score.safetyBreach).toBe(true);
    expect(score.dimensions.safety.score).toBeLessThan(50);
  });

  it("penalises omitting a must-not-miss diagnosis", () => {
    const score = scoreEncounter(c, unsafeEncounter());
    const omission = score.dimensions.differential.events.find((e) =>
      e.label.startsWith("Never considered")
    );
    expect(omission).toBeDefined();
  });

  it("penalises examinations that could not change management", () => {
    const score = scoreEncounter(c, unsafeEncounter());
    const lowValue = score.dimensions.examinationSelection.events.filter((e) =>
      e.label.startsWith("Low-value test")
    );
    expect(lowValue.length).toBeGreaterThanOrEqual(2);
  });

  it("weights safety heavily enough that a breach drags the overall down", () => {
    const good = scoreEncounter(c, idealEncounter()).overall;
    const bad = scoreEncounter(c, unsafeEncounter()).overall;
    expect(good - bad).toBeGreaterThan(30);
  });

  it("punishes confident errors more than uncertain ones in calibration", () => {
    const confidentWrong = unsafeEncounter();
    const hedgedWrong = { ...unsafeEncounter(), finalConfidence: 30 };
    const a = scoreEncounter(c, confidentWrong).dimensions.calibration.score!;
    const b = scoreEncounter(c, hedgedWrong).dimensions.calibration.score!;
    expect(b).toBeGreaterThan(a);
  });

  it("leaves dimensions null when the encounter never exercised them", () => {
    const s = createEncounter(c.id);
    const score = scoreEncounter(c, s);
    expect(score.dimensions.diagnosis.score).toBeNull();
    expect(score.dimensions.management.score).toBeNull();
  });
});

describe("feedback", () => {
  it("leads with the missed red flag when safety failed", () => {
    const s = unsafeEncounter();
    const fb = generateFeedback(c, s, scoreEncounter(c, s));
    expect(fb[0].severity).toBe("critical");
    expect(fb.some((f) => f.condition === "missed-red-flag")).toBe(true);
  });

  it("detects an unchanged differential after examination", () => {
    const s = unsafeEncounter();
    const fb = generateFeedback(c, s, scoreEncounter(c, s));
    expect(fb.some((f) => f.condition === "ignored-findings")).toBe(true);
  });

  it("flags overconfidence when confident and wrong", () => {
    const s = unsafeEncounter();
    const fb = generateFeedback(c, s, scoreEncounter(c, s));
    expect(fb.some((f) => f.condition === "overconfident")).toBe(true);
  });

  it("praises an appropriate revision", () => {
    const s = idealEncounter();
    const fb = generateFeedback(c, s, scoreEncounter(c, s));
    expect(fb.some((f) => f.condition === "good-revision")).toBe(true);
  });

  it("does not raise safety feedback for a clean encounter", () => {
    const fb = generateFeedback(c, idealEncounter(), scoreEncounter(c, idealEncounter()));
    expect(fb.some((f) => f.condition === "missed-red-flag")).toBe(false);
    expect(fb.some((f) => f.condition === "unsafe-disposition")).toBe(false);
  });
});

describe("review cards", () => {
  it("generates cards from the learner's actual errors", () => {
    const s = unsafeEncounter();
    const cards = generateReviewCards(c, s, scoreEncounter(c, s), "2026-08-04");
    const kinds = cards.map((k) => k.kind);
    expect(kinds).toContain("missed-red-flag");
    expect(kinds).toContain("wrong-diagnosis");
    expect(kinds).toContain("differential-omission");
    expect(kinds).toContain("disposition");
  });

  it("generates no cards from a clean encounter", () => {
    const s = idealEncounter();
    const cards = generateReviewCards(c, s, scoreEncounter(c, s), "2026-08-04");
    expect(cards).toHaveLength(0);
  });

  it("schedules critical cards sooner than moderate ones", () => {
    const s = unsafeEncounter();
    const cards = generateReviewCards(c, s, scoreEncounter(c, s), "2026-08-04");
    const critical = cards.find((k) => k.severity === "critical")!;
    const moderate = cards.find((k) => k.severity === "moderate")!;
    expect(critical.dueDate <= moderate.dueDate).toBe(true);
  });

  it("orders the due queue by severity", () => {
    const s = unsafeEncounter();
    const cards = generateReviewCards(c, s, scoreEncounter(c, s), "2026-08-04");
    // Far-future date so every card is due.
    const queue = dueCards(cards, "2027-01-01");
    const severities = queue.map((k) => k.severity);
    expect(severities[0]).toBe("critical");
    expect(severities).toEqual([...severities].sort((a, b) =>
      ({ critical: 0, high: 1, moderate: 2 })[a] - ({ critical: 0, high: 1, moderate: 2 })[b]
    ));
  });

  it("holds critical cards to a higher mastery bar", () => {
    const s = unsafeEncounter();
    const [card] = generateReviewCards(c, s, scoreEncounter(c, s), "2026-08-04");
    const critical = { ...card, severity: "critical" as const, reps: 3, stability: 40 };
    const moderate = { ...card, severity: "moderate" as const, reps: 3, stability: 40 };
    expect(isMastered(critical)).toBe(false);
    expect(isMastered(moderate)).toBe(true);
  });

  it("reschedules a card further out after a successful review", () => {
    const s = unsafeEncounter();
    const [card] = generateReviewCards(c, s, scoreEncounter(c, s), "2026-08-04");
    const after = reviewCard(card, Good, "2026-08-05");
    expect(after.stability).toBeGreaterThan(card.stability);
    expect(after.dueDate > card.dueDate).toBe(true);
    expect(after.reps).toBe(card.reps + 1);
  });
});

describe("primary user journey", () => {
  it("runs presentation through feedback and produces score, feedback and review items", () => {
    let s = createEncounter(c.id);

    expect(canAdvance(s, c)).toBe(true);
    s = { ...s, stage: nextStage(s.stage) };
    expect(s.stage).toBe("subjective");

    s.askedQuestionIds = c.subjectiveQuestions
      .filter((q) => q.relevance === "essential")
      .map((q) => q.id)
      .slice(0, c.subjectiveBudget);
    expect(canAdvance(s, c)).toBe(true);

    s = { ...s, stage: "red-flags" };
    s.flaggedRedFlagIds = ["rf-progressive-load-pain", "rf-amenorrhoea"];

    s = { ...s, stage: "differential-initial" };
    s.initialDifferential = distributeConfidence(["pfp", "bone-stress", "meniscal"]);
    expect(canAdvance(s, c)).toBe(true);

    s = { ...s, stage: "examination" };
    s.performedExaminationIds = ["ex-observation", "ex-palpation-bone", "ex-hop-test"];
    expect(canAdvance(s, c)).toBe(true);

    s = { ...s, stage: "differential-updated" };
    s.updatedDifferential = distributeConfidence(["bone-stress", "pfp", "meniscal"]);
    expect(canAdvance(s, c)).toBe(true);

    s = { ...s, stage: "diagnosis" };
    s.finalDiagnosisId = "bone-stress";
    s.finalConfidence = 65;

    s = { ...s, stage: "disposition" };
    s.disposition = "investigate";

    s = { ...s, stage: "management" };
    s.managementIds = ["m-stop-running", "m-imaging", "m-med-review"];
    expect(canAdvance(s, c)).toBe(true);

    const score = scoreEncounter(c, s);
    const feedback = generateFeedback(c, s, score);
    const cards = generateReviewCards(c, s, score, "2026-08-04");

    expect(score.overall).toBeGreaterThan(60);
    expect(score.safetyBreach).toBe(false);
    expect(feedback.length).toBeGreaterThan(0);
    // Skipped essential questions should still generate study material.
    expect(cards.every((k) => k.prompt.length > 0)).toBe(true);
  });
});
