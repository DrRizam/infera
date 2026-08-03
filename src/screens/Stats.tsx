import type { Profile, Topic } from "../types";
import { MODULE_OF_TOPIC } from "../types";
import { drills } from "../content";
import { effectiveStreak, exportProfile, importProfile, levelFor, resetProfile, saveProfile } from "../engine/store";
import { ACHIEVEMENTS } from "../engine/achievements";
import { todayISO } from "../engine/srs";
import { SESSION_PRESETS, estimateMinutes } from "../config";
import { useRef } from "react";

function nextSevenDays(): { iso: string; label: string }[] {
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    out.push({
      iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      label: i === 0 ? "Today" : i === 1 ? "Tmrw" : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()],
    });
  }
  return out;
}

export default function Stats({
  profile,
  onResetDone,
  onSetProfile,
}: {
  profile: Profile;
  onResetDone: () => void;
  onSetProfile: (p: Profile) => void;
}) {
  const lvl = levelFor(profile.xp);
  const streak = effectiveStreak(profile);

  // Review forecast: due counts over next 7 days (overdue counts as today)
  const days = nextSevenDays();
  const today = todayISO();
  const counts = days.map(({ iso }, i) =>
    Object.values(profile.srs).filter((r) =>
      i === 0 ? r.dueDate <= today : r.dueDate === iso
    ).length
  );
  const maxCount = Math.max(...counts, 1);

  // Accuracy by topic (lifetime)
  const topics = Object.entries(profile.topicAgg) as [Topic, { n: number; sum: number }][];
  topics.sort((a, b) => a[1].sum / a[1].n - b[1].sum / b[1].n);

  const unlockedSet = new Set(profile.achievements);

  const handleReset = () => {
    if (window.confirm("Reset ALL progress? Streak, XP, reviews, and achievements will be wiped. This cannot be undone.")) {
      resetProfile();
      onResetDone();
    }
  };

  const fileInput = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const blob = new Blob([exportProfile(profile)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clinician-backup-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const imported = importProfile(await file.text());
      if (
        window.confirm(
          `Restore backup from this file? Your current progress on this device will be replaced (level ${levelFor(imported.xp).level}, ${Object.keys(imported.srs).length} drills tracked).`
        )
      ) {
        saveProfile(imported);
        onResetDone();
      }
    } catch (e) {
      window.alert(`Could not restore backup: ${e instanceof Error ? e.message : e}`);
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          Clini<span>cian</span>
        </div>
        <div className="stats">
          <div className="chip flame">🔥 {streak}</div>
          {profile.shields > 0 && (
            <div className="chip shield" title="Banked rest days — a missed day spends one of these instead of your streak">
              🛡️ {profile.shields}
            </div>
          )}
          <div className="chip xp">⚡ {profile.xp} XP</div>
        </div>
      </div>

      <div className="card">
        <h2>📊 Your numbers</h2>
        <div className="score-row">
          <div className="score-box">
            <div className="val">{lvl.level}</div>
            <div className="lbl">level</div>
          </div>
          <div className="score-box">
            <div className="val">{profile.sessionsCompleted}</div>
            <div className="lbl">sessions</div>
          </div>
          <div className="score-box">
            <div className="val">{profile.caseResults.length}</div>
            <div className="lbl">cases</div>
          </div>
          <div className="score-box">
            <div className="val">{profile.speedBest}</div>
            <div className="lbl">speed best</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>📅 Review forecast</h2>
          <span className="sub">what spaced repetition has queued</span>
        </div>
        <div className="forecast">
          {days.map((d, i) => (
            <div className="forecast-col" key={d.iso}>
              <div className="forecast-n">{counts[i] || ""}</div>
              <div
                className={`forecast-bar ${i === 0 && counts[0] > 0 ? "due-now" : ""}`}
                style={{ height: `${Math.max((counts[i] / maxCount) * 64, 4)}px` }}
              />
              <div className="forecast-label">{d.label}</div>
            </div>
          ))}
        </div>
        <p className="sub" style={{ marginTop: 8 }}>
          {counts[0] > 0
            ? `${counts[0]} drill${counts[0] === 1 ? "" : "s"} due now — clearing reviews daily is what makes them stick.`
            : "Nothing due right now. Reviews accumulate as drills fall due."}
        </p>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>🎯 Accuracy by topic</h2>
          <span className="sub">lifetime</span>
        </div>
        {topics.length === 0 ? (
          <p className="sub">Answer some drills and your per-topic accuracy will appear here.</p>
        ) : (
          topics.map(([topic, agg]) => {
            const pct = Math.round((agg.sum / agg.n) * 100);
            return (
              <div className="mastery-row" key={topic}>
                <div className="mastery-label">
                  <span>
                    {topic}
                    <span className="sub" style={{ fontWeight: 600 }}> · {MODULE_OF_TOPIC[topic]}</span>
                  </span>
                  <span className="sub">
                    {pct}% · {agg.n} answered
                  </span>
                </div>
                <div className="mastery-track">
                  <div
                    className={`mastery-fill ${pct >= 75 ? "strong" : pct >= 50 ? "mid" : ""}`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
        {topics.length > 0 && (
          <p className="sub" style={{ marginTop: 8 }}>
            Your weakest topics sit at the top — the session builder already prioritizes them for review.
          </p>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>🏅 Achievements</h2>
          <span className="sub">
            {profile.achievements.length}/{ACHIEVEMENTS.length}
          </span>
        </div>
        <div className="ach-grid">
          {ACHIEVEMENTS.map((a) => {
            const on = unlockedSet.has(a.id);
            return (
              <div className={`ach ${on ? "on" : ""}`} key={a.id} title={a.description}>
                <div className="ach-icon">{on ? a.icon : "🔒"}</div>
                <div className="ach-title">{a.title}</div>
                <div className="ach-desc">{a.description}</div>
              </div>
            );
          })}
        </div>
      </div>

      {profile.flags.length > 0 && (
        <div className="card">
          <div className="card-head">
            <h2>⚑ Items you flagged</h2>
            <span className="sub">{profile.flags.length}</span>
          </div>
          <p className="sub" style={{ marginBottom: 10 }}>
            These ride along in your backup file — send it over and the content gets fixed.
          </p>
          {profile.flags.map((f) => (
            <div className="mastery-row" key={f.drillId + f.date}>
              <div className="mastery-label">
                <span>{drills.find((d) => d.id === f.drillId)?.topic ?? f.drillId}</span>
                <span className="sub">{f.date}</span>
              </div>
              {f.note && <div className="sub">{f.note}</div>}
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <h2>🎯 Daily goal</h2>
          <span className="sub">{profile.dailyGoal} drills</span>
        </div>
        <p className="sub">
          How much you want to do on a normal day. Reviews that fall due are always included
          first — a smaller goal just spreads them out.
        </p>
        <div className="goal-row">
          {SESSION_PRESETS.map((p) => (
            <button
              key={p.size}
              className={`goal-btn ${profile.dailyGoal === p.size ? "on" : ""}`}
              onClick={() => onSetProfile({ ...profile, dailyGoal: p.size })}
            >
              {p.label}
              <span>
                {p.size} · ~{estimateMinutes(p.size)} min
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>⚙️ Settings</h2>
        <p className="sub" style={{ margin: "8px 0 12px" }}>
          All progress is stored locally on this device. Back it up occasionally — especially
          before deleting the app or clearing browser data.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button className="big-btn teal" onClick={handleExport}>
            ⬇️ Back up my progress
          </button>
          <button className="big-btn ghost" onClick={() => fileInput.current?.click()}>
            ⬆️ Restore from backup
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            style={{ display: "none" }}
            onChange={(e) => handleImportFile(e.target.files?.[0])}
          />
          <button className="big-btn ghost danger" onClick={handleReset}>
            Reset all progress
          </button>
        </div>
      </div>

      <div className="footer-note">
        Clinician · Educational use only — not medical advice · Test metrics are representative
        literature values pending citation review
      </div>
    </div>
  );
}
