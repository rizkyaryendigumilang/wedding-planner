import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import pb from "./pocketbase";

/**
 * AuthContext
 * ---------------------------------------------------------------------------
 * Seluruh koleksi data dilindungi aturan `@request.auth.id != ""`, jadi
 * aplikasi wajib punya sesi sebelum membaca apa pun. Sesi disimpan PocketBase
 * di penyimpanan lokal, sehingga tetap aktif setelah halaman dimuat ulang.
 *
 * Akun yang tersedia:
 *   - admin / admin            -> koleksi `users` (peran super admin aplikasi)
 *   - email superuser PocketBase -> koleksi `_superusers`
 */
const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => pb.authStore.record || null);
  const [ready, setReady] = useState(false);

  // Ikuti perubahan authStore (login, logout, token kedaluwarsa).
  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser(record || pb.authStore.record || null);
    });

    // Verifikasi sesi tersimpan sekali di awal. Bila token sudah kedaluwarsa,
    // refresh; bila gagal, bersihkan agar tidak ada permintaan yang sia-sia.
    (async () => {
      if (pb.authStore.isValid) {
        try {
          await pb.collection(pb.authStore.record.collectionName).authRefresh();
        } catch (err) {
          // Hanya bersihkan authStore jika token ditolak server (400, 401, 403).
          // Jika offline atau masalah jaringan (status 0 atau network error), pertahankan sesi lokal!
          if (err?.status === 401 || err?.status === 403 || err?.status === 400) {
            pb.authStore.clear();
          } else {
            console.warn("Koneksi offline/gagal saat authRefresh, sesi lokal dipertahankan:", err);
          }
        }
      } else if (pb.authStore.token) {
        pb.authStore.clear();
      }
      setReady(true);
    })();

    return unsubscribe;
  }, []);

  /**
   * Masuk dengan akun PocketBase. Identitas boleh berupa username ("admin")
   * maupun email — PocketBase menerima keduanya setelah kolom `username`
   * didaftarkan sebagai identityFields.
   */
  const login = useCallback(async (identity, password) => {
    let record;

    // 1. Coba koleksi `users` lebih dahulu (akun aplikasi sehari-hari).
    try {
      const res = await pb.collection("users").authWithPassword(identity, password);
      record = res?.record;
    } catch (userErr) {
      // 2. Bila bukan pengguna biasa, coba superuser PocketBase.
      try {
        const res = await pb.collection("_superusers").authWithPassword(identity, password);
        record = res?.record;
      } catch {
        // Lempar galat dari percobaan pertama — pesannya lebih relevan bagi
        // pengguna aplikasi dibandingkan galat koleksi superuser.
        throw userErr;
      }
    }

    const current = record || pb.authStore.record || null;
    setUser(current);
    return current;
  }, []);

  /**
   * Mendaftar akun baru di koleksi `users`.
   */
  const register = useCallback(
    async ({ name, username, email, password, passwordConfirm }) => {
      const payload = {
        email: email.trim(),
        password,
        passwordConfirm: passwordConfirm || password,
        name: name?.trim() || "",
        emailVisibility: false,
      };

      const cleanUsername = username?.trim().toLowerCase().replace(/[^a-zA-Z0-9_.-]/g, "");
      if (cleanUsername) {
        payload.username = cleanUsername;
      }

      // Buat akun baru di koleksi `users`
      const newRecord = await pb.collection("users").create(payload);

      // Masuk secara otomatis setelah berhasil mendaftar
      await login(cleanUsername || payload.email, password);
      return newRecord;
    },
    [login]
  );

  /**
   * Masuk atau daftar via penyedia OAuth2 bawaan PocketBase (Google, GitHub, dll).
   */
  const loginWithOAuth = useCallback(async (providerName) => {
    try {
      const res = await pb.collection("users").authWithOAuth2({ provider: providerName });
      const current = res?.record || pb.authStore.record || null;
      setUser(current);
      return current;
    } catch (err) {
      console.warn(`OAuth login failed for ${providerName}:`, err);
      throw err;
    }
  }, []);

  /**
   * Masuk atau daftar cepat menggunakan akun Telegram.
   */
  const loginWithTelegram = useCallback(
    async (telegramData) => {
      const rawUser = (telegramData.username || telegramData.id || "telegram_user")
        .toString()
        .replace(/^@/, "")
        .replace(/[^a-zA-Z0-9_.-]/g, "")
        .toLowerCase();
      const tgUsername = rawUser.length >= 3 ? rawUser : `tg_${rawUser}_${Date.now().toString().slice(-4)}`;
      const tgEmail = `${tgUsername}@telegram.wedding.local`;
      const deterministicPassword = `tg_${tgUsername}_wedding2028!`;

      // Coba masuk jika akun sudah ada
      try {
        return await login(tgUsername, deterministicPassword);
      } catch (_) {
        try {
          return await login(tgEmail, deterministicPassword);
        } catch (_) {
          // Akun belum ada -> buat akun baru untuk Telegram
          try {
            await pb.collection("users").create({
              email: tgEmail,
              username: tgUsername,
              name: telegramData.name || telegramData.first_name || tgUsername,
              password: deterministicPassword,
              passwordConfirm: deterministicPassword,
              emailVisibility: false,
              verified: true,
            });
            return await login(tgUsername, deterministicPassword);
          } catch (_createErr) {
            // Bila username bentrok, tambahkan sufiks acak
            const fallbackUsername = `${tgUsername}_${Math.floor(100 + Math.random() * 900)}`;
            const fallbackEmail = `${fallbackUsername}@telegram.wedding.local`;
            await pb.collection("users").create({
              email: fallbackEmail,
              username: fallbackUsername,
              name: telegramData.name || telegramData.first_name || tgUsername,
              password: deterministicPassword,
              passwordConfirm: deterministicPassword,
              emailVisibility: false,
              verified: true,
            });
            return await login(fallbackUsername, deterministicPassword);
          }
        }
      }
    },
    [login]
  );

  const getAuthMethods = useCallback(async () => {
    try {
      return await pb.collection("users").listAuthMethods();
    } catch (_) {
      return null;
    }
  }, []);

  const logout = useCallback(() => {
    pb.authStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(() => {
    const isSuperuser = !!pb.authStore.isSuperuser || pb.authStore.record?.collectionName === "_superusers";
    const isAdmin = user?.username === "admin" || isSuperuser;
    const appRole = user?.app_role || (isAdmin ? "owner" : "couple");
    const isPanitia = appRole === "panitia" || appRole === "wo";
    const isOwner = !isPanitia;
    const canViewBudget = isOwner;

    return {
      user,
      ready,
      isAuthed: !!user && pb.authStore.isValid,
      isSuperuser,
      isAdmin,
      appRole,
      isOwner,
      isPanitia,
      canViewBudget,
      /** Nama yang layak ditampilkan — username lebih dikenali daripada email. */
      displayName: user?.name || user?.username || user?.email || "Pemilik",
      login,
      register,
      loginWithOAuth,
      loginWithTelegram,
      getAuthMethods,
      logout,
    };
  }, [user, ready, login, register, loginWithOAuth, loginWithTelegram, getAuthMethods, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
