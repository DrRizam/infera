import { useNavigate } from "react-router-dom";
import { useProfile } from "@/lib/ProfileContext";
import { CASES } from "@/data/cases";
import { todayStr } from "@/lib/gamification";
import { MODULES } from "@/lib/modules";
import CasePath from "@/components/CasePath";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { profile } = useProfile();
  const navigate = useNavigate();

  const progressByCaseId = profile.caseProgress || {};
  const dueForReview = Object.values(progressByCaseId).filter(
    (p) => p.next_review_date && p.next_review_date <= todayStr()
  );
  const nextCase = CASES.find((c) => progressByCaseId[c.id]?.status !== "completed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Good {new Date().getHours() < 12 ? "morning" : "day"}</h1>
        <p className="text-sm text-muted-foreground">
          Daily goal: {profile.daily_xp ?? 0}/{profile.daily_goal ?? 50} XP
        </p>
      </div>

      {dueForReview.length > 0 && (
        <Card className="border-amber-400 bg-amber-50">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-amber-800">
              {dueForReview.length} case{dueForReview.length === 1 ? "" : "s"} due for review
            </p>
          </CardContent>
        </Card>
      )}

      {nextCase && (
        <Card>
          <CardHeader>
            <CardTitle>Continue learning</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">{nextCase.presenting_complaint}</p>
            <Button className="w-full" onClick={() => navigate(`/case/${nextCase.id}`)}>
              Start case
            </Button>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-3 font-bold">Specialty modules</h2>
        <div className="grid grid-cols-3 gap-3">
          {MODULES.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => navigate(`/module/${m.id}`)}
                className={`flex flex-col items-center gap-1 rounded-lg bg-gradient-to-br ${m.color} p-3 text-white`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-center text-[11px] font-bold leading-tight">{m.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-bold">Reasoning path</h2>
        <CasePath cases={CASES} progressByCaseId={progressByCaseId} onOpen={(id) => navigate(`/case/${id}`)} />
      </div>
    </div>
  );
}
