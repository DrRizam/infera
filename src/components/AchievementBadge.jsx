import { Award, Flame, Footprints, GraduationCap, Star, Stethoscope, TrendingUp, Trophy, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { achievementProgress, isAchievementEarned } from "@/lib/gamification";
import { cn } from "@/lib/utils";

// Only the icons the achievement data actually names — a namespace import
// (`import * as Icons`) pulls in the entire lucide set (~750 KB).
const ICONS = { Award, Flame, Footprints, GraduationCap, Star, Stethoscope, TrendingUp, Trophy, Zap };

// Full literal strings — see the same rule in lib/modules.js.
const TIER_STYLES = {
  bronze: "from-amber-700 to-amber-500",
  silver: "from-slate-400 to-slate-300",
  gold: "from-yellow-500 to-amber-400",
  platinum: "from-cyan-400 to-indigo-400",
};

export default function AchievementBadge({ achievement, profile }) {
  const earned = isAchievementEarned(achievement, profile);
  const progress = achievementProgress(achievement, profile);
  const Icon = ICONS[achievement.icon] || Award;

  return (
    <div className={cn("rounded-lg border border-border p-4 text-center", !earned && "opacity-60")}>
      <div
        className={cn(
          "mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br text-white",
          TIER_STYLES[achievement.tier] || TIER_STYLES.bronze
        )}
      >
        <Icon className="h-7 w-7" />
      </div>
      <div className="text-sm font-bold">{achievement.name}</div>
      <div className="mt-1 text-xs text-muted-foreground">{achievement.description}</div>
      {!earned && <Progress value={progress * 100} className="mt-3 h-1.5" />}
    </div>
  );
}
