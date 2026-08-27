// One-off generator for the Capacitor/Android icon + splash source assets in
// assets/, built from scripts/icon-source.png — a clean 1024x1024 crop of
// the flexing-mascot tile out of Images/Icon.jpeg (which is a contact sheet
// of three icon variants, not a single ready-to-use icon; the crop box was
// found by scanning for the white-background boundary around that tile).
// Not part of the build; run manually whenever the source image changes:
//   node scripts/generate-android-icons.mjs
// Then: npx capacitor-assets generate --android
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(__dirname, "icon-source.png"));
const assetsDir = join(__dirname, "..", "assets");
mkdirSync(assetsDir, { recursive: true });

const SPLASH_BG = "#FBFAF7"; // matches manifest.json background_color/theme_color

async function main() {
  // Icon.jpeg is already a flat, full-bleed square design (rounded-square
  // background baked in, subject comfortably inset) — used as-is for both
  // the legacy launcher icon and the adaptive-icon foreground, rather than
  // padding it onto a smaller transparent canvas.
  const iconOnly = await sharp(source).resize(1024, 1024).png().toBuffer();
  writeFileSync(join(assetsDir, "icon-only.png"), iconOnly);
  writeFileSync(join(assetsDir, "icon-foreground.png"), iconOnly);
  console.log("wrote assets/icon-only.png + icon-foreground.png (1024x1024)");

  // Adaptive icon background: solid fill sampled from the source image's
  // own edge (inset from the rounded corners, which curve to white), so if
  // the adaptive mask ever reveals a sliver around the opaque foreground,
  // it blends rather than showing a hard mismatched edge.
  const { data: edgePixel } = await sharp(source)
    .extract({ left: 10, top: 512, width: 1, height: 1 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const [r, g, b] = edgePixel;
  const background = await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: { r, g, b, alpha: 1 } },
  })
    .png()
    .toBuffer();
  writeFileSync(join(assetsDir, "icon-background.png"), background);
  console.log(`wrote assets/icon-background.png (1024x1024, sampled #${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")})`);

  // Splash screen: icon centered at ~35% width on the app's light background.
  const splashIcon = await sharp(source).resize(Math.round(2732 * 0.35)).png().toBuffer();
  const splash = await sharp({
    create: { width: 2732, height: 2732, channels: 4, background: SPLASH_BG },
  })
    .composite([{ input: splashIcon, gravity: "center" }])
    .png()
    .toBuffer();
  writeFileSync(join(assetsDir, "splash.png"), splash);
  writeFileSync(join(assetsDir, "splash-dark.png"), splash);
  console.log("wrote assets/splash.png + splash-dark.png (2732x2732)");
}

main();
