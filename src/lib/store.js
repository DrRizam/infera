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
  total_cases_completed: 0,
  perfect_cases: 0,
  speed_rounds_played: 0,
  best_speed_score: 0,
  /** case id -> { status, accuracy, xp_earned, attempts, completed_date, next_review_date, last_played_date } */
  caseProgress: {},
  /** earned achievement codes */
  achievements: [],
  baseline_completed: false,
  baseline_score: null,
  /** module id, or null for "Mixed" */
  focus_module: null,
};

/** Loads (and lazily creates) the given auth user's profile row. */
export async function loadProfile(user) {
  const { data, error } = await supabase.from("profiles").select("state").eq("user_id", user.id).maybeSingle();

  if (error) {
    console.error("Failed to load profile, using a fresh in-memory default", error);
    return { ...DEFAULT_PROFILE };
  }

  if (data) return { ...DEFAULT_PROFILE, ...data.state };

  const fresh = { ...DEFAULT_PROFILE };
  const { error: insertError } = await supabase.from("profiles").insert({
    user_id: user.id,
    display_name: user.user_metadata?.full_name || null,
    state: fresh,
  });
  if (insertError) console.error("Failed to create profile row", insertError);
  return fresh;
}

export async function saveProfile(userId, profile) {
  const write = () =>
    supabase.from("profiles").upsert({ user_id: userId, state: profile, updated_at: new Date().toISOString() });

  let { error } = await write();
  if (error) ({ error } = await write()); // one retry, network hiccups aren't worth a queue at this scale
  if (error) console.error("Failed to save profile", error);
}

export async function resetProfile(userId) {
  await saveProfile(userId, { ...DEFAULT_PROFILE });
}
