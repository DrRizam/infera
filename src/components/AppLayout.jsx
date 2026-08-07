import { NavLink, Outlet } from "react-router-dom";
import { Award, Home, Trophy, User, Zap } from "lucide-react";
import LevelRing from "@/components/LevelRing";
import { useProfile } from "@/lib/ProfileContext";
import { levelFromXp } from "@/lib/gamification";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Learn", icon: Home },
  { to: "/modules", label: "Modules", icon: Trophy },
  { to: "/speed", label: "Speed", icon: Zap },
  { to: "/achievements", label: "Awards", icon: Award },
  { to: "/profile", label: "Profile", icon: User },
];

export default function AppLayout() {
  const { profile } = useProfile();
  const lvl = levelFromXp(profile.xp || 0);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <LevelRing level={lvl.level} progress={lvl.progress} size={48} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold">{lvl.title}</div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${lvl.progress * 100}%` }} />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-sm font-bold">
            <span title="Streak">🔥{profile.streak_count ?? 0}</span>
            <span title="Hearts">❤️{profile.hearts ?? 5}</span>
            <span title="Rest shields">🛡️{profile.rest_shields ?? 0}</span>
            <span title="Total XP">⚡{profile.xp ?? 0}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-4">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-card">
        <div className="mx-auto flex max-w-2xl">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold",
                  isActive ? "text-primary" : "text-muted-foreground"
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
