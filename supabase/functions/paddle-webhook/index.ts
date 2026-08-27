// Public endpoint — Paddle calls this directly, not through the Supabase
// client, so it must be deployed with --no-verify-jwt (Paddle doesn't send
// a Supabase JWT, it sends a Paddle-Signature header instead, verified
// against paddle_webhook_secret below). Writes subscription_status etc.
// via the service-role key — this is the ONE trusted writer for those
// columns; the client is blocked from writing them at all (see the column
// grant in schema.sql).

import { Paddle, Environment, EventName } from "npm:@paddle/paddle-node-sdk@3.10.0";
import { createClient } from "npm:@supabase/supabase-js@2.112.2";

const paddle = new Paddle(Deno.env.get("paddle_api_key")!, { environment: Environment.production });
const webhookSecret = Deno.env.get("paddle_webhook_secret")!;

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const adminClient = createClient(supabaseUrl, serviceRoleKey);

// On a user's first subscription there's no paddle_customer_id on their
// profile yet to match against — nothing pre-creates the Paddle customer
// server-side the way the old Stripe flow did, since checkout is now a
// client-side Paddle.js overlay (see subscriptionStore.js). Instead, the
// checkout call passes the Supabase user id as Paddle customData, and
// Paddle copies that custom data onto the subscription for its whole
// lifetime — so every event for that subscription, not just the first,
// carries it. Match on that when present; fall back to paddle_customer_id
// for the rare case it's missing (e.g. a subscription created directly in
// the Paddle dashboard rather than through our checkout).
async function setSubscriptionStatus(subscription: { customerId: string; customData: unknown }, fields: Record<string, unknown>) {
  const userId =
    subscription.customData && typeof subscription.customData === "object" && "supabase_user_id" in subscription.customData
      ? (subscription.customData as { supabase_user_id?: string }).supabase_user_id
      : undefined;

  const query = userId
    ? adminClient.from("profiles").update(fields).eq("user_id", userId)
    : adminClient.from("profiles").update(fields).eq("paddle_customer_id", subscription.customerId);

  const { error } = await query;
  if (error) console.error("Failed to update subscription status", error);
}

// v1 has no trial configured in Paddle, so "trialing" is never expected
// here — anything outside active/past_due (canceled, paused, trialing)
// collapses to canceled. If a trial gets added later, this needs its own
// branch.
function normalizeStatus(paddleStatus: string): "active" | "past_due" | "canceled" {
  if (paddleStatus === "active" || paddleStatus === "past_due") return paddleStatus;
  return "canceled";
}

Deno.serve(async (req) => {
  const signature = req.headers.get("paddle-signature");
  const body = await req.text();

  let event;
  try {
    event = await paddle.webhooks.unmarshal(body, webhookSecret, signature ?? "");
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.eventType) {
    // subscription.updated is Paddle's catch-all for every subsequent
    // state change (renewals, upgrades, pauses, resumes, cancellations) —
    // handling it plus .created covers the full lifecycle. The more
    // specific events (.canceled, .past_due, .paused) fire alongside
    // .updated for the same change, so handling them too is redundant but
    // harmless (same idempotent write).
    case EventName.SubscriptionCreated:
    case EventName.SubscriptionUpdated:
    case EventName.SubscriptionCanceled:
    case EventName.SubscriptionPastDue:
    case EventName.SubscriptionPaused:
    case EventName.SubscriptionResumed: {
      const subscription = event.data;
      await setSubscriptionStatus(subscription, {
        subscription_status: normalizeStatus(subscription.status),
        subscription_source: "paddle",
        paddle_customer_id: subscription.customerId,
        paddle_subscription_id: subscription.id,
        subscription_current_period_end: subscription.currentBillingPeriod?.endsAt ?? null,
      });
      break;
    }
    default:
      break;
  }

  return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
});
