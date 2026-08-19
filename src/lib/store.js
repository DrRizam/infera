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
  hearts: 5,
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
  baseline_score: null,
  /** module id, or null for "Mixed" */
  focus_module: null,
};

/** Loads (and lazily creates) the given auth user's profile row. */
export async function loadProfile(user) {
  const { data, error } = await supabase
    .from("profiles")
    .select("state, display_name, clinic_name, country, role, role_other_label")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load profile, using a fresh in-memory default", error);
    return { ...DEFAULT_PROFILE };
  }

  if (data) {
    const { state, ...columns } = data;
    return { ...DEFAULT_PROFILE, ...state, ...columns };
  }

  const fresh = { ...DEFAULT_PROFILE };
  const displayName = user.user_metadata?.full_name || null;
  const { error: insertError } = await supabase.from("profiles").insert({
    user_id: user.id,
    display_name: displayName,
    state: fresh,
  });
  if (insertError) console.error("Failed to create profile row", insertError);
  return { ...fresh, display_name: displayName, clinic_name: null, country: null, role: null, role_other_label: null };
}

// display_name/clinic_name/country/role/role_other_label are real columns,
// not part of the jsonb `state` blob — pulled out here so they never get
// duplicated into it.
export async function saveProfile(userId, profile) {
  const { display_name, clinic_name, country, role, role_other_label, ...state } = profile;
  const write = () =>
    supabase.from("profiles").upsert({
      user_id: userId,
      state,
      display_name,
      clinic_name,
      country,
      role,
      role_other_label,
      updated_at: new Date().toISOString(),
    });

  let { error } = await write();
  if (error) ({ error } = await write()); // one retry, network hiccups aren't worth a queue at this scale
  if (error) console.error("Failed to save profile", error);
}
