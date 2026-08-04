// ── Content loader ─────────────────────────────────────────────────────────
// Every *.json file in banks/ is a content bank; dropping a new file in is
// all it takes to add material — a new specialty track included. No code
// change, no registration step, no enum to extend.
//
// Banks are schema-validated at startup, and the topic → module mapping and
// the module list are DERIVED from what the banks declare. If a bank names a
// module and topics nobody has used before, the app picks them up.

import type { Drill } from "../types";
import { bankSchema } from "./schema";
import roadmap from "./roadmap.json";

const modules = import.meta.glob("./banks/*.json", { eager: true }) as Record<
  string,
  { default: unknown }
>;

export interface ModuleInfo {
  id: string;
  name: string;
  status: "ready" | "development" | "locked";
  /** Sub-line shown under the name for modules without playable content. */
  note: string;
  order: number;
}

const all: Drill[] = [];
const seen = new Set<string>();
const topicToModule: Record<string, string> = {};
const safety = new Set<string>();
const bankMeta = new Map<string, { order: number }>();

for (const [path, mod] of Object.entries(modules)) {
  const parsed = bankSchema.safeParse(mod.default);
  if (!parsed.success) {
    throw new Error(
      `Invalid content bank ${path}:\n${parsed.error.issues
        .map((i) => `  ${i.path.join(".")}: ${i.message}`)
        .join("\n")}`
    );
  }
  const bank = parsed.data;
  if (bank.status === "archived") continue;

  const existing = bankMeta.get(bank.module);
  bankMeta.set(bank.module, {
    order: Math.min(bank.order ?? 99, existing?.order ?? 99),
  });
  for (const t of bank.safetyTopics ?? []) safety.add(t);

  for (const item of bank.items) {
    if (seen.has(item.id)) throw new Error(`Duplicate drill id "${item.id}" (${path})`);
    seen.add(item.id);

    const claimed = topicToModule[item.topic];
    if (claimed && claimed !== bank.module) {
      throw new Error(
        `Topic "${item.topic}" appears under both "${claimed}" and "${bank.module}". ` +
          `A topic belongs to exactly one module — rename it in one of the banks.`
      );
    }
    topicToModule[item.topic] = bank.module;
    all.push(item as Drill);
  }
}

export const drills: Drill[] = all;

/** Which presenting-complaint module each topic belongs to. */
export const moduleOfTopic: Record<string, string> = topicToModule;

/** Topics whose failure has safety consequences, declared by their bank. */
export const safetyTopics: string[] = [...safety];

/**
 * The mastery-path curriculum: modules that have content, followed by the
 * planned ones from roadmap.json so the direction is visible and honest.
 */
export const MODULES: ModuleInfo[] = [
  ...[...bankMeta.entries()]
    .map(([id, meta]): ModuleInfo => ({
      id,
      name: id,
      status: "ready",
      note: "",
      order: meta.order,
    }))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)),
  ...(roadmap as Omit<ModuleInfo, "name">[])
    .filter((m) => !bankMeta.has(m.id))
    .map((m): ModuleInfo => ({ ...m, name: m.id })),
];

export function isReadyModule(id: string): boolean {
  return MODULES.some((m) => m.id === id && m.status === "ready");
}
