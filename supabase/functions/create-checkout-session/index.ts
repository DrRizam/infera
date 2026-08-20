// Authenticated Edge Function — the client calls this via
// supabase.functions.invoke("create-checkout-session"), which forwards the
// caller's Supabase JWT automatically. Creates (or reuses) a Stripe
// Customer for the signed-in user and returns a Checkout Session URL to
// redirect to. No Stripe secret key ever reaches the browser.

import Stripe from "npm:stripe@17.4.0";
import { createClient } from "npm:@supabase/supabase-js@2.112.2";

// This Stripe account requires "Managed Payments," which isn't supported
// on API versions older than 2025-03-31.basil — Checkout Session creation
// fails with a 400 on the pinned default otherwise.
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-03-31.basil" });
const PRICE_ID = Deno.env.get("STRIPE_PRICE_ID")!;
const APP_URL = Deno.env.get("APP_URL") ?? "http://localhost:5173";

// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are
// auto-injected into every Edge Function by Supabase — no need to set them
// as custom secrets.
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    // Service-role client: writing stripe_customer_id is exactly the kind
    // of subscription-column write the client itself is blocked from
    // making (see the column grant in schema.sql) — only this trusted
    // server-side path is allowed to do it.
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: profileRow } = await adminClient
      .from("profiles")
      .select("stripe_customer_id, display_name")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = profileRow?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profileRow?.display_name || undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await adminClient.from("profiles").update({ stripe_customer_id: customerId }).eq("user_id", user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      success_url: `${APP_URL}/settings?checkout=success`,
      cancel_url: `${APP_URL}/settings`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-checkout-session failed", err);
    return new Response(JSON.stringify({ error: "Failed to start checkout" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
