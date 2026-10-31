import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import enSettings from "./i18n/en.settings";
import enGuests from "./i18n/en.guests";
import enAuth from "./i18n/en.auth";
import enDashboard from "./i18n/en.dashboard";
import enHarih from "./i18n/en.harih";
import enComponents from "./i18n/en.components";

/**
 * i18n sederhana berbasis kamus: kunci = teks Bahasa Indonesia asli.
 * - Mode "id": t() mengembalikan kunci apa adanya (dengan interpolasi {var}).
 * - Mode "en": t() mencari padanan di kamus; jika tidak ada, jatuh kembali
 *   ke teks Indonesia sehingga tidak pernah ada string kosong di UI.
 *
 * Di luar komponen React (mis. pesan galat di lib/), pakai tr(key, vars).
 */
const EN = {
  ...enSettings,
  ...enGuests,
  ...enAuth,
  ...enDashboard,
  ...enHarih,
  ...enComponents,
};

const STORAGE_KEY = "wp-lang";

let currentLang = "id";
try {
  currentLang = localStorage.getItem(STORAGE_KEY) || "id";
} catch {
  currentLang = "id";
}

export function getLang() {
  return currentLang;
}

function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (match, name) =>
    vars[name] !== undefined ? String(vars[name]) : match
  );
}

/** Terjemahan untuk konteks non-React. */
export function tr(key, vars) {
  const resolved = currentLang === "en" && EN[key] ? EN[key] : key;
  return interpolate(resolved, vars);
}

const LangContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(currentLang);

  useEffect(() => {
    currentLang = lang;
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* mode privat: pilihan bahasa tidak tersimpan, tidak fatal */
    }
  }, [lang]);

  const setLang = useCallback((next) => {
    if (next === "id" || next === "en") setLangState(next);
  }, []);

  const value = useMemo(
    () => ({ lang, setLang, t: (key, vars) => tr(key, vars) }),
    [lang, setLang]
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang harus dipakai di dalam <LanguageProvider>");
  return ctx;
}
