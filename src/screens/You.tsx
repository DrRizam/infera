import { useRef } from "react";
import type { Profile } from "../types";
import { drills } from "../content";
import { todayISO } from "../engine/srs";
import {
  effectiveStreak,
  exportProfile,
  importProfile,
  levelFor,
  resetProfile,
  saveProfile,
} from "../engine/store";
import { SESSION_PRESETS, estimateMinutes } from "../config";

// ── You ──────────────────────────────────────────────────────────────────
// Everything that belongs to the learner rather than to the content: their
// commitment, how the app looks, their data, and what they've flagged. This
// is the "my account" surface — it needs no login, because there is no server
// to log in to. Sign-in only earns its place when sync exists.

export default function You({
  profile,
  setProfile,
  onResetDone,
}: {
  profile: Profile;
  setProfile: (p: Profile) => void;
  onResetDone: () => void;
}) {
  const lvl = levelFor(profile.xp);
  const streak = effectiveStreak(profile);
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

  const handleReset = () => {
    if (
      window.confirm(
        "Reset ALL progress? Streak, XP, reviews, and achievements will be wiped. This cannot be undone."
      )
    ) {
      resetProfile();
      onResetDone();
    }
  };

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          Clini<span>cian</span>
        </div>
      </div>

      <div className="card you-head">
        <div className="you-avatar">{lvl.level}</div>
        <div>
          <h2 style={{ marginBottom: 2 }}>Level {lvl.level}</h2>
          <div className="sub">
            🔥 {streak}-day streak · ⚡ {profile.xp} XP · {profile.sessionsCompleted} sessions
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>🎯 Daily goal</h2>
          <span className="sub">{profile.dailyGoal} drills</span>
        </div>
        <p className="sub">
          How much you want to do on a normal day. Reviews that fall due are always included first
          — a smaller goal just spreads them out.
        </p>
        <div className="goal-row">
          {SESSION_PRESETS.map((p) => (
            <button
              key={p.size}
              className={`goal-btn ${profile.dailyGoal === p.size ? "on" : ""}`}
              onClick={() => setProfile({ ...profile, dailyGoal: p.size })}
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
        <h2>🎨 Display</h2>
        <p className="sub" style={{ marginBottom: 4 }}>
          Theme
        </p>
        <div className="goal-row">
          {(["system", "light", "dark"] as const).map((t) => (
            <button
              key={t}
              className={`goal-btn ${profile.theme === t ? "on" : ""}`}
              onClick={() => setProfile({ ...profile, theme: t })}
            >
              {t === "system" ? "Auto" : t === "light" ? "Light" : "Dark"}
              <span>{t === "system" ? "match device" : t === "light" ? "always light" : "always dark"}</span>
            </button>
          ))}
        </div>
        <p className="sub" style={{ margin: "14px 0 4px" }}>
          Text size
        </p>
        <div className="goal-row">
          {(["normal", "large"] as const).map((t) => (
            <button
              key={t}
              className={`goal-btn ${profile.textSize === t ? "on" : ""}`}
              onClick={() => setProfile({ ...profile, textSize: t })}
            >
              {t === "normal" ? "Normal" : "Large"}
              <span>{t === "normal" ? "default" : "easier at night"}</span>
            </button>
          ))}
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
        <h2>💾 Your data</h2>
        <p className="sub" style={{ margin: "8px 0 12px" }}>
          Everything is stored on this device only — no account, no server. Back it up
          occasionally, especially before deleting the app or clearing browser data.
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

      <div className="card">
        <h2>ℹ️ About</h2>
        <p className="sub" style={{ marginTop: 8 }}>
          Clinician is a study and practice aid for musculoskeletal assessment. Every clinical
          value carries a citation, and anything not yet checked against its source by a clinician
          is marked <b>⚠️ unverified</b> in the app — trust the badge, not the confidence of the
          wording.
        </p>
        <p className="sub" style={{ marginTop: 10 }}>
          <b>This is not a diagnostic tool and not medical advice.</b> It does not replace clinical
          judgement, supervision, or your own reading of the primary literature. Scope of practice
          and terminology vary by country and licence.
        </p>
        <p className="sub" style={{ marginTop: 10 }}>
          {drills.length} drills in the library · Pilot build
        </p>
      </div>
    </div>
  );
}
