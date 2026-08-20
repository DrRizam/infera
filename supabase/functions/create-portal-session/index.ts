// Authenticated Edge Function — returns a Stripe Billing Portal URL for
// the signed-in user's existing Stripe Customer, so they can update their
// card, cancel, or resubscribe without any custom billing UI in the app.

import Stripe from "npm:stripe@17.4.0";
import { createClient } from "npm:@supabase/supabase-js@2.112.2";

// See create-checkout-session for why this is pinned here — the account
// requires 2025-03-31.basil or newer.
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-03-31.basil" });
const APP_URL = Deno.env.get("APP_URL") ?? "http://localhost:5173";

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

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: profileRow } = await adminClient
      .from("profiles")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profileRow?.stripe_customer_id) {
      return new Response(JSON.stringify({ error: "No subscription on file" }), { status: 400, headers: corsHeaders });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profileRow.stripe_customer_id,
      return_url: `${APP_URL}/settings`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-portal-session failed", err);
    return new Response(JSON.stringify({ error: "Failed to open billing portal" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
