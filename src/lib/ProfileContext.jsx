import { createContext, useContext, useEffect, useState } from "react";
import { loadProfile, saveProfile } from "@/lib/store";
import { useAuth } from "@/lib/AuthContext";

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
        setProfileState(loaded);
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

  // No signed-in user yet (e.g. on /login) — render children without a profile;
  // every consumer of useProfile() only mounts behind RequireAuth, where a user
  // is guaranteed by the time this resolves.
  if (!user) return children;

  if (loading || !profile) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }

  return <ProfileContext.Provider value={{ profile, setProfile }}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within a ProfileProvider");
  return ctx;
}
