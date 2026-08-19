import { describe, expect, it } from "vitest";
import { BREAKDOWN_TO_BUCKET_TYPE, bucketKey, describeCompetencyBucket } from "../competency";

describe("bucketKey", () => {
  it("joins module and bucket type", () => {
    expect(bucketKey("sports", "red_flag")).toBe("sports:red_flag");
  });
});

describe("describeCompetencyBucket", () => {
  it("resolves a known module into a readable label", () => {
    const { moduleId, bucketType, label } = describeCompetencyBucket("sports:red_flag");
    expect(moduleId).toBe("sports");
    expect(bucketType).toBe("red_flag");
    expect(label).toBe("Sports Physio · Red-flag screening");
  });

  it("falls back to the raw id for an unknown module", () => {
    const { label } = describeCompetencyBucket("made-up-module:exam");
    expect(label).toBe("made-up-module · Examination selection");
  });
});

describe("BREAKDOWN_TO_BUCKET_TYPE", () => {
  it("covers every scoreEncounter breakdown dimension", () => {
    expect(Object.keys(BREAKDOWN_TO_BUCKET_TYPE).sort()).toEqual(
      ["differential", "disposition", "examinations", "history", "redFlags"].sort()
    );
  });
});
