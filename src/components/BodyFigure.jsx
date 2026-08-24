import bodymap from "@/assets/bodymap/figure.png";
import { cn } from "@/lib/utils";

/**
 * Anatomical muscular-system illustration for Explore's body map —
 * replaces the earlier flat SVG figure. Supplied by the user
 * (Images/body map.png, gitignored raw source), cropped to its true
 * content bounding box via a one-off script (see the crop numbers below)
 * and already came with clean real transparency — verified against both
 * light and dark backgrounds before use, no color-keying needed.
 *
 * Anterior view only — every BODY_REGIONS hotspot in modules.js is
 * positioned against this image's own proportions (887×1515 after crop).
 * Landmark percentages were derived by scanning the source image for
 * contiguous non-transparent pixel segments per row (finds exact
 * body-part x-centers/edges) rather than eyeballed, then verified by
 * rendering the computed dots back onto the image before shipping.
 */
export default function BodyFigure({ className = "h-full w-full" }) {
  return (
    <img
      src={bodymap}
      alt="Front view of a human body, used to browse conditions by region"
      className={cn("object-contain", className)}
    />
  );
}
