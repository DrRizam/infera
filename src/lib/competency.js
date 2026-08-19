// ── Competency map ───────────────────────────────────────────────────────
// Buckets skill signal by module x skill-type (e.g. "sports:red_flag"), fed
// by both full case encounters (via their per-dimension breakdown) and
// recall-drill items (via their type) — a shared, coarser taxonomy than
// per-case `subject`, since "how good are you at red-flag screening in
// Sports Physio" is an answerable, trackable question and "how good are you
// at The Sprinter's Snap" is not.

import { getModule } from "@/lib/modules";

/** scoreEncounter()'s breakdown keys -> the shared bucket-type vocabulary. */
export const BREAKDOWN_TO_BUCKET_TYPE = {
  history: "history",
  redFlags: "red_flag",
  differential: "differential",
  examinations: "exam",
  disposition: "disposition",
};

const TYPE_LABELS = {
  history: "History-taking",
  red_flag: "Red-flag screening",
  differential: "Differential reasoning",
  exam: "Examination selection",
  disposition: "Disposition & escalation",
};

export function bucketKey(moduleId, bucketType) {
  return `${moduleId}:${bucketType}`;
}

/** Turns a bucket key back into a readable label for the UI. */
export function describeCompetencyBucket(key) {
  const [moduleId, bucketType] = key.split(":");
  const moduleName = getModule(moduleId)?.name || moduleId;
  const typeLabel = TYPE_LABELS[bucketType] || bucketType;
  return { moduleId, bucketType, label: `${moduleName} · ${typeLabel}` };
}
