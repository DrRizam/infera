import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { AdMob } from "@capacitor-community/admob";

/**
 * Wraps the AdMob rewarded-video flow behind a small { ready, show } API.
 * `show()` resolves true if the user actually earned the reward (watched
 * through), false if they closed early or the ad failed — callers decide
 * what to grant. No-op (ready stays false) on web.
 */
export function useRewardedAd() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let cancelled = false;

    AdMob.prepareRewardVideoAd({ adId: import.meta.env.VITE_ADMOB_REWARDED_ID })
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((err) => console.error("Rewarded ad failed to prepare", err));

    return () => {
      cancelled = true;
    };
  }, []);

  const show = async () => {
    if (!ready) return false;
    setReady(false);
    try {
      await AdMob.showRewardVideoAd();
      return true;
    } catch (err) {
      console.error("Rewarded ad failed to show", err);
      return false;
    }
  };

  return { ready, show };
}
