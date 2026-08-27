// One-off icon generator — resizes scripts/icon-source.png (a clean crop of
// the flexing-mascot tile from Images/Icon.jpeg's contact sheet — see
// generate-android-icons.mjs for how it was cropped) into the PWA/favicon
// PNGs the app already references (index.html, manifest.json).
// Not part of the build; run manually whenever the source image changes:
//   node scripts/generate-icons.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(__dirname, "icon-source.png"));
const publicDir = join(__dirname, "..", "public");

const targets = [
  { file: "pwa-192.png", size: 192 },
  { file: "pwa-512.png", size: 512 },
  { file: "maskable-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
];

for (const { file, size } of targets) {
  const png = await sharp(source).resize(size, size).png().toBuffer();
  writeFileSync(join(publicDir, file), png);
  console.log(`wrote ${file} (${size}x${size})`);
}
