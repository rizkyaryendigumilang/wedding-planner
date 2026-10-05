import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import pb from "./pocketbase";

/**
 * AuthContext
 * ---------------------------------------------------------------------------
 * Semua koleksi data (budgets, administrations, seserahan_items,
 * vendor_checklists, wedding_guests, cashflow_entries, activity_logs)
 * dilindungi aturan `@request.auth.id != ""`, jadi aplikasi WAJIB login
 * sebelum membaca data. Sesi disimpan PocketBase di localStorage sehingga
 * tetap aktif setelah halaman dimuat ulang.
 */
const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  return ctx;
}

export function AuthProvider({ children }) {
  // `ready` = kita sudah selesai memeriksa sesi tersimpan di localStorage.
  const [user, setUser] = useState(() => pb.authStore.record || null);
  // Sesi tersimpan sudah bisa dibaca sinkron, jadi `ready` bisa langsung true.
  const ready = true;

  // Ikuti perubahan authStore (login, logout, token kedaluwarsa).
  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser(record || pb.authStore.record || null);
    });
    return unsubscribe;
  }, []);

  /** Login dengan akun PocketBase lalu simpan sesi secara otomatis. */
  const login = useCallback(async (identity, password) => {
    let record;
    // Superuser memakai koleksi `_superusers`; akun biasa memakai `users`.
    try {
      const res = await pb.collection("_superusers").authWithPassword(identity, password);
      record = res?.record;
    } catch (err) {
      // Bukan superuser -> coba koleksi `users` (admin/owner biasa).
      try {
        const res = await pb.collection("users").authWithPassword(identity, password);
        record = res?.record;
      } catch (_) {
        throw err;
      }
    }
    // Set state langsung (tidak hanya bergantung pada onChange) agar redirect
    // ke dashboard terjadi seketika setelah login berhasil.
    const current = record || pb.authStore.record || null;
    setUser(current);
    return current;
  }, []);

  const logout = useCallback(() => {
    pb.authStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      isAuthed: !!user && pb.authStore.isValid,
      isSuperuser: !!user?.collectionName && pb.authStore.isSuperuser,
      login,
      logout,
    }),
    [user, ready, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
