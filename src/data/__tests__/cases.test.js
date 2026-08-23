import { describe, expect, it } from "vitest";
import { CASES } from "../cases";

// Content-governance guard: a case can only claim "source-checked" credibility
// if it actually carries a citation, and "verified" must never be set from
// code at all (see the comment above STATUS_BADGE in CaseDebrief.jsx — only a
// real clinician sign-off earns that tier). This turns the previously
// informal "cases should have references" expectation into something the
// test suite actually enforces at authoring time, not just something present
// on some cases by convention.
describe("case content governance", () => {
  it("every case has at least one reference", () => {
    for (const c of CASES) {
      expect(c.references?.length, `${c.id} has no references`).toBeGreaterThan(0);
    }
  });

  it("every reference is a non-empty string", () => {
    for (const c of CASES) {
      for (const ref of c.references || []) {
        expect(typeof ref, `${c.id} has a non-string reference`).toBe("string");
        expect(ref.trim().length, `${c.id} has an empty reference`).toBeGreaterThan(0);
      }
    }
  });

  it("uses only the recognized content_status tiers", () => {
    const validTiers = ["demonstration", "source-checked", "verified"];
    for (const c of CASES) {
      expect(validTiers, `${c.id} has an unrecognized content_status: ${c.content_status}`).toContain(c.content_status);
    }
  });

  it("never marks a case 'verified' from code — that tier requires a real clinician sign-off", () => {
    const verifiedFromCode = CASES.filter((c) => c.content_status === "verified");
    expect(verifiedFromCode.map((c) => c.id)).toEqual([]);
  });
});
