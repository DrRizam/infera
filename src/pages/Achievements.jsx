import { ACHIEVEMENTS } from "@/data/achievements";
import { useProfile } from "@/lib/ProfileContext";
import AchievementBadge from "@/components/AchievementBadge";

export default function Achievements() {
  const { profile } = useProfile();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Achievements</h1>
      <div className="grid grid-cols-2 gap-3">
        {ACHIEVEMENTS.map((a) => (
          <AchievementBadge key={a.code} achievement={a} profile={profile} />
        ))}
      </div>
    </div>
  );
}
