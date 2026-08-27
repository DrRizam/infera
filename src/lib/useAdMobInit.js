import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { AdMob, AdmobConsentStatus } from "@capacitor-community/admob";

// Runs once, app-wide, regardless of who's signed in — ads aren't
// per-user state the way auth/profile are. No-op on web; Android only.
export function useAdMobInit() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    (async () => {
      // Minimal GDPR/UMP flow: ask Google what's required for this device's
      // region, show its own consent form only if it says to. No custom
      // consent UI — the plugin renders Google's standard form.
      try {
        const consent = await AdMob.requestConsentInfo();
        if (consent.isConsentFormAvailable && consent.status === AdmobConsentStatus.REQUIRED) {
          await AdMob.showConsentForm();
        }
      } catch (err) {
        console.error("AdMob consent flow failed", err);
      }
      await AdMob.initialize();
    })();
  }, []);
}
