import { describe, expect, it } from "vitest";
import { buildCaseAttemptRow } from "../caseAttempts";

const scored = {
  accuracy: 87.4,
  breakdown: { history: 100, redFlags: 75, differential: 90, examinations: 80, disposition: 100 },
  errors: [{ kind: "missed_red_flag", label: "Night pain", detail: "" }],
  missedRedFlags: ["night-pain"],
  falsePositiveRedFlags: [],
};

const clinicalCase = { id: "knee-runners-persistent", module: "sports", subject: "Tibial bone-stress injury" };

describe("buildCaseAttemptRow", () => {
  it("maps scoreEncounter output onto case_attempts columns", () => {
    const row = buildCaseAttemptRow(scored, clinicalCase, 55, 2, false);

    expect(row).toEqual({
      case_id: "knee-runners-persistent",
      case_module: "sports",
      case_subject: "Tibial bone-stress injury",
      is_daily: false,
      accuracy: 87,
      breakdown: scored.breakdown,
      errors: scored.errors,
      missed_red_flags: scored.missedRedFlags,
      false_positive_red_flags: scored.falsePositiveRedFlags,
      xp_earned: 55,
      attempt_number: 2,
    });
  });

  it("rounds accuracy and coerces isDaily to a boolean", () => {
    const row = buildCaseAttemptRow(scored, clinicalCase, 10, 1, 1);
    expect(row.accuracy).toBe(87);
    expect(row.is_daily).toBe(true);
  });

  it("falls back to null subject when the case has none", () => {
    const row = buildCaseAttemptRow(scored, { id: "x", module: "msk" }, 10, 1, false);
    expect(row.case_subject).toBeNull();
  });
});
