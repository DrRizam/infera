// ── Subscription persistence / Paddle entry points ───────────────────────
// Checkout is a client-side Paddle.js overlay (no server round-trip to
// start it — Paddle matches/creates the Paddle Customer by email itself).
// Managing an existing subscription still needs a server call, since
// creating a customer-portal session requires the secret API key.

import { initializePaddle } from "@paddle/paddle-js";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { supabase } from "@/lib/supabaseClient";

const PADDLE_PRICE_IDS = {
  monthly: "pri_01m0xcfck0taak681jtzk6bv3c",
  annual: "pri_01m0xcgd2gs5q4g0wzs8pb02s2",
};

// Display only — the actual charge, currency, and tax come from Paddle at
// checkout. Keep these in sync with the Paddle prices above; they're
// placeholders until confirmed.
export const PLAN_PRICING = {
  monthly: { label: "Monthly", amount: "$7.99", per: "/ month" },
  annual: { label: "Annual", amount: "$59.99", per: "/ year", note: "≈ $5/mo — 2 months free" },
};

async function openUrl(url) {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url });
  } else {
    window.location.href = url;
  }
}

async function callFunction(name, body) {
  const { data, error } = await supabase.functions.invoke(name, body ? { body } : undefined);
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

// initializePaddle() only needs to run once per page load — eventCallback
// is fixed at that point, so it's wired to call whichever "current"
// completion handler startCheckout most recently registered, rather than
// re-initializing Paddle.js per checkout.
let paddleLoadPromise = null;
let currentOnComplete = null;

function loadPaddle() {
  if (!paddleLoadPromise) {
    paddleLoadPromise = initializePaddle({
      token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN,
      environment: "production",
      eventCallback: (event) => {
        if (event.name === "checkout.completed") currentOnComplete?.();
      },
    });
  }
  return paddleLoadPromise;
}

/**
 * Opens the Paddle checkout overlay to start a new subscription. `plan` is
 * "monthly" (default) or "annual". `onComplete` fires once the customer
 * finishes paying (webhook may take a moment longer to flip
 * subscription_status — caller should still refresh the profile here for
 * immediate-feeling feedback).
 */
export async function startCheckout(plan, email, userId, onComplete) {
  const paddle = await loadPaddle();
  if (!paddle) return { error: "Checkout couldn't load — try again?" };

  currentOnComplete = onComplete;
  paddle.Checkout.open({
    items: [{ priceId: PADDLE_PRICE_IDS[plan] ?? PADDLE_PRICE_IDS.monthly, quantity: 1 }],
    customer: { email },
    customData: { supabase_user_id: userId },
  });
  return { error: null };
}

/** Opens the Paddle customer portal to manage/cancel an existing subscription — in the system browser on native, since Android apps can't host a checkout/portal flow in-webview per Play Store policy. */
export async function openBillingPortal() {
  const { url, error } = await callFunction("create-portal-session");
  if (url) await openUrl(url);
  return { error };
}
