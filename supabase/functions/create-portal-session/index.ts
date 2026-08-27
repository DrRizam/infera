// Authenticated Edge Function — returns a Paddle customer-portal URL for
// the signed-in user's existing Paddle subscription, so they can update
// their card or cancel without any custom billing UI in the app.

import { Paddle, Environment } from "npm:@paddle/paddle-node-sdk@3.10.0";
import { createClient } from "npm:@supabase/supabase-js@2.112.2";

const paddle = new Paddle(Deno.env.get("paddle_api_key")!, { environment: Environment.production });

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
      .select("paddle_customer_id, paddle_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profileRow?.paddle_customer_id || !profileRow?.paddle_subscription_id) {
      return new Response(JSON.stringify({ error: "No subscription on file" }), { status: 400, headers: corsHeaders });
    }

    const session = await paddle.customerPortalSessions.create(profileRow.paddle_customer_id, [
      profileRow.paddle_subscription_id,
    ]);

    return new Response(JSON.stringify({ url: session.urls.general.overview }), {
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
