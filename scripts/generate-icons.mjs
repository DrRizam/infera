// One-off icon generator — resizes scripts/icon-source.png (the flexing
// muscle mascot) into the PWA / favicon assets the app references
// (index.html, marketing.html, manifest.json, the header logo).
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
  { file: "favicon-32.png", size: 32 },
  { file: "favicon-16.png", size: 16 },
];

for (const { file, size } of targets) {
  const png = await sharp(source).resize(size, size).png().toBuffer();
  writeFileSync(join(publicDir, file), png);
  console.log(`wrote ${file} (${size}x${size})`);
}

// favicon.ico — a single 32×32 PNG wrapped in the ICO container (valid
// since Windows Vista). sharp has no .ico encoder, so build it by hand.
const ico32 = await sharp(source).resize(32, 32).png().toBuffer();
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: 1 = icon
header.writeUInt16LE(1, 4); // image count
const entry = Buffer.alloc(16);
entry.writeUInt8(32, 0); // width
entry.writeUInt8(32, 1); // height
entry.writeUInt8(0, 2); // palette count
entry.writeUInt8(0, 3); // reserved
entry.writeUInt16LE(1, 4); // color planes
entry.writeUInt16LE(32, 6); // bits per pixel
entry.writeUInt32LE(ico32.length, 8); // image data size
entry.writeUInt32LE(header.length + 16, 12); // offset to image data
writeFileSync(join(publicDir, "favicon.ico"), Buffer.concat([header, entry, ico32]));
console.log("wrote favicon.ico (32x32)");
