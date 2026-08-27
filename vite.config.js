import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * In production a Cloudflare Worker serves `marketing.html` at `/` (see
 * worker/index.js). `vite dev` and `vite preview` don't run that Worker, so
 * this middleware reproduces it locally — `/` gets the static marketing page,
 * everything else stays on the SPA.
 */
function serveMarketingAtRoot() {
  const middleware = (baseDir) => (req, res, next) => {
    // Match only "/" — exactly what the production Worker's run_worker_first
    // scope covers. "/index.html" stays the SPA shell, same as prod.
    const url = (req.url || "").split("?")[0];
    if (url === "/") {
      const file = path.join(baseDir, "marketing.html");
      if (fs.existsSync(file)) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(fs.readFileSync(file));
        return;
      }
    }
    next();
  };
  return {
    name: "serve-marketing-at-root",
    configureServer(server) {
      server.middlewares.use(middleware(path.resolve(__dirname, "public")));
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware(path.resolve(__dirname, "dist")));
    },
  };
}

export default defineConfig({
  plugins: [react(), serveMarketingAtRoot()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    globals: false,
  },
});
