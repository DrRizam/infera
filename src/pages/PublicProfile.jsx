import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { levelFromXp } from "@/lib/gamification";
import { ACHIEVEMENTS } from "@/data/achievements";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import LevelRing from "@/components/LevelRing";
import AchievementBadge from "@/components/AchievementBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PublicProfile() {
  const { userId } = useParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState(null);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  useDocumentTitle(row?.display_name || "Profile");

  useEffect(() => {
    if (!userId || userId === user.id) return;
    let cancelled = false;
    setLoading(true);
    supabase
      .rpc("get_public_profile", { target_user_id: userId })
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error("Failed to load profile", error);
        setRow(data || null);
        setFollowing(!!data?.following);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, user.id]);

  // Visiting your own profile link — the full self-profile page (Profile.jsx)
  // has more (calibration, competency map, feedback form) than this public
  // view ever should, so send it there instead of duplicating a subset.
  if (userId === user.id) return <Navigate to="/profile" replace />;

  const toggleFollow = async () => {
    setFollowBusy(true);
    if (following) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("followee_id", userId);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, followee_id: userId });
    }
    setFollowing((f) => !f);
    setRow((prev) => (prev ? { ...prev, follower_count: prev.follower_count + (following ? -1 : 1) } : prev));
    setFollowBusy(false);
  };

  if (loading) {
    return <p className="px-4 py-8 text-center text-sm text-muted-foreground">Loading…</p>;
  }

  if (!row) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Couldn't find that profile.</p>
      </div>
    );
  }

  const lvl = levelFromXp(row.xp || 0);
  const earnedAchievements = ACHIEVEMENTS.filter((a) => (row[a.metric] ?? 0) >= a.goal);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <LevelRing level={lvl.level} progress={lvl.progress} size={72} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-extrabold">{row.display_name}</h1>
          <p className="text-sm text-muted-foreground">
            {lvl.title} · Level {lvl.level}
          </p>
        </div>
        <Button size="sm" variant={following ? "outline" : "default"} onClick={toggleFollow} disabled={followBusy}>
          {following ? "Following" : "Follow"}
        </Button>
      </div>

      <Card>
        <CardContent className="grid grid-cols-3 gap-4 p-4 text-center">
          <div>
            <div className="text-xl font-extrabold text-primary">{row.xp}</div>
            <div className="text-xs text-muted-foreground">Total XP</div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-primary">{row.streak_count}</div>
            <div className="text-xs text-muted-foreground">Day streak</div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-primary">{row.total_cases_completed}</div>
            <div className="text-xs text-muted-foreground">Cases completed</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex divide-x divide-border p-0">
          <div className="flex-1 py-3 text-center">
            <div className="text-lg font-extrabold">{row.follower_count}</div>
            <div className="text-xs text-muted-foreground">Followers</div>
          </div>
          <div className="flex-1 py-3 text-center">
            <div className="text-lg font-extrabold">{row.following_count}</div>
            <div className="text-xs text-muted-foreground">Following</div>
          </div>
        </CardContent>
      </Card>

      {earnedAchievements.length > 0 && (
        <div>
          <h2 className="mb-2 text-lg font-black tracking-tight">Achievements</h2>
          <div className="grid grid-cols-2 gap-3">
            {earnedAchievements.map((a) => (
              <AchievementBadge key={a.code} achievement={a} profile={row} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
