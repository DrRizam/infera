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

export async function saveAttempt(attemptId, { guesses, status, score, completed_at }) {
  const { error } = await supabase.from("daily_game_attempts").update({ guesses, status, score, completed_at }).eq("id", attemptId);
  if (error) console.error("Failed to save daily game attempt", error);
}

/** The player's streak row, or null if they've never completed a daily case. */
export async function fetchGameStats(userId) {
  const { data, error } = await supabase.from("daily_game_stats").select("*").eq("user_id", userId).maybeSingle();
  if (error) {
    console.error("Failed to load daily game stats", error);
    return null;
  }
  return data;
}

export async function saveGameStats(userId, stats) {
  const { error } = await supabase.from("daily_game_stats").upsert({ user_id: userId, ...stats, updated_at: new Date().toISOString() });
  if (error) console.error("Failed to save daily game stats", error);
}

/** Groups the current user belongs to, with the group's name/join_code. */
export async function fetchMyGroups(userId) {
  const { data, error } = await supabase
    .from("game_group_members")
    .select("group:game_groups(id, name, join_code, created_by)")
    .eq("user_id", userId);
  if (error) {
    console.error("Failed to load groups", error);
    return [];
  }
  return (data || []).map((row) => row.group).filter(Boolean);
}

export async function createGroup(name) {
  const { data, error } = await supabase.rpc("create_daily_game_group", { group_name: name }).single();
  if (error) {
    console.error("Failed to create group", error);
    return { data: null, error };
  }
  return { data, error: null };
}

export async function joinGroup(code) {
  const { data, error } = await supabase.rpc("join_daily_game_group", { code }).single();
  if (error) {
    console.error("Failed to join group", error);
    return { data: null, error };
  }
  return { data, error: null };
}

/** Submits a new case for review — always lands as status 'pending', unscheduled. */
export async function submitCase(userId, fields) {
  const { diagnosis, synonyms, region, system, tissue, chronicity, mechanism, clues, explanation } = fields;
  const { data, error } = await supabase
    .from("daily_game_cases")
    .insert({
      submitted_by: userId,
      diagnosis: diagnosis.trim(),
      synonyms: (synonyms || []).map((s) => s.trim()).filter(Boolean),
      region: region.trim(),
      system: system.trim(),
      tissue: tissue.trim(),
      chronicity: chronicity.trim(),
      mechanism: mechanism.trim(),
      clues: clues.map((c) => c.trim()),
      explanation: explanation.trim(),
    })
    .select()
    .single();
  if (error) {
    console.error("Failed to submit case", error);
    return { data: null, error };
  }
  return { data, error: null };
}

/** The current user's own submissions, whatever their review status. */
export async function fetchMySubmissions(userId) {
  const { data, error } = await supabase
    .from("daily_game_cases")
    .select("id, diagnosis, status, created_at")
    .eq("submitted_by", userId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Failed to load your submissions", error);
    return [];
  }
  return data || [];
}

/** Admin-only: every pending case submission, oldest first. RLS-bypassing RPC, gated server-side on auth.email(). */
export async function fetchPendingSubmissions() {
  const { data, error } = await supabase.rpc("admin_list_pending_daily_game_cases");
  if (error) {
    console.error("Failed to load pending submissions", error);
    return [];
  }
  return data || [];
}

/** Admin-only: approve (auto-assigns the next case_number) or reject a pending submission. */
export async function reviewSubmission(caseId, decision) {
  const { error } = await supabase.rpc("admin_review_daily_game_case", { case_id: caseId, decision });
  if (error) console.error("Failed to review submission", error);
  return { error };
}

export async function fetchGroupStandings(groupId) {
  const { data, error } = await supabase.rpc("daily_game_group_standings", { target_group_id: groupId });
  if (error) {
    console.error("Failed to load group standings", error);
    return [];
  }
  return data || [];
}
