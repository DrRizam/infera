import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { isAdmin } from "@/lib/subscription";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { Card, CardContent } from "@/components/ui/card";

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminFeedback() {
  useDocumentTitle("Feedback (admin)");
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin(user)) return;
    supabase
      .rpc("admin_list_feedback")
      .then(({ data, error }) => {
        if (error) console.error("Failed to load feedback", error);
        setRows(data || []);
        setLoading(false);
      });
  }, [user]);

  // admin_list_feedback returns nothing for a non-admin caller regardless
  // (server-enforced via auth.email()) — this is just so a non-admin never
  // even sees the page shell.
  if (!isAdmin(user)) return <Navigate to="/settings" replace />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
          <MessageSquare className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Feedback</h1>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No feedback submitted yet.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <Card key={r.id}>
              <CardContent className="space-y-1 p-4">
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{r.display_name}</span>
                  <span>{formatDate(r.created_at)}</span>
                </div>
                <p className="text-sm">{r.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
