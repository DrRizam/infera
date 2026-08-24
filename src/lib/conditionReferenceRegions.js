// ── Condition-reference → body-region mapping ────────────────────────────
// Maps each section heading in the reference doc (src/data/conditionReference.js)
// to the BODY_REGIONS id(s) it belongs on the Explore body map. Many
// sections are deliberately unmapped (null) — systemic/non-regional
// content (endocrine, oncology, pediatrics, red flags, movement-system
// labels, generalized pain syndromes) doesn't belong under any one hotspot
// and would mislead if forced onto one; it's still reachable via search.
const SECTION_TO_REGIONS = {
  "Cervical Spine": ["neck"],
  "Thoracic Spine & Ribs": ["spine", "chest"],
  "Lumbar Spine": ["spine"],
  "Sacrum, Pelvis, Coccyx": ["pelvis"],
  "Shoulder & Shoulder Girdle": ["shoulder"],
  Elbow: ["upper_limb"],
  "Wrist, Hand & Forearm": ["wrist_hand"],
  "Hip, Groin & Thigh": ["hip"],
  Knee: ["knee"],
  "Lower Leg, Ankle & Foot": ["lower_leg", "ankle_foot"],
  Cerebrovascular: ["head"],
  "Traumatic Brain Injury & Concussion": ["head"],
  "Spinal Cord": ["spine"],
  "Neurodegenerative & Movement Disorders": ["head"],
  "Demyelinating & Immune-Mediated": ["head", "spine"],
  "Vestibular & Balance": ["head"],
  Cardiac: ["chest"],
  Pulmonary: ["chest"],
  "PART IX — PELVIC HEALTH, OBSTETRICS & UROGENITAL": ["pelvis"],
};

export function regionsForSection(section) {
  return SECTION_TO_REGIONS[section] || [];
}

/** Every reference entry whose section maps to this body region. */
export function referenceEntriesForRegion(regionId, conditionReference) {
  return (conditionReference || []).filter((e) => regionsForSection(e.section).includes(regionId));
}
