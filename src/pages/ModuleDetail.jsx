import { useNavigate, useParams } from "react-router-dom";
import { CASES } from "@/data/cases";
import { useProfile } from "@/lib/ProfileContext";
import { dailyHardCase, getModule } from "@/lib/modules";
import { todayStr } from "@/lib/gamification";
import CasePath from "@/components/CasePath";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ModuleDetail() {
  const { id } = useParams();
  const module = getModule(id);
  const { profile } = useProfile();
  const navigate = useNavigate();

  if (!module) return <p>Module not found.</p>;

  const moduleCases = CASES.filter((c) => c.module === id);
  const progressByCaseId = profile.caseProgress || {};
  const hard = dailyHardCase(moduleCases, id, todayStr());
  const Icon = module.icon;

  return (
    <div className="space-y-4">
      <div className={`rounded-lg bg-gradient-to-br ${module.color} p-4 text-white`}>
        <Icon className="mb-2 h-8 w-8" />
        <h1 className="text-lg font-extrabold">{module.name}</h1>
        <p className="text-sm opacity-90">{module.blurb}</p>
      </div>

      {hard && (
        <Card>
          <CardHeader>
            <CardTitle>🔥 Daily hard case</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">{hard.presenting_complaint}</p>
            <Button className="w-full" onClick={() => navigate(`/case/${hard.id}?daily=1`)}>
              Start (+50% XP)
            </Button>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-3 font-bold">Case path</h2>
        {moduleCases.length === 0 ? (
          <p className="text-sm text-muted-foreground">No cases in this module yet.</p>
        ) : (
          <CasePath
            cases={moduleCases}
            progressByCaseId={progressByCaseId}
            experienceLevel={profile.experience_level}
            onOpen={(caseId) => navigate(`/case/${caseId}`)}
          />
        )}
      </div>
    </div>
  );
}
