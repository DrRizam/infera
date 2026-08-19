import { describe, expect, it } from "vitest";
import { suggestModuleFocus } from "../contextPrompt";

const cases = [
  { id: "sports-1", module: "sports" },
  { id: "sports-2", module: "sports" },
  { id: "msk-1", module: "msk" },
];

describe("suggestModuleFocus", () => {
  it("suggests the module with the most recent activity once it clears the threshold", () => {
    const profile = {
      caseProgress: {
        "sports-1": { last_played_date: "2026-08-08T10:00:00.000Z" },
        "sports-2": { last_played_date: "2026-08-09T10:00:00.000Z" },
      },
      itemProgress: {
        item1: { module: "sports", last_played_date: "2026-08-10T10:00:00.000Z" },
      },
    };
    const result = suggestModuleFocus(profile, cases, { today: "2026-08-10", windowDays: 3, minActivity: 3 });
    expect(result).toEqual({ moduleId: "sports", count: 3 });
  });

  it("returns null when nothing clears the activity threshold", () => {
    const profile = {
      caseProgress: { "sports-1": { last_played_date: "2026-08-10T10:00:00.000Z" } },
      itemProgress: {},
    };
    const result = suggestModuleFocus(profile, cases, { today: "2026-08-10", windowDays: 3, minActivity: 3 });
    expect(result).toBeNull();
  });

  it("ignores activity outside the recency window", () => {
    const profile = {
      caseProgress: {
        "sports-1": { last_played_date: "2026-07-01T10:00:00.000Z" },
        "sports-2": { last_played_date: "2026-07-01T10:00:00.000Z" },
      },
      itemProgress: { item1: { module: "sports", last_played_date: "2026-07-01T10:00:00.000Z" } },
    };
    const result = suggestModuleFocus(profile, cases, { today: "2026-08-10", windowDays: 3, minActivity: 3 });
    expect(result).toBeNull();
  });

  it("handles an empty profile without throwing", () => {
    expect(suggestModuleFocus({}, cases, { today: "2026-08-10" })).toBeNull();
  });
});
