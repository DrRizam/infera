// ── Condition-annotation lookups ─────────────────────────────────────────
// Pure functions, matching the rest of src/lib's convention. Names in
// src/data/conditionAnnotations.js match src/data/conditionReference.js
// (the flat taxonomy) exactly, word for word — see
// scripts/build-condition-annotations.mjs — so an exact match is enough,
// no fuzzy matching needed here (unlike conditionReferenceMatch.js, which
// matches reference names against case diagnoses that are worded freely).

const normalizeName = (s) => (s || "").replace(/\s+/g, " ").trim();

export function findAnnotation(name, annotations) {
  const target = normalizeName(name);
  return (annotations || []).find((a) => normalizeName(a.name) === target);
}

export function getAnnotationBySlug(slug, annotations) {
  return (annotations || []).find((a) => a.slug === slug);
}
