// Public endpoint — Stripe calls this directly, not through the Supabase
// client, so it must be deployed with --no-verify-jwt (Stripe doesn't send
// a Supabase JWT, it sends a Stripe-Signature header instead, verified
// against STRIPE_WEBHOOK_SECRET below). Writes subscription_status etc.
// via the service-role key — this is the ONE trusted writer for those
// columns; the client is blocked from writing them at all (see the column
// grant in schema.sql).

import Stripe from "npm:stripe@17.4.0";
import { createClient } from "npm:@supabase/supabase-js@2.112.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-12-18.acacia" });
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const adminClient = createClient(supabaseUrl, serviceRoleKey);

async function setSubscriptionStatus(customerId: string, fields: Record<string, unknown>) {
  const { error } = await adminClient.from("profiles").update(fields).eq("stripe_customer_id", customerId);
  if (error) console.error("Failed to update subscription status", error);
}

// v1 has no trial period configured in Stripe, so "trialing" is never
// expected here — anything outside active/past_due collapses to canceled.
// If a trial gets added later in Stripe, this needs a "trialing" branch.
function normalizeStatus(stripeStatus: string): "active" | "past_due" | "canceled" {
  if (stripeStatus === "active" || stripeStatus === "past_due") return stripeStatus;
  return "canceled";
}

Deno.serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature ?? "", webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.customer && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        await setSubscriptionStatus(session.customer as string, {
          subscription_status: normalizeStatus(subscription.status),
          stripe_subscription_id: subscription.id,
          subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        });
      }
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      await setSubscriptionStatus(subscription.customer as string, {
        subscription_status: normalizeStatus(subscription.status),
        stripe_subscription_id: subscription.id,
        subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      });
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await setSubscriptionStatus(subscription.customer as string, { subscription_status: "canceled" });
      break;
    }
    default:
      break;
  }

  return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
});
