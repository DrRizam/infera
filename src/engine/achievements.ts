import type { Achievement, Profile } from "../types";
import { drills } from "../content";
import { levelFor } from "./store";

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-steps", icon: "👣", title: "First steps", description: "Complete your first daily session" },
  { id: "case-solver", icon: "🩺", title: "Case solver", description: "Complete your first patient encounter" },
  { id: "streak-3", icon: "🔥", title: "Warming up", description: "Reach a 3-day streak" },
  { id: "streak-7", icon: "🌋", title: "On fire", description: "Reach a 7-day streak" },
  { id: "sharp-session", icon: "🎯", title: "Flawless", description: "Finish a session at 100% accuracy" },
  { id: "speedster", icon: "⚡", title: "Speedster", description: "Get 8+ correct in one speed round" },
  { id: "scholar", icon: "📚", title: "Scholar", description: "Earn 500 lifetime XP" },
  { id: "level-5", icon: "🏅", title: "Level 5", description: "Reach level 5" },
  { id: "cartographer", icon: "🗺️", title: "Cartographer", description: "See every drill in the library at least once" },
];

export interface AchievementContext {
  sessionAccuracy?: number; // 0–1, when a session just finished
  speedCorrect?: number;
}

/** Returns newly unlocked achievements (not yet in profile.achievements). */
export function checkAchievements(p: Profile, ctx: AchievementContext = {}): Achievement[] {
  const has = new Set(p.achievements);
  const earned: Achievement[] = [];
  const award = (id: string) => {
    if (has.has(id)) return;
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (a) earned.push(a);
  };

  if (p.sessionsCompleted >= 1) award("first-steps");
  if (p.caseResults.length >= 1) award("case-solver");
  if (p.streak >= 3) award("streak-3");
  if (p.streak >= 7) award("streak-7");
  if (ctx.sessionAccuracy !== undefined && ctx.sessionAccuracy >= 0.995) award("sharp-session");
  if ((ctx.speedCorrect ?? 0) >= 8 || p.speedBest >= 8) award("speedster");
  if (p.xp >= 500) award("scholar");
  if (levelFor(p.xp).level >= 5) award("level-5");
  if (drills.every((d) => p.srs[d.id])) award("cartographer");

  return earned;
}
