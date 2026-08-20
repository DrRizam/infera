// ── Daily diagnosis game persistence ─────────────────────────────────────
// Thin wrapper around daily_game_cases/daily_game_attempts (see schema.sql).

import { supabase } from "@/lib/supabaseClient";

export async function fetchApprovedCases() {
  const { data, error } = await supabase
    .from("daily_game_cases")
    .select("id, case_number, diagnosis, synonyms, region, system, tissue, chronicity, mechanism, clues, explanation")
    .eq("status", "approved")
    .order("case_number");
  if (error) {
    console.error("Failed to load daily game cases", error);
    return [];
  }
  return data || [];
}

/** Loads the player's attempt row for this case, creating a fresh in-progress one if it doesn't exist yet. */
export async function fetchOrCreateAttempt(userId, caseId) {
  const { data: existing, error: selectError } = await supabase
    .from("daily_game_attempts")
    .select("*")
    .eq("user_id", userId)
    .eq("case_id", caseId)
    .maybeSingle();
  if (selectError) {
    console.error("Failed to load daily game attempt", selectError);
    return null;
  }
  if (existing) return existing;

  const { data: created, error: insertError } = await supabase
    .from("daily_game_attempts")
    .insert({ user_id: userId, case_id: caseId })
    .select()
    .single();
  if (insertError) {
    console.error("Failed to create daily game attempt", insertError);
    return null;
  }
  return created;
}

export async function saveAttempt(attemptId, { guesses, status, completed_at }) {
  const { error } = await supabase.from("daily_game_attempts").update({ guesses, status, completed_at }).eq("id", attemptId);
  if (error) console.error("Failed to save daily game attempt", error);
}
