import { useId } from "react";

/**
 * Infera's mascot — a fusiform-muscle silhouette (pale tendon tips, red
 * belly, faint fiber lines) with a face, a stethoscope, and small flexed
 * limbs. `mood="curious"` (raised brow, closed smile) reads as "nothing
 * here yet, go take a look" for empty states; `mood="cheerful"` (default)
 * is the open grin for positive moments. Colors come from the --flex-*
 * custom properties in index.css, so it themes automatically in dark mode.
 * Gradient/filter ids are per-instance (useId) so multiple mascots can be
 * mounted on the same page without id collisions.
 */
export default function Mascot({ mood = "cheerful", className = "h-24 w-24" }) {
  const uid = useId();
  const body = `flexBody${uid}`;
  const limb = `flexLimb${uid}`;
  const metal = `flexMetal${uid}`;
  const soft = `flexSoft${uid}`;
  const curious = mood === "curious";

  return (
    <svg viewBox="-10 0 160 240" className={className} role="img" aria-hidden="true">
      <defs>
        <linearGradient id={body} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--flex-tendon-hi))" />
          <stop offset="13%" stopColor="hsl(var(--flex-tendon-lo))" />
          <stop offset="26%" stopColor="hsl(var(--flex-mid))" />
          <stop offset="50%" stopColor="hsl(var(--flex-hi))" />
          <stop offset="74%" stopColor="hsl(var(--flex-mid))" />
          <stop offset="87%" stopColor="hsl(var(--flex-tendon-lo))" />
          <stop offset="100%" stopColor="hsl(var(--flex-tendon-hi))" />
        </linearGradient>
        <linearGradient id={limb} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--flex-hi))" />
          <stop offset="100%" stopColor="hsl(var(--flex-mid))" />
        </linearGradient>
        <radialGradient id={metal} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0%" stopColor="hsl(var(--flex-metal-hi))" />
          <stop offset="100%" stopColor="hsl(var(--flex-metal-lo))" />
        </radialGradient>
        <filter id={soft} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* legs */}
      <rect x="50" y="202" width="17" height="28" rx="8.5" fill={`url(#${limb})`} />
      <rect x="73" y="202" width="17" height="28" rx="8.5" fill={`url(#${limb})`} />
      <ellipse cx="58.5" cy="232" rx="12" ry="7" fill={`url(#${limb})`} />
      <ellipse cx="81.5" cy="232" rx="12" ry="7" fill={`url(#${limb})`} />

      {/* arms, flexed */}
      <ellipse cx="20" cy="100" rx="13" ry="17" fill={`url(#${limb})`} />
      <rect x="-2" y="58" width="17" height="44" rx="8.5" fill={`url(#${limb})`} transform="rotate(-30 6 80)" />
      <circle cx="2" cy="54" r="14" fill={`url(#${limb})`} />
      <ellipse cx="120" cy="100" rx="13" ry="17" fill={`url(#${limb})`} />
      <rect x="125" y="58" width="17" height="44" rx="8.5" fill={`url(#${limb})`} transform="rotate(30 134 80)" />
      <circle cx="138" cy="54" r="14" fill={`url(#${limb})`} />

      {/* fusiform body */}
      <ellipse cx="70" cy="208" rx="15" ry="8" fill={`url(#${body})`} />
      <path
        d="M70,10 C85,10 92,30 90,45 C118,65 122,95 122,115 C122,140 118,165 96,182 C92,192 88,200 70,210 C52,200 48,192 44,182 C22,165 18,140 18,115 C18,95 22,65 50,45 C48,30 55,10 70,10 Z"
        fill={`url(#${body})`}
      />
      <path d="M50,52 C40,90 40,140 53,176" fill="none" stroke="hsl(var(--flex-lo))" strokeWidth="1.6" strokeLinecap="round" opacity="0.18" />
      <path d="M62,47 C55,90 55,140 61,184" fill="none" stroke="hsl(var(--flex-lo))" strokeWidth="1.6" strokeLinecap="round" opacity="0.18" />
      <path d="M78,47 C85,90 85,140 79,184" fill="none" stroke="hsl(var(--flex-lo))" strokeWidth="1.6" strokeLinecap="round" opacity="0.18" />
      <path d="M90,52 C100,90 100,140 87,176" fill="none" stroke="hsl(var(--flex-lo))" strokeWidth="1.6" strokeLinecap="round" opacity="0.18" />
      <ellipse cx="56" cy="80" rx="16" ry="22" fill="white" opacity="0.22" filter={`url(#${soft})`} transform="rotate(-12 56 80)" />

      {/* stethoscope */}
      <path d="M50,40 Q70,27 90,40" fill="none" stroke={`url(#${metal})`} strokeWidth="5" strokeLinecap="round" />
      <path d="M90,40 Q108,80 92,140 Q84,160 74,168" fill="none" stroke={`url(#${metal})`} strokeWidth="5" strokeLinecap="round" />
      <circle cx="72" cy="174" r="10" fill={`url(#${metal})`} />
      <circle cx="72" cy="174" r="4.6" fill="hsl(var(--flex-lo))" opacity="0.55" />

      {/* face */}
      <ellipse cx="48" cy="116" rx="7.5" ry="5" fill="hsl(0 0% 100% / 0.35)" />
      <ellipse cx="92" cy="116" rx="7.5" ry="5" fill="hsl(0 0% 100% / 0.35)" />
      <circle cx="58" cy="100" r="12" fill="white" />
      <circle cx="82" cy="100" r="12" fill="white" />
      <circle cx={curious ? 60 : 59} cy={curious ? 99 : 101} r="5.2" fill="hsl(var(--flex-lo))" />
      <circle cx={curious ? 84 : 83} cy={curious ? 99 : 101} r="5.2" fill="hsl(var(--flex-lo))" />
      <circle cx={curious ? 57.5 : 56.5} cy={curious ? 96.5 : 98.5} r="1.7" fill="white" />
      <circle cx={curious ? 81.5 : 80.5} cy={curious ? 96.5 : 98.5} r="1.7" fill="white" />

      {curious ? (
        <>
          <path d="M78,86 Q88,80 98,85" fill="none" stroke="hsl(var(--flex-lo))" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
          <path d="M60,130 Q70,126 80,130" fill="none" stroke="hsl(var(--flex-lo))" strokeWidth="4.5" strokeLinecap="round" />
        </>
      ) : (
        <path d="M58,128 Q70,138 82,128" fill="none" stroke="hsl(var(--flex-lo))" strokeWidth="4.5" strokeLinecap="round" />
      )}
    </svg>
  );
}
