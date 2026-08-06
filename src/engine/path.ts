// ── Unified learning path ──────────────────────────────────────────────────
// Cases and condition lessons are different modalities but the same kind of
// content: "beyond daily drills." One sequential path unifies them so there
// is a single, honest answer to "what's next" — real content first, then the
// same planned-track roadmap already used for drill modules (content/index.ts
// MODULES), never invented case titles for content that doesn't exist yet.

import type { Profile } from "../types";
import { cases } from "../cases";
import { conditions } from "../conditions";
import roadmap from "../content/roadmap.json";

export interface PathNode {
  id: string;
  kind: "case" | "condition" | "planned";
  /**
   * Short, tree-safe — and never the diagnosis. A condition lesson's whole
   * point is naming the diagnosis, but the path overview is a preview, not
   * the lesson: it should read "a knee case," not "patellofemoral pain."
   */
  label: string;
  /** Fuller, presentation-framed description, used by the "Continue learning" hero. */
  detail: string;
  sub: string;
  status: "completed" | "current" | "locked";
}

interface RealNode {
  id: string;
  kind: "case" | "condition";
  label: string;
  detail: string;
  sub: string;
}

function isComplete(profile: Profile, n: RealNode): boolean {
  return n.kind === "case"
    ? profile.caseResults.some((r) => r.caseId === n.id)
    : profile.conditionProgress[n.id]?.completedOn != null;
}

/**
 * Real content first (cases, then conditions), sequentially unlocked — the
 * first incomplete node is `current`, everything after it is `locked` until
 * it's done. Planned tracks from content/roadmap.json trail behind, always
 * locked, using their existing honest `note` copy.
 */
export function buildLearningPath(profile: Profile): PathNode[] {
  const real: RealNode[] = [
    ...cases.map((c) => ({
      id: c.id,
      kind: "case" as const,
      label: c.bodyRegion,
      detail: c.title,
      sub: `${c.presentingComplaint} · ${c.estimatedMinutes} min`,
    })),
    ...conditions.map((c) => ({
      id: c.id,
      kind: "condition" as const,
      label: c.bodyRegion,
      detail: c.presentingComplaints[0],
      sub: `${c.presentingComplaints[0]} · ${c.estimatedMinutes} min`,
    })),
  ];

  let currentAssigned = false;
  const nodes: PathNode[] = real.map((n) => {
    if (isComplete(profile, n)) return { ...n, status: "completed" };
    if (!currentAssigned) {
      currentAssigned = true;
      return { ...n, status: "current" };
    }
    return { ...n, status: "locked" };
  });

  const planned: PathNode[] = (roadmap as { id: string; note: string }[]).map((m) => ({
    id: m.id,
    kind: "planned",
    label: m.id,
    detail: m.id,
    sub: m.note,
    status: "locked",
  }));

  return [...nodes, ...planned];
}

/** The node the "Continue learning" hero should point at, if any. */
export function currentPathNode(profile: Profile): PathNode | undefined {
  return buildLearningPath(profile).find((n) => n.status === "current");
}
