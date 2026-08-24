import { useEffect, useState } from "react";
import { Flame, HelpCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import cheerful from "@/assets/mascot/cheerful.png";
import curious from "@/assets/mascot/curious.png";
import determined from "@/assets/mascot/determined.png";
import celebrating from "@/assets/mascot/celebrating.png";
import encouraging from "@/assets/mascot/encouraging.png";
import thinking from "@/assets/mascot/thinking.png";
import tired from "@/assets/mascot/tired.png";
import concerned from "@/assets/mascot/concerned.png";

/**
 * Infera's mascot — Flex, a fusiform-muscle character. Illustrated PNGs
 * (extracted from the user-supplied reference sheet via
 * scripts/extract-mascot-emotions.mjs), not hand-drawn SVG, so these don't
 * recolor for dark mode the way the old flat-vector mascot did — each
 * pose carries its own shading/highlights already baked in, which reads
 * fine on both light and dark surfaces since the character itself (not
 * its background) is what's visible; the card background behind each pose
 * was removed at extraction time.
 *
 * Moods (which pose/PNG is shown):
 * - "cheerful" (default) — open grin, positive moments.
 * - "curious" — empty states: "nothing here yet, go take a look."
 * - "victorious" — alias for "celebrating": cleared a checkpoint, won the daily game.
 * - "battle" — alias for "determined": about to start a boss round.
 * - "encouraging", "thinking", "tired", "concerned" — available for future use.
 *
 * Animations (motion layered on top of whichever pose is shown — see
 * ONE_SHOT_MS/CONTINUOUS below for the full list). "idle" (default) is a
 * near-subconscious breathing bob that plays whenever nothing else is
 * happening; everything else is a one-shot reaction that auto-returns to
 * idle when it finishes. Since the mascot is a flat illustration (no
 * separate eye/limb layers to move independently), animation works at the
 * whole-pose level — transform (translate/scale/rotate) plus small
 * overlay icons (sparkles, a thinking-dots trio, a flame, a "?" bubble) —
 * rather than by moving individual facial features.
 */
const MOOD_IMAGES = {
  cheerful,
  curious,
  determined,
  celebrating,
  encouraging,
  thinking,
  tired,
  concerned,
  // Aliases kept so every existing call site (CasePath, Home, Onboarding,
  // CaseDebrief, OsceCheckpoint, DailyGame, etc.) keeps working unchanged.
  victorious: celebrating,
  battle: determined,
};

// One-shot presets play once and auto-revert to the idle loop after this
// many ms. "idle" and "thinking" aren't listed here — they loop for as
// long as the caller keeps that `animation` prop set.
const ONE_SHOT_MS = {
  success: 750,
  complete: 1000,
  incorrect: 500,
  streak: 600,
  unlock: 900,
  searching: 600,
  locked: 500,
};
const CONTINUOUS = new Set(["idle", "thinking"]);
const SPARKLE_ANIMATIONS = new Set(["success", "complete", "unlock"]);

function Overlay({ preset }) {
  if (preset === "thinking") {
    return (
      <span className="pointer-events-none absolute -right-1 -top-1 flex gap-0.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="flex-thinking-dot h-1.5 w-1.5 rounded-full bg-primary"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </span>
    );
  }
  if (preset === "searching" || preset === "locked") {
    return (
      <HelpCircle
        aria-hidden="true"
        className="flex-pop pointer-events-none absolute -right-1 -top-2 h-4 w-4 text-primary"
      />
    );
  }
  if (preset === "streak") {
    return (
      <Flame
        aria-hidden="true"
        className="flex-pop pointer-events-none absolute -right-1.5 -top-1.5 h-5 w-5 text-orange-500"
      />
    );
  }
  if (SPARKLE_ANIMATIONS.has(preset)) {
    const spots =
      preset === "complete"
        ? [
            { top: "-8%", left: "4%", delay: "0ms" },
            { top: "0%", right: "-2%", delay: "120ms" },
            { top: "40%", left: "-10%", delay: "220ms" },
            { top: "32%", right: "-8%", delay: "90ms" },
          ]
        : [
            { top: "-6%", left: "8%", delay: "0ms" },
            { top: "2%", right: "0%", delay: "140ms" },
          ];
    return (
      <>
        {spots.map((pos, i) => (
          <Sparkles
            key={i}
            aria-hidden="true"
            className="flex-pop pointer-events-none absolute h-3.5 w-3.5 text-amber-400"
            style={{ ...pos, animationDelay: pos.delay }}
          />
        ))}
      </>
    );
  }
  return null;
}

export default function Mascot({
  mood = "cheerful",
  className = "h-24 w-24",
  animation = "idle",
  animationKey,
  interactive = true,
}) {
  const src = MOOD_IMAGES[mood] || cheerful;
  const reducedMotion = useReducedMotion();
  const [activePreset, setActivePreset] = useState(CONTINUOUS.has(animation) ? animation : "idle");
  const [clicking, setClicking] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      setActivePreset(null);
      return;
    }
    if (CONTINUOUS.has(animation)) {
      setActivePreset(animation);
      return;
    }
    if (!animation || animation === "none") {
      setActivePreset("idle");
      return;
    }
    setActivePreset(animation);
    const duration = ONE_SHOT_MS[animation] ?? 600;
    const t = setTimeout(() => setActivePreset("idle"), duration);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animation, animationKey, reducedMotion]);

  const handleClick = () => {
    if (!interactive || reducedMotion) return;
    setClicking(true);
    setTimeout(() => setClicking(false), 400);
  };

  const motionClass = clicking ? "flex-anim-click" : activePreset ? `flex-anim-${activePreset}` : "";

  return (
    <div
      className={cn("relative", interactive && !reducedMotion && "flex-hover-scale cursor-pointer", className)}
      onClick={handleClick}
    >
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className={cn("h-full w-full object-contain", motionClass)}
      />
      {!reducedMotion && !clicking && <Overlay preset={activePreset} />}
    </div>
  );
}
