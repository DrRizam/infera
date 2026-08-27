/**
 * Cloudflare Worker in front of the static assets.
 *
 * The marketing page and the app have opposite rendering needs: the app is a
 * client-rendered SPA (fine — it's behind auth), the marketing page must be
 * real HTML for crawlers and link unfurlers. So `/` serves a hand-authored
 * static `marketing.html`; everything else falls through to the assets
 * binding, which serves real files or the SPA shell (`not_found_handling:
 * single-page-application`) for client-routed paths like `/explore`.
 *
 * `run_worker_first: ["/"]` in wrangler.jsonc means this only runs for the
 * root; the passthrough branch is a safety net if that scoping ever changes.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return env.ASSETS.fetch(new Request(new URL("/marketing.html", url), request));
    }

    return env.ASSETS.fetch(request);
  },
};
