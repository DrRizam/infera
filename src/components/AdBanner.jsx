import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { AdMob, BannerAdPosition, BannerAdSize } from "@capacitor-community/admob";
import { useProfile } from "@/lib/ProfileContext";
import { isPremium } from "@/lib/subscription";

// Renders nothing itself — the banner is a native view AdMob draws over the
// WebView, not a DOM element. TOP_CENTER, not BOTTOM_CENTER: AppLayout has
// a fixed bottom tab-nav bar a bottom banner would sit on top of and cover.
export default function AdBanner() {
  const { profile } = useProfile();
  const free = Capacitor.isNativePlatform() && !isPremium(profile);

  useEffect(() => {
    if (!free) return;

    AdMob.showBanner({
      adId: import.meta.env.VITE_ADMOB_BANNER_ID,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.TOP_CENTER,
    }).catch((err) => console.error("AdMob banner failed to show", err));

    return () => {
      AdMob.removeBanner().catch(() => {});
    };
  }, [free]);

  return null;
}
