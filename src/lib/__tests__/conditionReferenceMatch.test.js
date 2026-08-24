import { describe, expect, it } from "vitest";
import { findMatchingCase, significantWords } from "../conditionReferenceMatch";

const CASES = [
  { id: "acl", diagnosis: "Complete ACL rupture with associated lateral meniscal tear" },
  { id: "tennis-elbow", diagnosis: "Lateral epicondylalgia (tennis elbow)" },
  { id: "femoral-neck", diagnosis: "Occult (non-displaced) femoral neck fracture" },
];

describe("significantWords", () => {
  it("drops short/stopword tokens and strips punctuation", () => {
    expect(significantWords("Grade I-II lateral ankle sprain (ATFL)")).toEqual(["ankle", "sprain"]);
  });

  it("returns an empty array for empty input", () => {
    expect(significantWords("")).toEqual([]);
    expect(significantWords(undefined)).toEqual([]);
  });
});

describe("findMatchingCase", () => {
  it("matches on a shared distinctive (8+ char) word", () => {
    expect(findMatchingCase("Anterior cruciate ligament sprain/tear (partial, complete, with rotatory instability)", CASES)?.id).toBe(
      "acl"
    );
  });

  it("matches on two shorter shared words even without a single long one", () => {
    expect(findMatchingCase("Hip fracture — femoral neck, intertrochanteric, subtrochanteric", CASES)?.id).toBe("femoral-neck");
  });

  it("does not match on a single generic long word like 'syndrome'", () => {
    const cases = [{ id: "x", diagnosis: "Patellofemoral pain syndrome" }];
    expect(findMatchingCase("Chronic pelvic pain syndrome", cases)).toBeUndefined();
  });

  it("does not match on shared temporal modifiers alone (acute/chronic)", () => {
    const cases = [{ id: "achilles", diagnosis: "Mid-portion Achilles tendinopathy (acute-on-chronic)" }];
    expect(findMatchingCase("Spondylolysis (pars defect) — acute vs chronic", cases)).toBeUndefined();
  });

  it("does not let a generic long word like 'tendinopathy' steal an unrelated case's match", () => {
    const cases = [
      { id: "achilles", diagnosis: "Mid-portion Achilles tendinopathy (acute-on-chronic)" },
      { id: "tennis-elbow", diagnosis: "Lateral epicondylalgia (tennis elbow)" },
    ];
    expect(findMatchingCase("Lateral epicondylalgia (tennis elbow) / common extensor tendinopathy", cases)?.id).toBe("tennis-elbow");
  });

  it("returns undefined when nothing shares enough vocabulary", () => {
    expect(findMatchingCase("Guillain-Barré syndrome and variants (AIDP, AMAN, Miller Fisher)", CASES)).toBeUndefined();
  });

  it("handles an empty case bank", () => {
    expect(findMatchingCase("Lateral epicondylalgia (tennis elbow) / common extensor tendinopathy", [])).toBeUndefined();
  });
});
