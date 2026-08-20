import { createContext, useContext, useEffect, useState } from "react";
import { loadProfile, saveProfile } from "@/lib/store";
import { useAuth } from "@/lib/AuthContext";
import { ensureDailyFresh, todayStr } from "@/lib/gamification";

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
        const fresh = ensureDailyFresh(loaded, todayStr());
        if (fresh !== loaded) saveProfile(user.id, fresh);
        setProfileState(fresh);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

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
