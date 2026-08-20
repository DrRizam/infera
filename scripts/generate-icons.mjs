// One-off icon generator — rasterizes scripts/flex-icon.svg into the PWA/
// favicon PNGs the app already references (index.html, manifest.json).
// Not part of the build; run manually whenever the source SVG changes:
//   node scripts/generate-icons.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Resvg } from "@resvg/resvg-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const svg = readFileSync(join(__dirname, "flex-icon.svg"), "utf-8");
const publicDir = join(__dirname, "..", "public");

const targets = [
  { file: "pwa-192.png", size: 192 },
  { file: "pwa-512.png", size: 512 },
  { file: "maskable-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
];

for (const { file, size } of targets) {
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: size } });
  const png = resvg.render().asPng();
  writeFileSync(join(publicDir, file), png);
  console.log(`wrote ${file} (${size}x${size})`);
}
