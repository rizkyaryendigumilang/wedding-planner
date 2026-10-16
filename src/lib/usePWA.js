import { useState, useEffect, useCallback } from "react";

/**
 * Hook untuk memantau status instalasi PWA dan memfasilitasi install di Android, iOS, tablet, & desktop.
 */
export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(
      window.matchMedia?.("(display-mode: standalone)").matches ||
      window.navigator.standalone === true ||
      document.referrer?.includes("android-app://")
    );
  });

  const [isIOS] = useState(() => {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua) && !window.MSStream;
  });

  const [isAndroid] = useState(() => {
    if (typeof window === "undefined") return false;
    return /android/i.test(window.navigator.userAgent);
  });

  const [isInApp] = useState(() => {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent.toLowerCase();
    return /fban|fbav|instagram|line|micromessenger|whatsapp|tiktok/i.test(ua);
  });

  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem("wedding_pwa_dismissed") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // Tangkap event beforeinstallprompt untuk Android / Chromium / Edge / Desktop
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Deteksi jika user berhasil menginstal
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const dismissPrompt = useCallback(() => {
    setDismissed(true);
    try {
      sessionStorage.setItem("wedding_pwa_dismissed", "1");
    } catch {
      // ignore
    }
  }, []);

  const promptInstall = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setIsStandalone(true);
      }
      return outcome;
    }
    return null;
  }, [deferredPrompt]);

  return {
    isStandalone,
    isIOS,
    isAndroid,
    isInApp,
    canPrompt: Boolean(deferredPrompt),
    dismissed,
    dismissPrompt,
    promptInstall,
  };
}
