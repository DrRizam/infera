// ── Content loader ─────────────────────────────────────────────────────────
// Every *.json file in banks/ is a content bank; dropping a new file in is
// all it takes to add material (a new specialty track included) — no code
// change, no registration step. Banks are schema-validated at startup.

import type { Drill } from "../types";
import { bankSchema } from "./schema";

const modules = import.meta.glob("./banks/*.json", { eager: true }) as Record<
  string,
  { default: unknown }
>;

const all: Drill[] = [];
const seen = new Set<string>();

for (const [path, mod] of Object.entries(modules)) {
  const parsed = bankSchema.safeParse(mod.default);
  if (!parsed.success) {
    throw new Error(
      `Invalid content bank ${path}:\n${parsed.error.issues
        .map((i) => `  ${i.path.join(".")}: ${i.message}`)
        .join("\n")}`
    );
  }
  if (parsed.data.status === "archived") continue;
  for (const item of parsed.data.items) {
    if (seen.has(item.id)) throw new Error(`Duplicate drill id "${item.id}" (${path})`);
    seen.add(item.id);
    all.push(item as Drill);
  }
}

export const drills: Drill[] = all;
