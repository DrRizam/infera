import { useNavigate } from "react-router-dom";
import { useProfile } from "@/lib/ProfileContext";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { levelFromXp } from "@/lib/gamification";
import { resetProfile } from "@/lib/store";
import LevelRing from "@/components/LevelRing";
import MasteryBars from "@/components/MasteryBars";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Profile() {
  const { profile } = useProfile();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const lvl = levelFromXp(profile.xp || 0);

  const handleReset = async () => {
    if (!window.confirm("Reset all progress? This can't be undone.")) return;
    await resetProfile(user.id);
    window.location.reload();
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Delete your account? This permanently erases all your progress and cannot be undone.")) return;
    const { error } = await supabase.rpc("delete_own_account");
    if (error) {
      console.error("Failed to delete account", error);
      window.alert("Something went wrong deleting your account. Please try again.");
      return;
    }
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <LevelRing level={lvl.level} progress={lvl.progress} size={72} />
        <div>
          <h1 className="text-lg font-extrabold">{lvl.title}</h1>
          <p className="text-sm text-muted-foreground">Level {lvl.level}</p>
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
          <CardTitle>Mastery</CardTitle>
        </CardHeader>
        <CardContent>
          <MasteryBars mastery={profile.mastery} />
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">{user?.email}</p>

      <Button variant="outline" className="w-full" onClick={handleReset}>
        Reset all progress
      </Button>

      <Button variant="ghost" className="w-full" onClick={signOut}>
        Sign out
      </Button>

      <Button variant="destructive" className="w-full" onClick={handleDeleteAccount}>
        Delete account
      </Button>
    </div>
  );
}
