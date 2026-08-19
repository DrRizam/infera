// ── Notifications ────────────────────────────────────────────────────────
// Thin wrapper around the `notifications` table (see schema.sql). Every
// notification is a real persisted row, not a derived/ephemeral banner.

import { supabase } from "@/lib/supabaseClient";

export async function fetchNotifications(userId, limit = 20) {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("Failed to load notifications", error);
    return [];
  }
  return data || [];
}

export async function createNotification(userId, { type = "general", title, body = null }) {
  const { error } = await supabase.from("notifications").insert({ user_id: userId, type, title, body });
  if (error) console.error("Failed to create notification", error);
}

export async function markNotificationRead(id) {
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  if (error) console.error("Failed to mark notification read", error);
}

export async function markAllNotificationsRead(userId) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) console.error("Failed to mark all notifications read", error);
}
