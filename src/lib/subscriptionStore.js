// ── Subscription persistence / Stripe entry points ───────────────────────
// Thin wrappers around the two authenticated Edge Functions (see
// supabase/functions/). Both just redirect the browser to a Stripe-hosted
// page — no Stripe.js needed client-side for the Checkout redirect flow.

import { supabase } from "@/lib/supabaseClient";

async function callFunction(name) {
  const { data, error } = await supabase.functions.invoke(name);
  if (error) {
    // supabase-js's FunctionsHttpError carries the actual Response on
    // `.context` — error.message alone is usually just "Edge Function
    // returned a non-2xx status code," not the real reason. Both Edge
    // Functions return { error: "..." } bodies specifically so this can
    // surface something a user (or we, debugging) can actually act on.
    let detail = error.message;
    if (error.context && typeof error.context.json === "function") {
      try {
        const body = await error.context.json();
        if (body?.error) detail = body.error;
      } catch {
        // Body wasn't JSON, or already consumed — fall back to error.message.
      }
    }
    console.error(`Failed to call ${name}`, error, detail);
    return { url: null, error: detail || "Something went wrong" };
  }
  if (!data?.url) {
    console.error(`${name} returned no url`, data);
    return { url: null, error: "No redirect URL came back — try again?" };
  }
  return { url: data.url, error: null };
}

/** Redirects to Stripe Checkout to start a new subscription. */
export async function startCheckout() {
  const { url, error } = await callFunction("create-checkout-session");
  if (url) window.location.href = url;
  return { error };
}

/** Redirects to the Stripe Billing Portal to manage/cancel an existing subscription. */
export async function openBillingPortal() {
  const { url, error } = await callFunction("create-portal-session");
  if (url) window.location.href = url;
  return { error };
}
