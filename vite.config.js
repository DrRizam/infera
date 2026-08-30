import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * In production Cloudflare Pages serves static HTML for a few routes via
 * public/_redirects (200 rewrites). `vite dev` / `vite preview` don't read
 * _redirects, so this middleware reproduces it locally — those paths get
 * the static page, everything else stays on the SPA.
 */
const STATIC_PAGES = {
  "/": "marketing.html",
  "/terms": "terms.html",
  "/privacy": "privacy.html",
  "/refunds": "refunds.html",
};

function serveStaticPages() {
  const middleware = (baseDir) => (req, res, next) => {
    const pathname = (req.url || "").split("?")[0].replace(/\/$/, "") || "/";
    const name = STATIC_PAGES[pathname];
    if (name) {
      const file = path.join(baseDir, name);
      if (fs.existsSync(file)) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(fs.readFileSync(file));
        return;
      }
    }
    next();
  };
  return {
    name: "serve-static-pages",
    configureServer(server) {
      server.middlewares.use(middleware(path.resolve(__dirname, "public")));
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware(path.resolve(__dirname, "dist")));
    },
  };
}

export default defineConfig({
  plugins: [react(), serveStaticPages()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
  test: {
    environment: "node",
    globals: false,
  },
});
