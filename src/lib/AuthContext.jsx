import { createContext, useContext, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { supabase } from "@/lib/supabaseClient";

// Custom scheme registered on the Android intent-filter (see
// android/app/src/main/AndroidManifest.xml) so Supabase's OAuth redirect can
// hand control back to the packaged app instead of Capacitor's internal
// https://localhost origin.
const NATIVE_OAUTH_REDIRECT = "com.infera.app://auth-callback";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const sub = CapacitorApp.addListener("appUrlOpen", async ({ url }) => {
      if (!url.startsWith(NATIVE_OAUTH_REDIRECT)) return;
      await supabase.auth.exchangeCodeForSession(url);
      await Browser.close();
    });

    return () => {
      sub.then((handle) => handle.remove());
    };
  }, []);

  const signUp = (email, password, fullName) =>
    supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password });
  const signOut = () => supabase.auth.signOut();
  const signInWithGoogle = async () => {
    if (!Capacitor.isNativePlatform()) {
      // Back to /login, not "/" — the root is now the static marketing page
      // and has no JS to complete the OAuth exchange. This URL must be in the
      // Supabase project's Auth → URL Configuration redirect allowlist.
      return supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/login` },
      });
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: NATIVE_OAUTH_REDIRECT, skipBrowserRedirect: true },
    });
    if (error) return { data, error };
    await Browser.open({ url: data.url });
    return { data, error };
  };

  const value = { session, user: session?.user ?? null, loading, signUp, signIn, signOut, signInWithGoogle };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
