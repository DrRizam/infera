import { useState } from "react";
import type { Drill, Profile } from "../types";
import { todayISO } from "../engine/srs";

/**
 * Lets a tester report a problem with an item without leaving what they're
 * doing. Flags live in the profile and ride along in the JSON export, which
 * is how content feedback gets back to the author during the pilot.
 */
export default function FlagControl({
  drill,
  profile,
  setProfile,
  label = "⚑ Something wrong with this item?",
}: {
  drill: Drill;
  profile: Profile;
  setProfile: (p: Profile) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const already = profile.flags.some((f) => f.drillId === drill.id);

  if (already) return <div className="flag-btn flagged">⚑ Flagged — thanks, it's in your report</div>;

  if (!open)
    return (
      <button className="flag-btn" onClick={() => setOpen(true)}>
        {label}
      </button>
    );

  const submit = () => {
    setProfile({
      ...profile,
      flags: [...profile.flags, { drillId: drill.id, note: note.trim(), date: todayISO() }],
    });
    setOpen(false);
  };

  return (
    <div className="flag-box">
      <textarea
        autoFocus
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="What's wrong? Wrong answer, outdated number, unclear wording, bad citation…"
      />
      <div className="flag-actions">
        <button onClick={() => setOpen(false)}>Cancel</button>
        <button className="send" onClick={submit}>
          Send flag
        </button>
      </div>
    </div>
  );
}
