import { describe, expect, it } from "vitest";
import { referenceEntriesForRegion, regionsForSection } from "../conditionReferenceRegions";

describe("regionsForSection", () => {
  it("maps a musculoskeletal section to its region", () => {
    expect(regionsForSection("Knee")).toEqual(["knee"]);
  });

  it("maps some sections to more than one region", () => {
    expect(regionsForSection("Lower Leg, Ankle & Foot")).toEqual(["lower_leg", "ankle_foot"]);
  });

  it("leaves systemic/non-regional sections unmapped", () => {
    expect(regionsForSection("PART XII — ENDOCRINE, METABOLIC & OTHER MEDICAL COMORBIDITIES")).toEqual([]);
    expect(regionsForSection("Pain & Central Sensitization Syndromes")).toEqual([]);
  });

  it("returns an empty array for an unknown section", () => {
    expect(regionsForSection("Not A Real Section")).toEqual([]);
  });
});

describe("referenceEntriesForRegion", () => {
  const entries = [
    { section: "Knee", name: "Patellofemoral pain syndrome" },
    { section: "Elbow", name: "Lateral epicondylalgia" },
    { section: "Cervical Spine", name: "Cervical radiculopathy" },
    { section: "PART X — PEDIATRICS", name: "Cerebral palsy" },
  ];

  it("returns only entries whose section maps to the given region", () => {
    expect(referenceEntriesForRegion("knee", entries)).toEqual([entries[0]]);
    expect(referenceEntriesForRegion("upper_limb", entries)).toEqual([entries[1]]);
    expect(referenceEntriesForRegion("neck", entries)).toEqual([entries[2]]);
  });

  it("returns nothing for a region with no mapped entries", () => {
    expect(referenceEntriesForRegion("abdomen", entries)).toEqual([]);
  });
});
