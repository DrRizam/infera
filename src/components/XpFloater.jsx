import { useEffect, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

/**
 * A small "+N XP" indicator that floats up and fades out. Purely
 * presentational — position it with `className` inside a `relative`
 * parent (e.g. right next to a Mascot or an XP counter). Re-fires whenever
 * `trigger` changes, so a caller that awards XP repeatedly (e.g. one per
 * question) can bump a counter/timestamp each time to replay it.
 */
export default function XpFloater({ amount, trigger, className }) {
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!amount) return;
    setVisible(true);
    if (reducedMotion) return;
    const t = setTimeout(() => setVisible(false), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, amount]);

  if (!visible || !amount) return null;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute select-none whitespace-nowrap text-sm font-extrabold text-primary",
        !reducedMotion && "flex-xp-float",
        className
      )}
    >
      +{amount} XP
    </span>
  );
}
