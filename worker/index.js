/**
 * Cloudflare Worker in front of the static assets.
 *
 * A handful of routes must be real HTML (crawlers, link unfurlers, Paddle's
 * verification bot) rather than the client-rendered SPA: the marketing page
 * and the legal pages. Those are hand-authored static files; every other
 * request falls through to the assets binding, which serves real files or
 * the SPA shell (`not_found_handling: single-page-application`) for
 * client-routed paths like `/explore`.
 *
 * The assets binding runs with `html_handling: "none"` so fetching
 * `/terms.html` here returns the file directly. With the default
 * (`auto-trailing-slash`) it would 307 `/terms.html` -> `/terms`, which for
 * the run_worker_first paths bounces straight back into this Worker and
 * loops.
 */
const STATIC_PAGES = {
  "/": "/marketing.html",
  "/marketing": "/marketing.html",
  "/terms": "/terms.html",
  "/privacy": "/privacy.html",
  "/refunds": "/refunds.html",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = url.pathname.replace(/\/+$/, "") || "/";

    const file = STATIC_PAGES[key];
    if (file) {
      return env.ASSETS.fetch(new Request(new URL(file, url), request));
    }

    const res = await env.ASSETS.fetch(request);

    // not_found_handling serves the SPA shell (200 text/html) for anything
    // unmatched. Right for client routes like /explore, wrong for a missing
    // static file like /favicon.ico — a browser or crawler asking for one
    // should get a 404, not an HTML document it can't decode.
    const looksLikeFile = /\.[a-z0-9]+$/i.test(key) && !key.endsWith(".html");
    const isSpaShell =
      res.status === 200 &&
      (res.headers.get("content-type") || "").includes("text/html");
    if (looksLikeFile && isSpaShell) {
      return new Response("Not found", { status: 404 });
    }

    return res;
  },
};
