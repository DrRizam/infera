// One-off migration: serialize the legacy TS drill arrays into the JSON
// content banks under src/content/banks/. Kept in the repo as a record of
// where the seed content came from; safe to delete once the real 150-item
// bank has replaced the prototype items.
//
// Usage: node scripts/ts-content-to-json.mjs
import { build } from "esbuild";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const outDir = new URL("../src/content/banks/", import.meta.url);
const tmp = new URL("../node_modules/.tmp-content-export.mjs", import.meta.url);

await build({
  stdin: {
    contents: `
      export { drills } from "./src/content/drills";
      export { MODULE_OF_TOPIC } from "./src/types";
    `,
    resolveDir: fileURLToPath(new URL("..", import.meta.url)),
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  outfile: fileURLToPath(tmp),
});

const { drills, MODULE_OF_TOPIC } = await import(tmp.href);

const banks = {
  "shoulder.json": { module: "Shoulder pain", items: [] },
  "lumbar.json": { module: "Low back pain", items: [] },
};

for (const d of drills) {
  const bank =
    MODULE_OF_TOPIC[d.topic] === "Shoulder pain" ? banks["shoulder.json"] : banks["lumbar.json"];
  bank.items.push({
    ...d,
    citation: d.citation ?? "UNVERIFIED — prototype draft; citation pending clinical review",
    evidenceReviewedOn: d.evidenceReviewedOn ?? null,
    verification: d.verification ?? "unverified",
  });
}

await mkdir(outDir, { recursive: true });
for (const [file, bank] of Object.entries(banks)) {
  await writeFile(new URL(file, outDir), JSON.stringify(bank, null, 2) + "\n", "utf8");
  console.log(`${file}: ${bank.items.length} items`);
}
await rm(tmp);
