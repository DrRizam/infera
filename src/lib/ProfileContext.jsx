import { createContext, useContext, useState } from "react";
import { loadProfile, saveProfile } from "@/lib/store";

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [profile, setProfileState] = useState(() => loadProfile());

  const setProfile = (update) => {
    setProfileState((prev) => {
      const next = typeof update === "function" ? update(prev) : update;
      saveProfile(next);
      return next;
    });
  };

  return <ProfileContext.Provider value={{ profile, setProfile }}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within a ProfileProvider");
  return ctx;
}
