import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PenSquare } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { validateCaseSubmission } from "@/lib/dailyGame";
import { fetchMySubmissions, submitCase } from "@/lib/dailyGameStore";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const TEXT_CLASS = "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring";
const TEXTAREA_CLASS = "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring";

const STATUS_BADGE = {
  pending: { label: "Pending review", className: "bg-amber-100 text-amber-800" },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Not used", className: "bg-muted text-muted-foreground" },
};

const EMPTY_FIELDS = {
  diagnosis: "",
  synonyms: "",
  region: "",
  system: "",
  tissue: "",
  chronicity: "",
  mechanism: "",
  explanation: "",
  clues: ["", "", "", "", "", ""],
};

export default function SubmitCase() {
  useDocumentTitle("Submit a case");
  const { user } = useAuth();
  const navigate = useNavigate();

  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [submissions, setSubmissions] = useState([]);

  const loadSubmissions = async () => setSubmissions(await fetchMySubmissions(user.id));

  useEffect(() => {
    loadSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const setField = (key, value) => setFields((f) => ({ ...f, [key]: value }));
  const setClue = (i, value) =>
    setFields((f) => ({ ...f, clues: f.clues.map((c, idx) => (idx === i ? value : c)) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotice("");
    const validationErrors = validateCaseSubmission(fields);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSaving(true);
    const { error } = await submitCase(user.id, {
      ...fields,
      synonyms: fields.synonyms.split(",").map((s) => s.trim()).filter(Boolean),
    });
    setSaving(false);
    if (error) {
      setNotice("Something went wrong sending that — try again?");
      return;
    }
    setFields(EMPTY_FIELDS);
    setErrors({});
    setNotice("Thanks — it's in the queue for review.");
    await loadSubmissions();
  };

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
          <PenSquare className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Submit a case</h1>
          <p className="text-sm text-muted-foreground">Suggest a diagnosis for Guess the Diagnosis. We review every one before it goes live.</p>
        </div>
      </div>

      <Button variant="ghost" size="sm" onClick={() => navigate("/daily-game")}>
        ← Back to today's case
      </Button>

      {submissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your submissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {submissions.map((s) => {
              const badge = STATUS_BADGE[s.status] || STATUS_BADGE.pending;
              return (
                <div key={s.id} className="flex items-center justify-between gap-2 rounded-xl border-2 border-border px-3 py-2">
                  <span className="truncate text-sm font-semibold">{s.diagnosis}</span>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", badge.className)}>{badge.label}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Case details</CardTitle>
          <CardDescription>Same shape as the launch cases — a diagnosis, five attribute tags, and 6 clues that reveal gradually.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Input id="diagnosis" placeholder="e.g. Lateral epicondylalgia" value={fields.diagnosis} onChange={(e) => setField("diagnosis", e.target.value)} />
              {errors.diagnosis && <p className="text-xs text-destructive">{errors.diagnosis}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="synonyms">Other names players might guess (comma-separated)</Label>
              <Input id="synonyms" placeholder="e.g. tennis elbow, lateral epicondylitis" value={fields.synonyms} onChange={(e) => setField("synonyms", e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                ["region", "Region", "e.g. elbow"],
                ["system", "System", "e.g. musculoskeletal"],
                ["tissue", "Tissue", "e.g. tendon"],
                ["chronicity", "Chronicity", "e.g. chronic"],
                ["mechanism", "Mechanism", "e.g. overuse"],
              ].map(([key, label, placeholder]) => (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={key}>{label}</Label>
                  <input id={key} className={TEXT_CLASS} placeholder={placeholder} value={fields[key]} onChange={(e) => setField(key, e.target.value)} />
                  {errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Clues (revealed one at a time, vaguest first)</Label>
              {fields.clues.map((clue, i) => (
                <textarea
                  key={i}
                  aria-label={`Clue ${i + 1}`}
                  placeholder={`Clue ${i + 1}`}
                  rows={2}
                  className={TEXTAREA_CLASS}
                  value={clue}
                  onChange={(e) => setClue(i, e.target.value)}
                />
              ))}
              {errors.clues && <p className="text-xs text-destructive">{errors.clues}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="explanation">Explanation (shown after the case is solved or lost)</Label>
              <textarea
                id="explanation"
                rows={3}
                className={TEXTAREA_CLASS}
                value={fields.explanation}
                onChange={(e) => setField("explanation", e.target.value)}
              />
              {errors.explanation && <p className="text-xs text-destructive">{errors.explanation}</p>}
            </div>

            {notice && <p className="text-sm text-primary">{notice}</p>}
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Sending…" : "Submit for review"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
