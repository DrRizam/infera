import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Check, ClipboardCheck, X } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { isAdmin } from "@/lib/subscription";
import { fetchPendingSubmissions, reviewSubmission } from "@/lib/dailyGameStore";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminDailyGameReview() {
  useDocumentTitle("Case submissions (admin)");
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setRows(await fetchPendingSubmissions());
    setLoading(false);
  };

  useEffect(() => {
    if (!isAdmin(user)) return;
    load();
  }, [user]);

  const decide = async (id, decision) => {
    setBusyId(id);
    await reviewSubmission(id, decision);
    setBusyId(null);
    await load();
  };

  // admin_list_pending_daily_game_cases returns nothing for a non-admin
  // caller regardless (server-enforced via auth.email()) — this is just so
  // a non-admin never even sees the page shell.
  if (!isAdmin(user)) return <Navigate to="/settings" replace />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
          <ClipboardCheck className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Case submissions</h1>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing pending review.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card key={r.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2 text-base">
                  <span>{r.diagnosis}</span>
                  <span className="text-xs font-normal text-muted-foreground">{formatDate(r.created_at)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Submitted by <span className="font-semibold text-foreground">{r.submitted_by_name}</span>
                </p>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {[r.region, r.system, r.tissue, r.chronicity, r.mechanism].map((tag, i) => (
                    <span key={i} className="rounded-full bg-accent px-2 py-0.5 font-semibold text-primary">
                      {tag}
                    </span>
                  ))}
                </div>
                {r.synonyms?.length > 0 && (
                  <p className="text-xs text-muted-foreground">Synonyms: {r.synonyms.join(", ")}</p>
                )}
                <ol className="space-y-1 text-sm">
                  {r.clues.map((clue, i) => (
                    <li key={i}>
                      <span className="font-bold text-primary">{i + 1}.</span> {clue}
                    </li>
                  ))}
                </ol>
                <p className="text-sm text-muted-foreground">{r.explanation}</p>
                <div className="flex gap-2 pt-1">
                  <Button
                    className="flex-1 gap-1.5"
                    disabled={busyId === r.id}
                    onClick={() => decide(r.id, "approved")}
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-1.5"
                    disabled={busyId === r.id}
                    onClick={() => decide(r.id, "rejected")}
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
