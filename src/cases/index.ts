// ── Case loader ────────────────────────────────────────────────────────────
// Same pattern as the drill banks: drop a JSON file into data/ and it appears.
// Cases are indexed by presenting complaint rather than by diagnosis, because
// that is how a patient arrives and how the learner should be practising.

import { clinicalCase, validateCaseIntegrity, type ClinicalCase } from "./schema";

const modules = import.meta.glob("./data/*.json", { eager: true }) as Record<
  string,
  { default: unknown }
>;

const loaded: ClinicalCase[] = [];

for (const [path, mod] of Object.entries(modules)) {
  const parsed = clinicalCase.safeParse(mod.default);
  if (!parsed.success) {
    throw new Error(
      `Invalid case ${path}:\n${parsed.error.issues
        .map((i) => `  ${i.path.join(".")}: ${i.message}`)
        .join("\n")}`
    );
  }
  const integrity = validateCaseIntegrity(parsed.data);
  if (integrity.length) {
    throw new Error(`Case ${path} failed integrity checks:\n  ${integrity.join("\n  ")}`);
  }
  loaded.push(parsed.data);
}

export const cases: ClinicalCase[] = loaded.sort((a, b) => a.id.localeCompare(b.id));

export function getCase(id: string): ClinicalCase | undefined {
  return cases.find((c) => c.id === id);
}

export interface ComplaintPathway {
  bodyRegion: string;
  presentingComplaint: string;
  cases: ClinicalCase[];
}

/**
 * Cases grouped by region → presenting complaint. This is the shape the
 * learning experience is browsed in: "Knee › Anterior knee pain", never
 * "Patellofemoral pain".
 */
export function pathways(): ComplaintPathway[] {
  const map = new Map<string, ComplaintPathway>();
  for (const c of cases) {
    const key = `${c.bodyRegion}::${c.presentingComplaint}`;
    const existing = map.get(key);
    if (existing) existing.cases.push(c);
    else
      map.set(key, {
        bodyRegion: c.bodyRegion,
        presentingComplaint: c.presentingComplaint,
        cases: [c],
      });
  }
  return [...map.values()].sort(
    (a, b) =>
      a.bodyRegion.localeCompare(b.bodyRegion) ||
      a.presentingComplaint.localeCompare(b.presentingComplaint)
  );
}

/** Conditions that can appear under a complaint — the pathway's teaching span. */
export function conditionsUnder(complaint: string): string[] {
  const labels = new Set<string>();
  for (const c of cases.filter((c) => c.presentingComplaint === complaint)) {
    for (const d of c.differentials) {
      if (d.status !== "implausible") labels.add(d.label);
    }
  }
  return [...labels].sort();
}
