// Generates the PWA icon set into public/ with zero dependencies: a teal
// rounded square with a white bullseye (assessment accuracy). Re-run after
// changing the design: node scripts/make-icons.mjs
import { deflateSync } from "node:zlib";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const BRAND = [79, 70, 229]; // --primary (Deep Indigo #4F46E5)
const WHITE = [255, 255, 255];

/** Render one icon as RGBA. maskable icons keep the motif inside the safe zone. */
function drawIcon(size, { rounded, motifScale }) {
  const px = new Uint8Array(size * size * 4);
  const half = size / 2;
  const cornerR = size * 0.22;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // 2×2 supersampling for smooth edges
      let [r, g, b, a] = [0, 0, 0, 0];
      for (const [ox, oy] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
        const sx = x + ox;
        const sy = y + oy;

        // Rounded-rect alpha mask (full-bleed square when !rounded)
        let inside = true;
        if (rounded) {
          const dx = Math.max(cornerR - sx, sx - (size - cornerR), 0);
          const dy = Math.max(cornerR - sy, sy - (size - cornerR), 0);
          inside = dx * dx + dy * dy <= cornerR * cornerR;
        }
        if (!inside) continue;

        // Bullseye: normalized distance from center, scaled by safe zone
        const u = Math.hypot(sx - half, sy - half) / (half * motifScale);
        let c;
        if (u <= 0.24) c = WHITE; // center dot
        else if (u <= 0.42) c = BRAND; // gap
        else if (u <= 0.58) c = WHITE; // ring
        else c = BRAND; // background beyond the motif
        // Subtle depth: darken toward bottom
        const shade = 1 - 0.10 * (sy / size);
        r += c[0] * shade;
        g += c[1] * shade;
        b += c[2] * shade;
        a += 255;
      }
      const i = (y * size + x) * 4;
      px[i] = r / 4;
      px[i + 1] = g / 4;
      px[i + 2] = b / 4;
      px[i + 3] = a / 4;
    }
  }
  return px;
}

// ── Minimal PNG encoder (RGBA8, no filtering) ──────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(rgba, size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // Raw scanlines, each prefixed with filter byte 0
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    Buffer.from(rgba.buffer, y * size * 4, size * 4).copy(raw, y * (size * 4 + 1) + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const outDir = fileURLToPath(new URL("../public/", import.meta.url));
await mkdir(outDir, { recursive: true });

const icons = [
  ["pwa-192.png", 192, { rounded: true, motifScale: 0.78 }],
  ["pwa-512.png", 512, { rounded: true, motifScale: 0.78 }],
  ["maskable-512.png", 512, { rounded: false, motifScale: 0.62 }],
  ["apple-touch-icon.png", 180, { rounded: false, motifScale: 0.78 }],
];

for (const [name, size, opts] of icons) {
  await writeFile(outDir + name, encodePng(drawIcon(size, opts), size));
  console.log(`public/${name} (${size}×${size})`);
}
