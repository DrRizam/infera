// ── Condition-reference matching ─────────────────────────────────────────
// Pure functions only, matching the rest of src/lib's convention. Decides
// whether a reference-doc entry (src/data/conditionReference.js) already
// has a real practice case behind it, for BodyMapExplorer.jsx.

// Words too generic to safely signal a match on their own — matching on
// just "syndrome," "tendinopathy," or "disease" alone would pair up
// completely unrelated conditions that happen to share a long clinical
// word (e.g. "common extensor tendinopathy" false-matching any other
// tendinopathy case). These can still count toward the two-shared-words
// rule below, just not trigger a match by themselves.
const GENERIC_WORDS = new Set([
  "syndrome", "disease", "disorder", "dysfunction", "management", "associated", "secondary",
  "tendinopathy", "instability", "impingement", "compression", "entrapment", "neuropathy", "arthropathy",
  "fracture", "anterior", "posterior", "displaced",
]);
// Words excluded entirely — temporal/severity modifiers ("acute," "chronic")
// and generic anatomical directions/regions ("proximal," "cervical") are
// common enough across totally unrelated conditions that even a pair of
// them (e.g. shared "proximal" + "fracture") shouldn't count as evidence.
const STOPWORDS = new Set([
  "with", "and", "the", "of", "in", "to", "a", "or", "non", "status", "post",
  "acute", "chronic", "grade", "type", "types", "primary", "early", "mild", "severe",
  "bilateral", "unilateral", "recurrent", "progressive", "common", "general", "generalized",
  "cervical", "lumbar", "thoracic", "proximal", "distal", "medial", "lateral",
]);

export function significantWords(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 5 && !STOPWORDS.has(w));
}

/**
 * Approximate, not exact: case diagnoses ("Subacromial impingement with
 * scapular dyskinesis") and reference-doc names ("Subacromial pain
 * syndrome / rotator cuff–related shoulder pain") rarely match word-for-word
 * even when clinically the same territory, so this matches on shared
 * significant vocabulary instead of exact/substring equality — one shared
 * distinctive word (8+ chars, not in GENERIC_WORDS) or two shorter shared
 * words. Good enough for "does a practice case for this exist yet," not a
 * precision-critical lookup.
 */
export function findMatchingCase(referenceName, cases) {
  const refWords = new Set(significantWords(referenceName));
  return (cases || []).find((c) => {
    const caseWords = significantWords(c.diagnosis);
    const shared = caseWords.filter((w) => refWords.has(w));
    const longShared = shared.filter((w) => w.length >= 8 && !GENERIC_WORDS.has(w));
    return longShared.length >= 1 || shared.length >= 2;
  });
}
