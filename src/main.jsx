import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Daftarkan Service Worker untuk kapabilitas PWA (Android, iOS Safari, Desktop)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
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

