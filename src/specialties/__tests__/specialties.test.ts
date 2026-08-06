import { describe, expect, it } from "vitest";
import {
  SPECIALTIES,
  casesFor,
  conditionsFor,
  dailyHardCase,
  getSpecialty,
  specialtyStatus,
} from "../index";
import { sampleLeaderboard } from "../../engine/leaderboard";

describe("specialtyStatus", () => {
  it("is ready only for specialties with at least one ready nested module", () => {
    const msk = getSpecialty("msk-ortho")!;
    expect(specialtyStatus(msk)).toBe("ready");

    for (const s of SPECIALTIES.filter((s) => s.id !== "msk-ortho")) {
      expect(specialtyStatus(s)).toBe("development");
    }
  });

  it("has an entry for every requested specialty", () => {
    const ids = SPECIALTIES.map((s) => s.id);
    expect(ids).toEqual([
      "msk-ortho",
      "sports-physio",
      "pediatrics",
      "neuro",
      "cardiovascular",
      "geriatrics",
      "pelvic-floor",
      "oncology",
      "vestibular",
    ]);
  });
});

describe("casesFor / conditionsFor", () => {
  it("matches the real knee case and condition to msk-ortho, and nothing to unrelated specialties", () => {
    const msk = getSpecialty("msk-ortho")!;
    const vestibular = getSpecialty("vestibular")!;

    expect(casesFor(msk).length).toBeGreaterThan(0);
    expect(casesFor(msk).every((c) => c.bodyRegion === "Knee")).toBe(true);
    expect(casesFor(vestibular)).toEqual([]);

    expect(conditionsFor(msk).length).toBeGreaterThan(0);
    expect(conditionsFor(vestibular)).toEqual([]);
  });
});

describe("dailyHardCase", () => {
  it("is undefined for a specialty with no scoped cases", () => {
    expect(dailyHardCase(getSpecialty("neuro")!)).toBeUndefined();
  });

  it("picks the hardest available case and is stable within a day", () => {
    const msk = getSpecialty("msk-ortho")!;
    const a = dailyHardCase(msk, "2026-08-06");
    const b = dailyHardCase(msk, "2026-08-06");
    expect(a).toBeDefined();
    expect(a!.id).toBe(b!.id);

    const pool = casesFor(msk);
    const maxDifficulty = Math.max(...pool.map((c) => c.difficulty));
    expect(a!.difficulty).toBe(maxDifficulty);
  });
});

describe("sampleLeaderboard", () => {
  it("is deterministic per specialty id", () => {
    const a = sampleLeaderboard("msk-ortho");
    const b = sampleLeaderboard("msk-ortho");
    expect(a).toEqual(b);
  });

  it("differs between specialties and stays sorted descending", () => {
    const msk = sampleLeaderboard("msk-ortho");
    const neuro = sampleLeaderboard("neuro");
    expect(msk).not.toEqual(neuro);
    for (let i = 1; i < msk.length; i++) {
      expect(msk[i - 1].score).toBeGreaterThanOrEqual(msk[i].score);
    }
  });
});
