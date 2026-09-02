import { useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { BETA_NOTICE, DISCLAIMER_SHORT } from "@/lib/beta";

const STORAGE_KEY = "infera:beta-notice-dismissed";

function isDismissed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** One-time (per device) closed-beta + disclaimer banner shown on Home. */
export default function BetaNotice() {
  const [hidden, setHidden] = useState(isDismissed);

  if (hidden) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Storage blocked (private mode) — just hide for this session.
    }
    setHidden(true);
  };

  return (
    <div className="relative rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 pr-10 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-2 top-2 rounded-lg p-1.5 text-amber-700 transition-colors hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-500/20"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="font-bold">Closed beta</p>
      <p className="mt-1">{BETA_NOTICE}</p>
      <p className="mt-2 text-xs text-amber-800 dark:text-amber-300/90">
        {DISCLAIMER_SHORT}{" "}
        <Link to="/profile" className="font-semibold underline">
          Send feedback
        </Link>
      </p>
    </div>
  );
}
