import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";

// Android's hardware/gesture back button does nothing by default in a
// Capacitor WebView — without this it either exits the app unexpectedly or
// feels broken, since there's no browser chrome to fall back on.
export function useAndroidBackButton() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const sub = CapacitorApp.addListener("backButton", () => {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        CapacitorApp.exitApp();
      }
    });

    return () => {
      sub.then((handle) => handle.remove());
    };
  }, [navigate]);
}
