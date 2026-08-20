import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Flame, Trophy, Users } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { createGroup, fetchGroupStandings, fetchMyGroups, joinGroup } from "@/lib/dailyGameStore";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const RANK_STYLES = [
  "border-amber-400 bg-amber-100 text-amber-700",
  "border-slate-400 bg-slate-200 text-slate-700",
  "border-orange-400 bg-orange-100 text-orange-700",
];

export default function Groups() {
  useDocumentTitle("Groups");
  const { user } = useAuth();
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [formError, setFormError] = useState("");
  const [expandedGroupId, setExpandedGroupId] = useState(null);
  const [standings, setStandings] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);

  const loadGroups = async () => {
    setLoading(true);
    const g = await fetchMyGroups(user.id);
    setGroups(g);
    setLoading(false);
  };

  useEffect(() => {
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!newGroupName.trim()) return;
    const { error } = await createGroup(newGroupName.trim());
    if (error) {
      setFormError("Couldn't create that group — try again?");
      return;
    }
    setNewGroupName("");
    await loadGroups();
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!joinCode.trim()) return;
    const { error } = await joinGroup(joinCode.trim());
    if (error) {
      setFormError("No group found for that code.");
      return;
    }
    setJoinCode("");
    await loadGroups();
  };

  const toggleStandings = async (groupId) => {
    if (expandedGroupId === groupId) {
      setExpandedGroupId(null);
      return;
    }
    setExpandedGroupId(groupId);
    const rows = await fetchGroupStandings(groupId);
    setStandings(rows);
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // Clipboard access can fail — not worth surfacing as an error.
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Groups</h1>
          <p className="text-sm text-muted-foreground">Compare Guess the Diagnosis results with your clinic or team.</p>
        </div>
      </div>

      <Button variant="ghost" size="sm" onClick={() => navigate("/daily-game")}>
        ← Back to today's case
      </Button>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">You're not in any groups yet — create one or join with a code below.</p>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <Card key={g.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{g.name}</CardTitle>
                  <button
                    type="button"
                    onClick={() => copyCode(g.join_code)}
                    className="flex items-center gap-1 rounded-full border-2 border-border px-2 py-0.5 text-xs font-bold text-muted-foreground hover:border-primary"
                  >
                    <Copy className="h-3 w-3" />
                    {copiedCode === g.join_code ? "Copied!" : g.join_code}
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => toggleStandings(g.id)}>
                  <Trophy className="h-3.5 w-3.5" />
                  {expandedGroupId === g.id ? "Hide standings" : "View standings"}
                </Button>
                {expandedGroupId === g.id && (
                  <ol className="space-y-2">
                    {standings.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No one's played a daily case yet.</p>
                    ) : (
                      standings.map((row, i) => (
                        <li
                          key={row.user_id}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-sm",
                            row.user_id === user.id ? "border-primary bg-accent font-bold" : "border-border bg-card"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-extrabold",
                              RANK_STYLES[i] || "border-border text-muted-foreground"
                            )}
                          >
                            {i + 1}
                          </span>
                          <span className="flex-1 truncate">{row.display_name}</span>
                          {row.current_streak > 0 && (
                            <span className="flex items-center gap-0.5 text-xs font-bold text-orange-600">
                              <Flame className="h-3 w-3" />
                              {row.current_streak}
                            </span>
                          )}
                          <span className="font-bold text-primary">{row.total_score} pts</span>
                        </li>
                      ))
                    )}
                  </ol>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create a group</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex gap-2" onSubmit={handleCreate}>
            <Input placeholder="e.g. Riverside PT Clinic" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
            <Button type="submit" disabled={!newGroupName.trim()}>
              Create
            </Button>
          </form>
          {formError && <p className="mt-2 text-sm text-destructive">{formError}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Join with a code</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex gap-2" onSubmit={handleJoin}>
            <Input placeholder="8-character code" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} />
            <Button type="submit" variant="outline" disabled={!joinCode.trim()}>
              Join
            </Button>
          </form>
          {formError && <p className="mt-2 text-sm text-destructive">{formError}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
