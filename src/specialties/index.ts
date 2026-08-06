// ── Clinical specialties ───────────────────────────────────────────────────
// The top-level structure above body-region drill tracks, cases and
// conditions. Status is derived from what content actually exists under a
// specialty, never hand-set — same "derive, don't hardcode" rule the
// MODULES list already follows in content/index.ts, for the same reason:
// a specialty that claims to be ready without content would be lying.

import { MODULES } from "../content";
import { cases } from "../cases";
import { conditions } from "../conditions";
import type { ClinicalCase } from "../cases/schema";
import type { Condition } from "../conditions/schema";

export interface Specialty {
  id: string;
  name: string;
  icon: string;
  blurb: string;
  /** content/index.ts MODULES ids nested under this specialty. */
  bodyRegionModules: string[];
}

export const SPECIALTIES: Specialty[] = [
  {
    id: "msk-ortho",
    name: "Musculoskeletal & Orthopedic",
    icon: "🦴",
    blurb: "Joint and soft-tissue presentations — the daily bread of outpatient physio.",
    bodyRegionModules: ["Shoulder pain", "Low back pain", "Knee pain", "Neck pain"],
  },
  {
    id: "sports-physio",
    name: "Sports Physio",
    icon: "🏃",
    blurb: "Load management, return-to-play decisions, and the athlete-specific version of MSK reasoning.",
    bodyRegionModules: [],
  },
  {
    id: "pediatrics",
    name: "Pediatrics",
    icon: "🧒",
    blurb: "Growth-related and developmental presentations — different red flags, different norms.",
    bodyRegionModules: [],
  },
  {
    id: "neuro",
    name: "Neuro",
    icon: "🧠",
    blurb: "Central and peripheral neurological presentations affecting movement and function.",
    bodyRegionModules: [],
  },
  {
    id: "cardiovascular",
    name: "Cardiovascular",
    icon: "❤️",
    blurb: "Cardiopulmonary rehab and the presentations that mimic or mask MSK complaints.",
    bodyRegionModules: [],
  },
  {
    id: "geriatrics",
    name: "Geriatrics",
    icon: "🦯",
    blurb: "Falls risk, frailty, and multi-morbidity — reasoning under a different set of constraints.",
    bodyRegionModules: [],
  },
  {
    id: "pelvic-floor",
    name: "Pelvic Floor",
    icon: "🩺",
    blurb: "Pelvic health across the lifespan — a specialty area with its own exam and red flags.",
    bodyRegionModules: [],
  },
  {
    id: "oncology",
    name: "Oncology",
    icon: "🎗️",
    blurb: "Cancer-related impairment and rehab, and recognizing presentations that need onward referral.",
    bodyRegionModules: [],
  },
  {
    id: "vestibular",
    name: "Vestibular",
    icon: "🌀",
    blurb: "Dizziness and balance — a presentation easy to mistake for something purely musculoskeletal.",
    bodyRegionModules: ["Dizziness"],
  },
];

export function getSpecialty(id: string): Specialty | undefined {
  return SPECIALTIES.find((s) => s.id === id);
}

/** "ready" once any module nested under this specialty has real drill content. */
export function specialtyStatus(s: Specialty): "ready" | "development" {
  const ready = s.bodyRegionModules.some(
    (id) => MODULES.find((m) => m.id === id)?.status === "ready"
  );
  return ready ? "ready" : "development";
}

/**
 * Matches a case/condition's bodyRegion against this specialty's nested
 * module names (e.g. bodyRegion "Knee" matches module "Knee pain") — the
 * same heuristic this app has used before for the same purpose.
 */
function matchesRegion(s: Specialty, bodyRegion: string): boolean {
  const region = bodyRegion.toLowerCase();
  return s.bodyRegionModules.some((m) => m.toLowerCase().startsWith(region));
}

export function casesFor(s: Specialty): ClinicalCase[] {
  return cases.filter((c) => matchesRegion(s, c.bodyRegion));
}

export function conditionsFor(s: Specialty): Condition[] {
  return conditions.filter((c) => matchesRegion(s, c.bodyRegion));
}

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Today's hard case for this specialty: the hardest available, rotating
 * deterministically by day when there's a choice — same rotation pattern the
 * old daily-case picker used. Undefined when nothing is scoped here yet.
 */
export function dailyHardCase(s: Specialty, today: string = new Date().toISOString().slice(0, 10)): ClinicalCase | undefined {
  const pool = casesFor(s);
  if (pool.length === 0) return undefined;
  const maxDifficulty = Math.max(...pool.map((c) => c.difficulty));
  const hardest = pool.filter((c) => c.difficulty === maxDifficulty);
  const idx = hash(today + s.id) % hardest.length;
  return hardest[idx];
}
