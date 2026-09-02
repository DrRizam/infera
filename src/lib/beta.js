// ── Beta / disclaimer copy ───────────────────────────────────────────────
// Single source of truth for the closed-beta framing and the educational
// disclaimer, so the wording stays identical everywhere it appears.

export const IS_BETA = true;

export const DISCLAIMER_SHORT =
  "Infera is an educational study aid, not a diagnostic tool. Every case is a fictional teaching scenario.";

export const DISCLAIMER_LONG =
  "Infera is a clinical-reasoning study aid for physical therapy learners — not a diagnostic tool and not medical advice. " +
  "Cases are fictional teaching scenarios. Content is source-checked against references but has not been signed off by a clinician, " +
  "so treat it as practice, not as a source of truth for a real patient.";

export const BETA_NOTICE =
  "You're testing a closed beta. Things may change, break, or look unfinished — that's expected. " +
  "Please send anything that feels off through the Feedback box on your Profile.";

// Features kept out of the closed beta: their routes redirect to Home and
// every in-app entry point is hidden. They come back by dropping the key
// here (or flipping IS_BETA off) — nothing else references the list.
export const BETA_HIDDEN_FEATURES = new Set(["recall", "anatomy", "osce", "groups", "submit-case"]);

/** True when `key` is a feature deliberately hidden for the closed beta. */
export function isBetaHidden(key) {
  return IS_BETA && BETA_HIDDEN_FEATURES.has(key);
}
