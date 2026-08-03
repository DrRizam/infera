import type { Complaint } from "../types";

// The mastery-path curriculum. Only "ready" modules have playable content;
// the rest are visible so the curriculum's direction is honest and concrete.

export interface ModuleInfo {
  id: string;
  name: string;
  status: "ready" | "development" | "locked";
  note: string; // sub-line shown under the name for non-ready modules
}

export const MODULES: ModuleInfo[] = [
  { id: "Shoulder pain", name: "Shoulder pain", status: "ready", note: "" },
  { id: "Low back pain", name: "Low back pain", status: "ready", note: "" },
  { id: "Knee pain", name: "Knee pain", status: "development", note: "3 case outlines drafted" },
  { id: "Neck pain", name: "Neck pain", status: "development", note: "2 case outlines drafted" },
  { id: "Dizziness", name: "Dizziness", status: "locked", note: "Curriculum planned" },
];

export function isReadyModule(id: string): id is Complaint {
  return MODULES.some((m) => m.id === id && m.status === "ready");
}
