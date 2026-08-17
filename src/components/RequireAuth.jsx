import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/lib/ProfileContext";

function LoadingScreen() {
  return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
}

/** Redirects to /login if there's no signed-in user. */
export default function RequireAuth() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}

/** Nested inside RequireAuth: redirects to onboarding until the baseline quiz is done. */
export function RequireBaseline() {
  const { profile } = useProfile();
  const location = useLocation();

  if (!profile.baseline_completed && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
