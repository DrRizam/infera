import { NavLink, Outlet } from "react-router-dom";
import { Award, Brain, Flame, Home, LogOut, Shield, Trophy, User, Zap } from "lucide-react";
import LevelRing from "@/components/LevelRing";
import NotificationBell from "@/components/NotificationBell";
import { useProfile } from "@/lib/ProfileContext";
import { useAuth } from "@/lib/AuthContext";
import { levelFromXp, retentionStats } from "@/lib/gamification";
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
  const retention = retentionStats(profile);

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-24">
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
            <span
              className="status-pill text-orange-600"
              title={`${profile.streak_count ?? 0}-day streak`}
              aria-label={`${profile.streak_count ?? 0}-day streak`}
            >
              <Flame className="h-3.5 w-3.5" aria-hidden="true" />{profile.streak_count ?? 0}
            </span>
            {retention.percent != null && (
              <span
                className={cn("status-pill", retention.overdue > 0 ? "text-amber-600" : "text-emerald-600")}
                title={
                  retention.overdue > 0
                    ? `${retention.overdue} thing${retention.overdue === 1 ? "" : "s"} overdue for review — retention is dropping`
                    : "Everything you've learned is still fresh"
                }
                aria-label={`Retention ${retention.percent} percent${retention.overdue > 0 ? `, ${retention.overdue} overdue for review` : ""}`}
              >
                <Brain className="h-3.5 w-3.5" aria-hidden="true" />{retention.percent}%
              </span>
            )}
            <span
              className="status-pill hidden text-sky-600 sm:flex"
              title="Rest shields"
              aria-label={`${profile.rest_shields ?? 0} rest shields`}
            >
              <Shield className="h-3.5 w-3.5" aria-hidden="true" />{profile.rest_shields ?? 0}
            </span>
            <span
              className="status-pill hidden text-amber-600 sm:flex"
              title="Total XP"
              aria-label={`${profile.xp ?? 0} total XP`}
            >
              <Zap className="h-3.5 w-3.5" aria-hidden="true" />{profile.xp ?? 0}
            </span>
            <NotificationBell />
            <button type="button" title="Sign out" aria-label="Sign out" onClick={signOut} className="ml-1 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-border bg-card lg:bottom-6 lg:border-t-0 lg:bg-transparent">
        <div className="mx-auto flex max-w-6xl lg:w-fit lg:justify-center lg:gap-1 lg:rounded-2xl lg:border-2 lg:border-border lg:bg-card lg:px-2 lg:py-2 lg:shadow-elevated">
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
