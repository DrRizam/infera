/**
 * A flat, proportioned anatomy-chart figure for Explore's body map —
 * replaces a grayscale-tinted photo. Built the same way Mascot.jsx builds
 * limbs: a single tapered torso path plus graduated, decreasing-size
 * ellipses per limb so each one narrows naturally at the joint instead of
 * reading as a uniform-width block. Deliberately flat, single-tone shapes
 * with no gradient (unlike Flex) — a reference diagram should read calmly
 * in the background, not compete with Flex as its own character. Colors
 * come from --primary, so it themes automatically in dark mode.
 *
 * Anterior view only — every BODY_REGIONS hotspot in modules.js, spine
 * included, is positioned against this one figure at its natural
 * proportions (viewBox 0 0 300 640).
 */
export default function BodyFigure({ className = "h-full w-full" }) {
  return (
    <svg
      viewBox="0 0 300 640"
      className={className}
      role="img"
      aria-label="Front view of a human body, used to browse conditions by region"
    >
      <ellipse cx="150" cy="618" rx="115" ry="12" fill="hsl(var(--foreground) / 0.08)" />

      {/* left leg: thigh -> knee -> shank -> ankle -> foot */}
      <ellipse cx="120" cy="340" rx="32" ry="55" fill="hsl(var(--primary) / 0.85)" />
      <ellipse cx="122" cy="445" rx="24" ry="26" fill="hsl(var(--primary) / 0.85)" />
      <ellipse cx="123" cy="510" rx="20" ry="45" fill="hsl(var(--primary) / 0.85)" />
      <ellipse cx="124" cy="572" rx="15" ry="14" fill="hsl(var(--primary) / 0.85)" />
      <ellipse cx="131" cy="594" rx="29" ry="14" fill="hsl(var(--primary) / 0.85)" />

      {/* right leg */}
      <ellipse cx="180" cy="340" rx="32" ry="55" fill="hsl(var(--primary) / 0.85)" />
      <ellipse cx="178" cy="445" rx="24" ry="26" fill="hsl(var(--primary) / 0.85)" />
      <ellipse cx="177" cy="510" rx="20" ry="45" fill="hsl(var(--primary) / 0.85)" />
      <ellipse cx="176" cy="572" rx="15" ry="14" fill="hsl(var(--primary) / 0.85)" />
      <ellipse cx="169" cy="594" rx="29" ry="14" fill="hsl(var(--primary) / 0.85)" />

      {/* left arm: shoulder cap -> upper arm -> forearm -> wrist -> hand */}
      <ellipse cx="55" cy="112" rx="27" ry="23" fill="hsl(var(--primary) / 0.85)" />
      <ellipse cx="41" cy="168" rx="22" ry="40" fill="hsl(var(--primary) / 0.85)" />
      <ellipse cx="37" cy="242" rx="19" ry="42" fill="hsl(var(--primary) / 0.85)" />
      <ellipse cx="39" cy="296" rx="15" ry="18" fill="hsl(var(--primary) / 0.85)" />
      <ellipse cx="42" cy="326" rx="18" ry="24" fill="hsl(var(--primary) / 0.85)" />

      {/* right arm */}
      <ellipse cx="245" cy="112" rx="27" ry="23" fill="hsl(var(--primary) / 0.85)" />
      <ellipse cx="259" cy="168" rx="22" ry="40" fill="hsl(var(--primary) / 0.85)" />
      <ellipse cx="263" cy="242" rx="19" ry="42" fill="hsl(var(--primary) / 0.85)" />
      <ellipse cx="261" cy="296" rx="15" ry="18" fill="hsl(var(--primary) / 0.85)" />
      <ellipse cx="258" cy="326" rx="18" ry="24" fill="hsl(var(--primary) / 0.85)" />

      {/* torso: one tapered silhouette, shoulders -> waist -> hips */}
      <path
        d="M76,96 C70,150 92,202 113,236 C104,256 100,280 102,300 L198,300 C200,280 196,256 187,236 C208,202 230,150 224,96 C192,78 108,78 76,96 Z"
        fill="hsl(var(--primary) / 0.85)"
      />
      <path
        d="M110,120 C104,155 106,185 116,210"
        fill="none"
        stroke="white"
        strokeWidth="14"
        strokeLinecap="round"
        opacity="0.1"
      />

      {/* neck + head */}
      <rect x="134" y="74" width="32" height="24" rx="8" fill="hsl(var(--primary) / 0.85)" />
      <circle cx="150" cy="46" r="32" fill="hsl(var(--primary) / 0.85)" />
    </svg>
  );
}
