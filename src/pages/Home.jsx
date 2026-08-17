import { useNavigate } from "react-router-dom";
import { useProfile } from "@/lib/ProfileContext";
import { CASES } from "@/data/cases";
import { todayStr } from "@/lib/gamification";
import { conditionOfTheDay } from "@/lib/modules";
import CasePath from "@/components/CasePath";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { profile } = useProfile();
  const navigate = useNavigate();

  const progressByCaseId = profile.caseProgress || {};
  const cotd = conditionOfTheDay(CASES, profile.focus_module, todayStr());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Good {new Date().getHours() < 12 ? "morning" : "day"}</h1>
        <p className="text-sm text-muted-foreground">
          Daily goal: {profile.daily_xp ?? 0}/{profile.daily_goal ?? 50} XP
        </p>
      </div>

      {cotd && (
        <Button variant="outline" className="w-full" onClick={() => navigate("/condition-of-the-day")}>
          Condition of the day
        </Button>
      )}

      <div>
        <h2 className="mb-3 font-bold">Reasoning path</h2>
        <CasePath cases={CASES} progressByCaseId={progressByCaseId} onOpen={(id) => navigate(`/case/${id}`)} />
      </div>
    </div>
  );
}
