import { createClient } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in your Supabase project's values."
  );
}

// On native Android, the default localStorage-backed session storage lives
// in the WebView's own storage partition, which the OS can and does clear
// under memory pressure (observed: signed out after simply closing and
// reopening the app) — a known Capacitor+Supabase gotcha. @capacitor/preferences
// persists via Android's SharedPreferences instead, which isn't subject to
// that eviction. Web keeps the default (plain localStorage, unaffected).
const nativeStorage = {
  getItem: async (key) => (await Preferences.get({ key })).value,
  setItem: async (key, value) => Preferences.set({ key, value }),
  removeItem: async (key) => Preferences.remove({ key }),
};

export const supabase = createClient(url || "https://placeholder.supabase.co", anonKey || "placeholder", {
  auth: Capacitor.isNativePlatform() ? { storage: nativeStorage } : undefined,
});
