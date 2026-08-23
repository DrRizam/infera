import { Activity, Baby, Bone, Brain, Droplet, Ear, HeartPulse, PersonStanding, Ribbon } from "lucide-react";

// Full literal gradient strings — Tailwind can't see dynamically built class
// names (`bg-${x}-500`), so these must stay whole strings, never templated.
export const MODULES = [
  {
    id: "sports",
    name: "Sports Physio",
    icon: Activity,
    color: "from-orange-500 to-amber-500",
    blurb: "Load management, return-to-play decisions, and the athlete-specific version of MSK reasoning.",
  },
  {
    id: "msk",
    name: "Musculoskeletal & Orthopedic",
    icon: Bone,
    color: "from-sky-500 to-cyan-500",
    blurb: "Joint and soft-tissue presentations — the daily bread of outpatient physio.",
  },
  {
    id: "pediatrics",
    name: "Pediatrics",
    icon: Baby,
    color: "from-pink-500 to-rose-500",
    blurb: "Growth-related and developmental presentations — different red flags, different norms.",
  },
  {
    id: "neuro",
    name: "Neurological",
    icon: Brain,
    color: "from-violet-500 to-purple-500",
    blurb: "Central and peripheral neurological presentations affecting movement and function.",
  },
  {
    id: "cardio",
    name: "Cardiovascular",
    icon: HeartPulse,
    color: "from-red-500 to-rose-500",
    blurb: "Cardiopulmonary rehab and the presentations that mimic or mask MSK complaints.",
  },
  {
    id: "geriatrics",
    name: "Geriatrics",
    icon: PersonStanding,
    color: "from-emerald-500 to-teal-500",
    blurb: "Falls risk, frailty, and multi-morbidity — reasoning under a different set of constraints.",
  },
  {
    id: "pelvic",
    name: "Pelvic Floor",
    icon: Droplet,
    color: "from-fuchsia-500 to-pink-500",
    blurb: "Pelvic health across the lifespan — a specialty area with its own exam and red flags.",
  },
  {
    id: "oncology",
    name: "Oncology",
    icon: Ribbon,
    color: "from-indigo-500 to-violet-500",
    blurb: "Cancer-related impairment and rehab, and recognizing presentations that need onward referral.",
  },
  {
    id: "vestibular",
    name: "Vestibular",
    icon: Ear,
    color: "from-cyan-500 to-blue-500",
    blurb: "Dizziness and balance — a presentation easy to mistake for something purely musculoskeletal.",
  },
];

export function getModule(id) {
  return MODULES.find((m) => m.id === id);
}

export const BODY_REGIONS = [
  { id: "head", label: "Head" },
  { id: "neck", label: "Neck" },
  { id: "shoulder", label: "Shoulder" },
  { id: "upper_limb", label: "Upper limb" },
  { id: "wrist_hand", label: "Wrist & hand" },
  { id: "chest", label: "Chest" },
  { id: "abdomen", label: "Abdomen" },
  { id: "spine", label: "Spine" },
  { id: "pelvis", label: "Pelvis" },
  { id: "hip", label: "Hip" },
  { id: "knee", label: "Knee" },
  { id: "lower_leg", label: "Lower leg" },
  { id: "ankle_foot", label: "Ankle & foot" },
];

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * One hard case per module per day, deterministic — hardest/highest-reward
 * first, then rotated by a day index so it's the same pick all day and a
 * different one tomorrow.
 */
export function dailyHardCase(cases, moduleId, today) {
  const pool = (cases || []).filter((c) => c.module === moduleId);
  if (!pool.length) return null;
  const sorted = [...pool].sort((a, b) => (b.difficulty || 0) - (a.difficulty || 0) || (b.xp_reward || 0) - (a.xp_reward || 0));
  const dayIndex = Math.floor(new Date(`${today}T00:00:00Z`).getTime() / 86400000);
  const idx = (dayIndex + hashStr(moduleId)) % sorted.length;
  return sorted[idx];
}

/**
 * One educational card per day, independent of spaced-repetition review —
 * deterministic so it's the same pick all day and rotates tomorrow. Biased
 * toward the user's focus modules (any number of them) when they have cases
 * between them; otherwise (or if none of them have cases) falls back to the
 * full case list.
 */
// Self-reported experience → how many leading (lowest-order) path nodes are
// pre-unlocked without being marked complete, so an experienced learner
// isn't forced to grind through intro-difficulty cases just to reach content
// at their level. Capped so a run of easy cases can't skip an entire module,
// and "student" gets no skip — the sequential walk is the point for them.
const PLACEMENT_DIFFICULTY_CEILING = { some: 1, experienced: 2 };
const PLACEMENT_SKIP_CAP = 5;

/**
 * Counts leading nodes (already sorted in path order) whose difficulty is at
 * or below the ceiling for this experience level. Stops at the first node
 * that exceeds the ceiling, so it only ever skips a contiguous intro run.
 */
export function placementSkipCount(sortedCases, experienceLevel) {
  const ceiling = PLACEMENT_DIFFICULTY_CEILING[experienceLevel];
  if (!ceiling) return 0;
  let count = 0;
  for (const c of sortedCases) {
    if (count >= PLACEMENT_SKIP_CAP || (c.difficulty || 1) > ceiling) break;
    count++;
  }
  return count;
}

/**
 * Boss-round completion key, namespaced by axis so a module-organized path
 * and a region-organized path can never collide. Module axis keeps the
 * original unprefixed "{id}:{level}" format already stored in real
 * profiles; region axis gets a "region:" prefix.
 */
export function bossRoundKey(axis, groupId, level) {
  return axis === "region" ? `region:${groupId}:${level}` : `${groupId}:${level}`;
}

export function conditionOfTheDay(cases, focusModules, today) {
  const all = cases || [];
  const focus = focusModules || [];
  const filtered = focus.length ? all.filter((c) => focus.includes(c.module)) : all;
  const pool = filtered.length ? filtered : all;
  if (!pool.length) return null;
  const sorted = [...pool].sort((a, b) => a.id.localeCompare(b.id));
  const dayIndex = Math.floor(new Date(`${today}T00:00:00Z`).getTime() / 86400000);
  const hashKey = focus.length ? [...focus].sort().join(",") : "mixed";
  const idx = (dayIndex + hashStr(hashKey)) % sorted.length;
  return sorted[idx];
}
