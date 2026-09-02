// One-off asset extractor — slices Images/Mascot Emotions.png (a 4x2
// reference sheet the user supplied) into 8 individual transparent PNGs
// under src/assets/mascot/. Not part of the build; run manually if the
// source sheet ever changes:
//   node scripts/extract-mascot-emotions.mjs
//
// The sheet's card background and the character's own light parts (feet,
// hands, head tip) are nearly the same cream color, so a plain color-key
// would eat holes in the character. Instead this flood-fills from the
// crop's outer border inward, following only background-colored pixels —
// enclosed near-background patches inside the character's silhouette are
// never reached and stay opaque. The flood-filled region gets a binary
// (fully transparent) alpha, then a couple of small box-blur passes soften
// that into a clean anti-aliased edge instead of a hard/speckled cutoff.
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "..", "Images", "Mascot Emotions.png");
const OUT_DIR = join(__dirname, "..", "src", "assets", "mascot");
mkdirSync(OUT_DIR, { recursive: true });

// Card grid measured directly off the sheet (1536x1024, 4 cols x 2 rows).
// Each cell's height is trimmed to end above the "N. Label" caption text.
const COLS = [
  { left: 21, width: 354 },
  { left: 391, width: 367 },
  { left: 778, width: 366 },
  { left: 1159, width: 353 },
];
const ROW_TOP = 27;
const CONTENT_HEIGHT = 398;
const ROW_GAP = 495; // row2 top (522) - row1 top (27)

const CELLS = [
  { mood: "cheerful", row: 0, col: 0 },
  { mood: "curious", row: 0, col: 1 },
  { mood: "determined", row: 0, col: 2 },
  { mood: "celebrating", row: 0, col: 3 },
  { mood: "encouraging", row: 1, col: 0 },
  { mood: "thinking", row: 1, col: 1 },
  { mood: "tired", row: 1, col: 2 },
  { mood: "concerned", row: 1, col: 3 },
];

// Tight on purpose: wide enough to bridge the sheet's own white-gap/cream
// seam (~14 apart) plus minor noise, but well short of the warm-tan drop
// shadow under each character's feet (~40-70 away) — that shadow shares
// its palette with the feet themselves, so there's no color threshold that
// removes the shadow cleanly without also eating into the feet. Keeping
// the shadow fully opaque (not attempting to remove it) reads as an
// intentional contact shadow instead of a partially-erased, speckled one.
const STRICT_TOLERANCE = 16;

function colorDistance(r, g, b, ref) {
  const dr = r - ref[0];
  const dg = g - ref[1];
  const db = b - ref[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function floodFillAlpha(raw, width, height, channels) {
  const rgba = Buffer.alloc(width * height * 4);
  // Copy RGB, default alpha fully opaque.
  for (let i = 0; i < width * height; i++) {
    rgba[i * 4] = raw[i * channels];
    rgba[i * 4 + 1] = raw[i * channels + 1];
    rgba[i * 4 + 2] = raw[i * channels + 2];
    rgba[i * 4 + 3] = 255;
  }

  // Reference background = a point safely inside the card (not the very
  // corner, which can land on the anti-aliased edge/outer white gap and
  // give a reference color the true cream interior doesn't match).
  const refIdx = (15 * width + 15) * channels;
  const ref = [raw[refIdx], raw[refIdx + 1], raw[refIdx + 2]];

  const visited = new Uint8Array(width * height);
  const queue = [];
  const pushIfBg = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    const r = raw[idx * channels];
    const g = raw[idx * channels + 1];
    const b = raw[idx * channels + 2];
    if (colorDistance(r, g, b, ref) <= STRICT_TOLERANCE) {
      visited[idx] = 1;
      queue.push(idx);
    }
  };

  for (let x = 0; x < width; x++) {
    pushIfBg(x, 0);
    pushIfBg(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    pushIfBg(0, y);
    pushIfBg(width - 1, y);
  }

  while (queue.length) {
    const idx = queue.pop();
    const x = idx % width;
    // Binary alpha for every flood-filled pixel — a blur pass afterward
    // (see blurAlpha) turns this into a soft anti-aliased edge more
    // cleanly than grading alpha per-pixel here, which produced a speckled
    // edge (the color-distance-to-alpha mapping isn't spatially smooth).
    rgba[idx * 4 + 3] = 0;

    const neighbors = [idx - 1, idx + 1, idx - width, idx + width];
    for (const nIdx of neighbors) {
      if (nIdx < 0 || nIdx >= width * height) continue;
      if (visited[nIdx]) continue;
      const nx = nIdx % width;
      if (Math.abs(nx - x) > 1) continue; // guard wraparound on row edges
      const nr = raw[nIdx * channels];
      const ng = raw[nIdx * channels + 1];
      const nb = raw[nIdx * channels + 2];
      if (colorDistance(nr, ng, nb, ref) <= STRICT_TOLERANCE) {
        visited[nIdx] = 1;
        queue.push(nIdx);
      }
    }
  }

  return rgba;
}

/** Simple radius-1 box blur applied to just the alpha channel, to smooth
 * the slightly speckled edge the graded-alpha falloff leaves behind. */
function blurAlpha(rgba, width, height) {
  const src = new Uint8ClampedArray(width * height);
  for (let i = 0; i < width * height; i++) src[i] = rgba[i * 4 + 3];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          sum += src[ny * width + nx];
          count++;
        }
      }
      rgba[(y * width + x) * 4 + 3] = Math.round(sum / count);
    }
  }
}

for (const { mood, row, col } of CELLS) {
  const { left, width } = COLS[col];
  const top = ROW_TOP + row * ROW_GAP;
  const height = CONTENT_HEIGHT;

  const { data, info } = await sharp(SRC)
    .extract({ left, top, width, height })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rgba = floodFillAlpha(data, info.width, info.height, info.channels);
  blurAlpha(rgba, info.width, info.height);
  blurAlpha(rgba, info.width, info.height);

  const outPath = join(OUT_DIR, `${mood}.png`);
  await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim()
    .png()
    .toFile(outPath);
  console.log(`wrote ${mood}.png`);
}
