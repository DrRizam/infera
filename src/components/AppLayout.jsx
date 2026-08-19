import { NavLink, Outlet } from "react-router-dom";
import { Award, Flame, Heart, Home, LogOut, Shield, Trophy, User, Zap } from "lucide-react";
import LevelRing from "@/components/LevelRing";
import { useProfile } from "@/lib/ProfileContext";
import { useAuth } from "@/lib/AuthContext";
import { levelFromXp } from "@/lib/gamification";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Learn", icon: Home },
  { to: "/explore", label: "Explore", icon: Trophy },
  { to: "/leaderboard", label: "Leaderboard", icon: Award },
  { to: "/profile", label: "Profile", icon: User },
];

export default function AppLayout() {
  const { profile } = useProfile();
  const { signOut } = useAuth();
  const lvl = levelFromXp(profile.xp || 0);

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <header className="sticky top-0 z-20 border-b-2 border-border bg-card px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-black text-primary-foreground shadow-sm">I</div>
            <span className="text-lg font-black tracking-tight">infera</span>
          </div>
          <LevelRing level={lvl.level} progress={lvl.progress} size={48} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <div className="truncate text-sm font-bold">{lvl.title}</div>
              <span className="hidden shrink-0 text-xs font-medium text-muted-foreground sm:block">{Math.round(lvl.progress * 100)}% to next level</span>
            </div>
            <div className="mt-1.5 h-2 w-full rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${lvl.progress * 100}%` }} />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 text-xs font-bold sm:gap-2">
            <span className="status-pill text-orange-600" title="Streak"><Flame className="h-3.5 w-3.5" />{profile.streak_count ?? 0}</span>
            <span className="status-pill text-rose-600" title="Hearts"><Heart className="h-3.5 w-3.5" />{profile.hearts ?? 5}</span>
            <span className="status-pill hidden text-sky-600 sm:flex" title="Rest shields"><Shield className="h-3.5 w-3.5" />{profile.rest_shields ?? 0}</span>
            <span className="status-pill hidden text-amber-600 sm:flex" title="Total XP"><Zap className="h-3.5 w-3.5" />{profile.xp ?? 0}</span>
            <button type="button" title="Sign out" aria-label="Sign out" onClick={signOut} className="ml-1 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-border bg-card lg:static lg:border-0 lg:bg-transparent">
        <div className="mx-auto flex max-w-6xl lg:justify-start lg:gap-2 lg:px-6 lg:py-3">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-bold transition-colors hover:bg-muted hover:text-foreground lg:flex-none lg:flex-row lg:gap-2 lg:px-3 lg:text-sm",
                  isActive ? "border-b-4 border-primary bg-accent text-primary lg:border-b-0" : "border-b-4 border-transparent text-muted-foreground"
                )
              }
            >
              <n.icon className="h-5 w-5" />
              {n.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
