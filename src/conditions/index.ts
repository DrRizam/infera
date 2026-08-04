// ── Condition loader ───────────────────────────────────────────────────────
// Same pattern as drill banks and cases: drop a JSON file into data/ and it
// appears. Validation failures throw at startup rather than mid-lesson.

import { condition, validateConditionIntegrity, type Condition } from "./schema";

const modules = import.meta.glob("./data/*.json", { eager: true }) as Record<
  string,
  { default: unknown }
>;

const loaded: Condition[] = [];

for (const [path, mod] of Object.entries(modules)) {
  const parsed = condition.safeParse(mod.default);
  if (!parsed.success) {
    throw new Error(
      `Invalid condition ${path}:\n${parsed.error.issues
        .map((i) => `  ${i.path.join(".")}: ${i.message}`)
        .join("\n")}`
    );
  }
  const problems = validateConditionIntegrity(parsed.data);
  if (problems.length) {
    throw new Error(`Condition ${path} failed integrity checks:\n  ${problems.join("\n  ")}`);
  }
  loaded.push(parsed.data);
}

export const conditions: Condition[] = loaded.sort((a, b) => a.name.localeCompare(b.name));

export function getCondition(id: string): Condition | undefined {
  return conditions.find((c) => c.id === id);
}

/** Conditions grouped by the complaint a patient arrives with. */
export function conditionsByComplaint(): { complaint: string; conditions: Condition[] }[] {
  const map = new Map<string, Condition[]>();
  for (const c of conditions) {
    for (const complaint of c.presentingComplaints) {
      map.set(complaint, [...(map.get(complaint) ?? []), c]);
    }
  }
  return [...map.entries()]
    .map(([complaint, list]) => ({ complaint, conditions: list }))
    .sort((a, b) => a.complaint.localeCompare(b.complaint));
}
