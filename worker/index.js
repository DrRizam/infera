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
 * `run_worker_first` in wrangler.jsonc lists exactly these paths, so the
 * passthrough branch is only a safety net.
 */
const STATIC_PAGES = {
  "/": "/marketing.html",
  "/terms": "/terms.html",
  "/privacy": "/privacy.html",
  "/refunds": "/refunds.html",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const file = STATIC_PAGES[url.pathname.replace(/\/$/, "") || "/"];

    if (file) {
      return env.ASSETS.fetch(new Request(new URL(file, url), request));
    }

    return env.ASSETS.fetch(request);
  },
};
