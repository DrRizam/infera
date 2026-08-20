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
 * toward the user's focus module when they have one and it has cases;
 * otherwise (or if that module is empty) falls back to the full case list.
 */
export function conditionOfTheDay(cases, focusModule, today) {
  const all = cases || [];
  const filtered = focusModule ? all.filter((c) => c.module === focusModule) : all;
  const pool = filtered.length ? filtered : all;
  if (!pool.length) return null;
  const sorted = [...pool].sort((a, b) => a.id.localeCompare(b.id));
  const dayIndex = Math.floor(new Date(`${today}T00:00:00Z`).getTime() / 86400000);
  const idx = (dayIndex + hashStr(focusModule || "mixed")) % sorted.length;
  return sorted[idx];
}
