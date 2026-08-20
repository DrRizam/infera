// ── Subscription persistence / Stripe entry points ───────────────────────
// Thin wrappers around the two authenticated Edge Functions (see
// supabase/functions/). Both just redirect the browser to a Stripe-hosted
// page — no Stripe.js needed client-side for the Checkout redirect flow.

import { supabase } from "@/lib/supabaseClient";

async function callFunction(name) {
  const { data, error } = await supabase.functions.invoke(name);
  if (error) {
    console.error(`Failed to call ${name}`, error);
    return { url: null, error };
  }
  return { url: data?.url || null, error: null };
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
