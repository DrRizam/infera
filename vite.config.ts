import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["apple-touch-icon.png"],
      manifest: {
        name: "Clinician — Daily Clinical Reasoning",
        short_name: "Clinician",
        description:
          "Spaced-repetition drills for musculoskeletal assessment: special tests, psychometrics, outcome measures, and red flags. A study aid for PTs and DPT students.",
        theme_color: "#4F46E5",
        background_color: "#F8FAFC",
        display: "standalone",
        orientation: "portrait",
        icons: [
          { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // The whole app (content banks included) precaches for full offline use.
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
      },
    }),
  ],
});
