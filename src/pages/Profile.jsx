import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { useProfile } from "@/lib/ProfileContext";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { levelFromXp } from "@/lib/gamification";
import { ACHIEVEMENTS } from "@/data/achievements";
import LevelRing from "@/components/LevelRing";
import AchievementBadge from "@/components/AchievementBadge";
import CompetencyMap from "@/components/CompetencyMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Profile() {
  const { profile } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const lvl = levelFromXp(profile.xp || 0);

  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [expanded, setExpanded] = useState(null); // "followers" | "following" | null
  const [list, setList] = useState([]);
  const [showAllAchievements, setShowAllAchievements] = useState(false);

  const [feedback, setFeedback] = useState("");
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState("");

  useEffect(() => {
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("followee_id", user.id)
      .then(({ count }) => setFollowerCount(count || 0));
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", user.id)
      .then(({ count }) => setFollowingCount(count || 0));
  }, [user.id]);

  const submitFeedback = async (e) => {
    e.preventDefault();
    const message = feedback.trim();
    if (!message) return;
    setFeedbackSending(true);
    setFeedbackNotice("");
    const { error } = await supabase.from("feedback").insert({ user_id: user.id, message });
    setFeedbackSending(false);
    if (error) {
      console.error("Failed to send feedback", error);
      setFeedbackNotice("Something went wrong sending that — try again?");
      return;
    }
    setFeedback("");
    setFeedbackNotice("Thanks — got it.");
  };

  const toggleExpanded = async (which) => {
    if (expanded === which) {
      setExpanded(null);
      return;
    }
    setExpanded(which);
    const { data, error } = await supabase.rpc(which === "followers" ? "list_followers" : "list_following");
    if (error) console.error(`Failed to load ${which}`, error);
    setList(data || []);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <LevelRing level={lvl.level} progress={lvl.progress} size={72} />
        <div>
          <h1 className="text-lg font-extrabold">{profile.display_name || "Unnamed"}</h1>
          <p className="text-sm text-muted-foreground">
            {lvl.title} · Level {lvl.level}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 p-4 text-center">
          <div>
            <div className="text-xl font-extrabold text-primary">{profile.xp ?? 0}</div>
            <div className="text-xs text-muted-foreground">Total XP</div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-primary">{profile.streak_count ?? 0}</div>
            <div className="text-xs text-muted-foreground">Day streak</div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-primary">{profile.total_cases_completed ?? 0}</div>
            <div className="text-xs text-muted-foreground">Cases completed</div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-primary">{profile.best_speed_score ?? 0}</div>
            <div className="text-xs text-muted-foreground">Speed best</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Competency map</CardTitle>
        </CardHeader>
        <CardContent>
          <CompetencyMap competency={profile.competency} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Calibration</CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const c = profile.calibration || { calibrated: 0, overconfident: 0, underconfident: 0 };
            const total = c.calibrated + c.overconfident + c.underconfident;
            if (!total) {
              return (
                <p className="text-sm text-muted-foreground">
                  Rate your confidence on a disposition call to start tracking how well it matches your accuracy.
                </p>
              );
            }
            const pct = Math.round((c.calibrated / total) * 100);
            return (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  How often your stated confidence matches whether you were actually right.
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-xl font-extrabold text-primary">{pct}%</div>
                    <div className="text-xs text-muted-foreground">Well-calibrated</div>
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-rose-600">{c.overconfident}</div>
                    <div className="text-xs text-muted-foreground">Overconfident</div>
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-amber-600">{c.underconfident}</div>
                    <div className="text-xs text-muted-foreground">Underconfident</div>
                  </div>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex divide-x divide-border p-0">
          <button className="flex-1 py-3 text-center" onClick={() => toggleExpanded("followers")}>
            <div className="text-lg font-extrabold">{followerCount}</div>
            <div className="text-xs text-muted-foreground">Followers</div>
          </button>
          <button className="flex-1 py-3 text-center" onClick={() => toggleExpanded("following")}>
            <div className="text-lg font-extrabold">{followingCount}</div>
            <div className="text-xs text-muted-foreground">Following</div>
          </button>
        </CardContent>
        {expanded && (
          <CardContent className="border-t border-border pt-3">
            {list.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nobody here yet.</p>
            ) : (
              <ul className="space-y-1">
                {list.map((p) => (
                  <li key={p.user_id} className="flex items-center justify-between text-sm">
                    <span>{p.display_name}</span>
                    <span className="font-bold text-primary">{p.xp} XP</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {(showAllAchievements ? ACHIEVEMENTS : ACHIEVEMENTS.slice(0, 4)).map((a) => (
              <AchievementBadge key={a.code} achievement={a} profile={profile} />
            ))}
          </div>
          {ACHIEVEMENTS.length > 4 && (
            <Button variant="ghost" className="w-full" onClick={() => setShowAllAchievements((s) => !s)}>
              {showAllAchievements ? "View less" : `View more (${ACHIEVEMENTS.length - 4})`}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={submitFeedback}>
            <p className="text-sm text-muted-foreground">Anything feel off, missing, or worth improving? Tell us directly.</p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What's on your mind?"
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {feedbackNotice && <p className="text-sm text-primary">{feedbackNotice}</p>}
            <Button type="submit" className="w-full" disabled={feedbackSending || !feedback.trim()}>
              {feedbackSending ? "Sending…" : "Send feedback"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full" onClick={() => navigate("/settings")}>
        Settings
      </Button>
    </div>
  );
}
