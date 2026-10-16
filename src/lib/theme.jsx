import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Theme
 * ---------------------------------------------------------------------------
 * Pilihan tema disimpan di localStorage dan dipasang sebagai class `dark` pada
 * <html>. Bila pengguna belum pernah memilih, kita ikut setelan sistem.
 */
const ThemeContext = createContext(null);
const STORAGE_KEY = "wp.theme";

function readStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* localStorage bisa diblokir; jatuh ke setelan sistem. */
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme harus dipakai di dalam <ThemeProvider>");
  return ctx;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readStoredTheme);
  const [followsSystem, setFollowsSystem] = useState(() => {
    try {
      return !localStorage.getItem(STORAGE_KEY);
    } catch {
      return true;
    }
  });

  // Sinkronkan DOM setiap tema berubah. Dilakukan lewat effect agar satu sumber
  // kebenaran tetap berada di React state.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Ikuti perubahan setelan sistem hanya selama pengguna belum memilih sendiri.
  useEffect(() => {
    if (!followsSystem) return undefined;
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return undefined;
    const onChange = (e) => setTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [followsSystem]);

  const persist = useCallback((next) => {
    setTheme(next);
    setFollowsSystem(false);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* abaikan */
    }
  }, []);

  const toggle = useCallback(() => {
    persist(theme === "dark" ? "light" : "dark");
  }, [theme, persist]);

  const value = useMemo(
    () => ({ theme, isDark: theme === "dark", setTheme: persist, toggle, followsSystem }),
    [theme, persist, toggle, followsSystem]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export { ThemeContext };
