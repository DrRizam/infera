import { useMemo, useState } from "react";
import type { Drill, Profile, Verification } from "../types";
import { drills } from "../content";
import FlagControl from "../components/FlagControl";

// ── Evidence library ─────────────────────────────────────────────────────
// Lets a clinician audit the content instead of taking it on faith: every
// item, its citation, when the evidence was last reviewed, and a way to
// dispute it. This is the trust surface — a flashcard app has nothing like
// it, and for this audience it's the thing worth showing off.

type Filter = "all" | Verification;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "verified", label: "✓ Clinician-verified" },
  { id: "source-checked", label: "🔍 Source-checked" },
  { id: "unverified", label: "⚠️ Unverified" },
  { id: "contested", label: "⚖️ Contested" },
];

function LibraryItem({
  drill,
  profile,
  setProfile,
}: {
  drill: Drill;
  profile: Profile;
  setProfile: (p: Profile) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lib-item">
      <button className="lib-head" onClick={() => setOpen((o) => !o)}>
        <span className="lib-stem">{drill.stem}</span>
        <span className="lib-meta">
          {drill.verification !== "verified" && (
            <span className={`badge ${drill.verification}`}>
              {drill.verification === "contested"
                ? "⚖️"
                : drill.verification === "source-checked"
                  ? "🔍"
                  : "⚠️"}
            </span>
          )}
          <span className="lib-caret">{open ? "▲" : "▼"}</span>
        </span>
      </button>
      {open && (
        <div className="lib-body">
          <div className="lib-row">
            <b>Topic</b>
            <span>
              {drill.topic}
              {drill.category ? ` · ${drill.category}` : ""}
            </span>
          </div>
          <div className="lib-row">
            <b>Status</b>
            <span>
              {drill.verification === "verified"
                ? "✓ Checked against source by a clinician"
                : drill.verification === "source-checked"
                  ? "🔍 Figures re-checked against the cited source — clinician sign-off still pending"
                  : drill.verification === "contested"
                    ? "⚖️ Evidence genuinely disputed"
                    : "⚠️ Drafted from published sources, nothing checked yet"}
            </span>
          </div>
          <div className="lib-row">
            <b>Checked</b>
            <span>{drill.evidenceReviewedOn ?? "—"}</span>
          </div>
          <div className="lib-row">
            <b>Source</b>
            <span>{drill.citation}</span>
          </div>
          {drill.contestedNote && (
            <div className="lib-row">
              <b>Dispute</b>
              <span>{drill.contestedNote}</span>
            </div>
          )}
          <FlagControl
            drill={drill}
            profile={profile}
            setProfile={setProfile}
            label="⚑ Dispute this item"
          />
        </div>
      )}
    </div>
  );
}

export default function Library({
  profile,
  setProfile,
  onBack,
}: {
  profile: Profile;
  setProfile: (p: Profile) => void;
  onBack: () => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      all: drills.length,
      verified: 0,
      "source-checked": 0,
      unverified: 0,
      contested: 0,
    };
    for (const d of drills) c[d.verification]++;
    return c;
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return drills.filter(
      (d) =>
        (filter === "all" || d.verification === filter) &&
        (q === "" ||
          d.stem.toLowerCase().includes(q) ||
          d.topic.toLowerCase().includes(q) ||
          d.citation.toLowerCase().includes(q))
    );
  }, [filter, query]);

  return (
    <div className="app">
      <div className="topbar">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <div className="stats">
          <div className="chip xp">{drills.length} items</div>
        </div>
      </div>

      <div className="card">
        <h2>📚 Evidence library</h2>
        <p className="sub" style={{ marginTop: 6 }}>
          Every drill in the app with its source. Items marked <b>🔍 source-checked</b> have had
          their figures re-checked against the cited paper; <b>✓ clinician-verified</b> means a
          clinician has signed off on the teaching, which is a higher bar and set only by them. If
          something looks wrong, dispute it here.
        </p>
      </div>

      <div className="card">
        <div className="filter-row">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={`filter-btn ${filter === f.id ? "on" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label} <span>{counts[f.id]}</span>
            </button>
          ))}
        </div>
        <input
          className="lib-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search stems, topics, or citations…"
        />
        <p className="sub" style={{ marginTop: 10 }}>
          {shown.length} shown
        </p>
      </div>

      <div className="card">
        {shown.length === 0 ? (
          <p className="sub">Nothing matches that filter.</p>
        ) : (
          shown.map((d) => (
            <LibraryItem key={d.id} drill={d} profile={profile} setProfile={setProfile} />
          ))
        )}
      </div>
    </div>
  );
}
