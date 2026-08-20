// ── Profile persistence ──────────────────────────────────────────────────
// Backed by Supabase (`profiles.state`), one jsonb blob per user — same
// shape as before, just no longer stuck on one device. See schema.sql.

import { supabase } from "@/lib/supabaseClient";

const DEFAULT_PROFILE = {
  xp: 0,
  level: 1,
  streak_count: 0,
  longest_streak: 0,
  last_active_date: null,
  rest_shields: 1,
  practice_days: 0,
  daily_xp: 0,
  daily_goal: 50,
  daily_goal_date: null,
  /** disposition-confidence-vs-outcome tally, replaces a hard hearts/lives mechanic */
  calibration: { calibrated: 0, overconfident: 0, underconfident: 0 },
  mastery: {},
  /** "{module}:{exam|red_flag|differential|disposition|history}" -> EMA accuracy 0-100 */
  competency: {},
  total_cases_completed: 0,
  perfect_cases: 0,
  speed_rounds_played: 0,
  best_speed_score: 0,
  /** case id -> { status, accuracy, xp_earned, attempts, completed_date, next_review_date, last_played_date } */
  caseProgress: {},
  /** recall item id -> { last_result, attempts, next_review_date, last_played_date } */
  itemProgress: {},
  /** earned achievement codes */
  achievements: [],
  baseline_completed: false,
  /** self-reported at onboarding: "student" | "some" | "experienced" */
  experience_level: null,
  /** module ids; empty array means "Mixed" (no narrowing) */
  focus_modules: [],
  /** "{module}:{bossLevel}" -> true once that tree boss round is cleared */
  bossRoundsCompleted: {},
};

/** Loads (and lazily creates) the given auth user's profile row. */
export async function loadProfile(user) {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "state, display_name, clinic_name, country, role, role_other_label, phone, email_opt_in, " +
        "subscription_status, stripe_customer_id, stripe_subscription_id, subscription_current_period_end"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load profile, using a fresh in-memory default", error);
    return { ...DEFAULT_PROFILE };
  }

  if (data) {
    const { state, ...columns } = data;
    const merged = { ...DEFAULT_PROFILE, ...state, ...columns };
    // Migrate the old single-module field (pre multi-select) so an
    // existing user's prior choice isn't silently dropped.
    if (!state?.focus_modules && state?.focus_module) {
      merged.focus_modules = [state.focus_module];
    }
    return merged;
  }

  const fresh = { ...DEFAULT_PROFILE };
  const displayName = user.user_metadata?.full_name || null;
  const { error: insertError } = await supabase.from("profiles").insert({
    user_id: user.id,
    display_name: displayName,
    state: fresh,
  });
  if (insertError) console.error("Failed to create profile row", insertError);
  return {
    ...fresh,
    display_name: displayName,
    clinic_name: null,
    country: null,
    role: null,
    role_other_label: null,
    phone: null,
    email_opt_in: false,
    subscription_status: "free",
    stripe_customer_id: null,
    stripe_subscription_id: null,
    subscription_current_period_end: null,
  };
}

// display_name/clinic_name/country/role/role_other_label/phone/email_opt_in
// are real columns, not part of the jsonb `state` blob — pulled out here so
// they never get duplicated into it.
export async function saveProfile(userId, profile) {
  const {
    display_name,
    clinic_name,
    country,
    role,
    role_other_label,
    phone,
    email_opt_in,
    // Real columns too, but deliberately never written back here — the
    // Postgres column grant in schema.sql blocks the client from updating
    // them at all; only the Stripe webhook (service-role key) may. Pulling
    // them out just keeps a stale local copy from leaking into `state`.
    // eslint-disable-next-line no-unused-vars
    subscription_status,
    // eslint-disable-next-line no-unused-vars
    stripe_customer_id,
    // eslint-disable-next-line no-unused-vars
    stripe_subscription_id,
    // eslint-disable-next-line no-unused-vars
    subscription_current_period_end,
    ...state
  } = profile;
  const write = () =>
    supabase.from("profiles").upsert({
      user_id: userId,
      state,
      display_name,
      clinic_name,
      country,
      role,
      role_other_label,
      phone,
      email_opt_in,
      updated_at: new Date().toISOString(),
    });

  let { error } = await write();
  if (error) ({ error } = await write()); // one retry, network hiccups aren't worth a queue at this scale
  if (error) console.error("Failed to save profile", error);
}
