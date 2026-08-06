import { describe, expect, it } from "vitest";
import type { Profile } from "../../types";
import { cases } from "../../cases";
import { conditions } from "../../conditions";
import roadmap from "../../content/roadmap.json";
import { buildLearningPath, currentPathNode } from "../path";

function baseProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    profileVersion: 8,
    xp: 0,
    streak: 0,
    shields: 0,
    shieldProgress: 0,
    shieldedDates: [],
    flags: [],
    dailyGoal: 20,
    seenGradeHint: true,
    seenTour: true,
    experienceLevel: "clinician",
    conditionProgress: {},
    theme: "system",
    textSize: "normal",
    lastActiveDate: null,
    activityLog: [],
    srs: {},
    reviewItems: {},
    caseResults: [],
    sessionsCompleted: 0,
    onboarded: true,
    xpByDate: {},
    achievements: [],
    topicAgg: {},
    speedBest: 0,
    currentPath: "Shoulder pain",
    ...overrides,
  };
}

describe("buildLearningPath", () => {
  it("orders cases before conditions, both before the planned roadmap", () => {
    const nodes = buildLearningPath(baseProfile());
    const kinds = nodes.map((n) => n.kind);
    const lastRealIdx = kinds.lastIndexOf("case") > kinds.lastIndexOf("condition")
      ? kinds.lastIndexOf("case")
      : kinds.lastIndexOf("condition");
    expect(kinds.slice(0, cases.length)).toEqual(cases.map(() => "case"));
    expect(kinds.slice(cases.length, cases.length + conditions.length)).toEqual(
      conditions.map(() => "condition")
    );
    expect(kinds.slice(lastRealIdx + 1)).toEqual(roadmap.map(() => "planned"));
  });

  it("marks the first real node current and everything after it locked, on a fresh profile", () => {
    const nodes = buildLearningPath(baseProfile());
    const real = nodes.filter((n) => n.kind !== "planned");
    expect(real[0].status).toBe("current");
    expect(real.slice(1).every((n) => n.status === "locked")).toBe(true);
  });

  it("flips a completed case's node to completed and advances current to the next node", () => {
    const [firstCase] = cases;
    const profile = baseProfile({
      caseResults: [{ caseId: firstCase.id, completedAt: "2026-08-01T00:00:00.000Z", scores: { reasoning: 80, redFlag: 100, evidence: 70 }, xp: 40 }],
    });
    const nodes = buildLearningPath(profile);
    const caseNode = nodes.find((n) => n.id === firstCase.id)!;
    expect(caseNode.status).toBe("completed");

    const real = nodes.filter((n) => n.kind !== "planned");
    const currentIdx = real.findIndex((n) => n.status === "current");
    // Everything before "current" is completed, everything after is locked.
    expect(real.slice(0, currentIdx).every((n) => n.status === "completed")).toBe(true);
    expect(real.slice(currentIdx + 1).every((n) => n.status === "locked")).toBe(true);
  });

  it("keeps roadmap entries locked with their honest note as sub, regardless of profile state", () => {
    const nodes = buildLearningPath(baseProfile());
    const planned = nodes.filter((n) => n.kind === "planned");
    expect(planned).toHaveLength(roadmap.length);
    for (const p of planned) {
      expect(p.status).toBe("locked");
      const source = (roadmap as { id: string; note: string }[]).find((m) => m.id === p.id)!;
      expect(p.sub).toBe(source.note);
    }
  });
});

describe("currentPathNode", () => {
  it("returns undefined once every real node is completed", () => {
    const profile = baseProfile({
      caseResults: cases.map((c) => ({
        caseId: c.id,
        completedAt: "2026-08-01T00:00:00.000Z",
        scores: { reasoning: 80, redFlag: 100, evidence: 70 },
        xp: 40,
      })),
      conditionProgress: Object.fromEntries(
        conditions.map((c) => [
          c.id,
          { conditionId: c.id, step: 0, answered: [], knowledgeScore: 100, completedOn: "2026-08-01", deepDiveOpened: false },
        ])
      ),
    });
    expect(currentPathNode(profile)).toBeUndefined();
  });
});
