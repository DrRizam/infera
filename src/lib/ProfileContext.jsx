import { createContext, useContext, useEffect, useState } from "react";
import { loadProfile, saveProfile } from "@/lib/store";
import { useAuth } from "@/lib/AuthContext";
import { ensureDailyFresh, todayStr } from "@/lib/gamification";
import { ensureDebriefPeriodFresh, ensureRecallPeriodFresh } from "@/lib/subscription";

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const { user } = useAuth();
  const [profile, setProfileState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfileState(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    loadProfile(user).then((loaded) => {
      if (!cancelled) {
        // Freshened once here so every page (Settings' remaining-count
        // display included) reads an up-to-date counter immediately,
        // rather than only after the next case/session that happens to
        // touch it.
        let fresh = ensureDailyFresh(loaded, todayStr());
        fresh = ensureDebriefPeriodFresh(fresh);
        fresh = ensureRecallPeriodFresh(fresh);
        if (fresh !== loaded) saveProfile(user.id, fresh);
        setProfileState(fresh);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
    // Keyed on the user's id, not the `user` object itself — Supabase
    // hands back a new session/user object on every token refresh
    // (including the one it fires when a tab regains focus), which would
    // otherwise re-trigger this fetch — and a "Loading…" flash — on every
    // tab switch even though the signed-in user hasn't actually changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const setProfile = (update) => {
    setProfileState((prev) => {
      const next = typeof update === "function" ? update(prev) : update;
      if (user) saveProfile(user.id, next); // optimistic: local state updates now, write happens in the background
      return next;
    });
  };

  // Re-fetches from Supabase rather than trusting local state — needed
  // right after a Stripe Checkout/Portal redirect back, since the webhook
  // (not this client) is what actually wrote subscription_status.
  const refreshProfile = async () => {
    if (!user) return;
    const loaded = await loadProfile(user);
    setProfileState(loaded);
  };

  // No signed-in user yet (e.g. on /login) — render children without a profile;
  // every consumer of useProfile() only mounts behind RequireAuth, where a user
  // is guaranteed by the time this resolves.
  if (!user) return children;

  if (loading || !profile) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }

  return <ProfileContext.Provider value={{ profile, setProfile, refreshProfile }}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within a ProfileProvider");
  return ctx;
}
