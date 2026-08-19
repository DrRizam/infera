import { useEffect, useState } from "react";
import { Award, Search, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/lib/ProfileContext";
import { getModule } from "@/lib/modules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const RANK_STYLES = [
  "border-amber-400 bg-amber-100 text-amber-700",
  "border-slate-300 bg-slate-100 text-slate-600",
  "border-orange-400 bg-orange-100 text-orange-700",
];

// Weekly-windowed, cohort-scoped — no permanent global rank. See schema.sql.
export default function Leaderboard() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const focusModule = profile.focus_module;
  const [scope, setScope] = useState("week"); // "week" | "specialty" | "friends"
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (scope === "specialty" && !focusModule) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const call =
      scope === "week"
        ? supabase.rpc("leaderboard_weekly_global", { limit_n: 50 })
        : scope === "specialty"
        ? supabase.rpc("leaderboard_weekly_specialty", { module: focusModule, limit_n: 50 })
        : supabase.rpc("leaderboard_weekly_friends", { limit_n: 50 });
    call.then(({ data, error }) => {
      if (error) console.error("Failed to load leaderboard", error);
      setRows(data || []);
      setLoading(false);
    });
  }, [scope, focusModule]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const { data, error } = await supabase.rpc("search_users", { query, limit_n: 20 });
      if (error) console.error("Failed to search users", error);
      setResults(data || []);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const toggleFollow = async (targetId, currentlyFollowing) => {
    if (currentlyFollowing) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("followee_id", targetId);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, followee_id: targetId });
    }
    setResults((prev) => prev.map((r) => (r.user_id === targetId ? { ...r, following: !currentlyFollowing } : r)));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
          <Trophy className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Leaderboard</h1>
      </div>
      <p className="text-xs text-muted-foreground">Resets every week — this ranks recent practice, not a permanent lifetime score.</p>

      <div className="flex gap-2">
        <Button variant={scope === "week" ? "default" : "outline"} className="flex-1" onClick={() => setScope("week")}>
          This week
        </Button>
        <Button
          variant={scope === "specialty" ? "default" : "outline"}
          className="flex-1"
          disabled={!focusModule}
          title={focusModule ? undefined : "Pick a module on Home first"}
          onClick={() => setScope("specialty")}
        >
          My specialty
        </Button>
        <Button variant={scope === "friends" ? "default" : "outline"} className="flex-1" onClick={() => setScope("friends")}>
          Friends
        </Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Find people to follow"
          placeholder="Find people to follow…"
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {results.length > 0 && (
        <ul className="space-y-2">
          {results.map((r) => (
            <li
              key={r.user_id}
              className="flex items-center justify-between rounded-xl border-2 border-border bg-card px-4 py-3 text-sm"
            >
              <span className="font-medium">{r.display_name}</span>
              <Button size="sm" variant={r.following ? "outline" : "default"} onClick={() => toggleFollow(r.user_id, r.following)}>
                {r.following ? "Following" : "Follow"}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-10 text-center">
          <Award className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {scope === "friends"
              ? "Follow people to see them here."
              : scope === "specialty" && !focusModule
              ? "Pick a module on Home to see your specialty leaderboard."
              : scope === "specialty"
              ? `No one's practiced ${getModule(focusModule)?.name || "this specialty"} this week yet.`
              : "No one's practiced this week yet."}
          </p>
        </div>
      ) : (
        <ol className="space-y-2">
          {rows.map((r, i) => (
            <li
              key={r.user_id}
              className={cn(
                "flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-sm",
                r.user_id === user.id ? "border-primary bg-accent font-bold" : "border-border bg-card"
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
              <span className="flex-1 truncate">{r.display_name}</span>
              <span className="font-bold text-primary">{r.xp} XP</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
