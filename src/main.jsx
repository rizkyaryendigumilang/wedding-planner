import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { LanguageProvider } from "./lib/i18n.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>
);

// Daftarkan Service Worker untuk kapabilitas PWA (Android, iOS Safari, Desktop)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker
      .register(swUrl)
      .then((reg) => {
        // Cek update di latar belakang
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                console.info("PWA: Versi baru telah tersedia.");
              }
            };
          }
        };
      })
      .catch((err) => {
        console.warn("PWA: Gagal mendaftarkan service worker:", err);
      });
  });
}

