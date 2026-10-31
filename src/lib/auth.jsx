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

    // Akun demo yang sudah kadaluarsa tidak boleh masuk. Cek di sisi klien
    // untuk UX yang ramah; aturan server (bila diaktifkan) tetap menjadi
    // penegak utama.
    if (current?.is_demo && current?.demo_expires_at) {
      const expires = new Date(current.demo_expires_at).getTime();
      if (Number.isFinite(expires) && expires < Date.now()) {
        pb.authStore.clear();
        setUser(null);
        const err = new Error("Akun demo telah kadaluarsa (lebih dari 7 hari).");
        err.code = "demo_expired";
        throw err;
      }
    }

    setUser(current);

    if (current) {
      try {
        const profile = { name: current.name || current.username, username: current.username || current.email };
        if (current.partner_role === "CPP" || current.username === "admin") {
          localStorage.setItem("wedding_cpp_profile", JSON.stringify(profile));
        } else if (current.partner_role === "CPW" || current.username === "reina") {
          localStorage.setItem("wedding_cpw_profile", JSON.stringify(profile));
        }
      } catch (_) {}
    }

    return current;
  }, []);

  /**
   * Mendaftar akun baru di koleksi `users`.
   */
  const register = useCallback(
    async ({ name, username, email, password, passwordConfirm, partner_role }) => {
      const payload = {
        email: email.trim(),
        password,
        passwordConfirm: passwordConfirm || password,
        name: name?.trim() || "",
        emailVisibility: false,
      };

      if (partner_role) {
        payload.partner_role = partner_role;
      }

      const cleanUsername = username?.trim().toLowerCase().replace(/[^a-zA-Z0-9_.-]/g, "");
      if (cleanUsername) {
        payload.username = cleanUsername;
      }

      // Buat akun baru di koleksi `users`
      const newRecord = await pb.collection("users").create(payload);

      // Simpan profil lokal untuk role switcher mempelai
      try {
        const profile = { name: payload.name || cleanUsername || payload.email, username: cleanUsername || payload.email };
        if (partner_role === "CPP") {
          localStorage.setItem("wedding_cpp_profile", JSON.stringify(profile));
        } else if (partner_role === "CPW") {
          localStorage.setItem("wedding_cpw_profile", JSON.stringify(profile));
        }
      } catch (_) {}

      // Masuk secara otomatis setelah berhasil mendaftar
      await login(cleanUsername || payload.email, password);

      // Kirim email verifikasi bila SMTP sudah dikonfigurasi di server.
      // Kegagalan di sini tidak boleh membatalkan pendaftaran.
      try {
        await pb.collection("users").requestVerification(payload.email);
      } catch (err) {
        console.warn("Email verifikasi belum terkirim:", err?.message || err);
      }

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
   * Lupa kata sandi: PocketBase mengirim tautan berisi token ke email akun.
   * Tidak ada perubahan skema — memakai koleksi `users` bawaan.
   */
  const requestPasswordReset = useCallback(async (email) => {
    await pb.collection("users").requestPasswordReset(email.trim().toLowerCase());
  }, []);

  /**
   * Menyelesaikan reset kata sandi memakai token dari tautan email.
   */
  const confirmPasswordReset = useCallback(
    async (token, password, passwordConfirm) => {
      await pb.collection("users").confirmPasswordReset(
        token,
        password,
        passwordConfirm || password
      );
    },
    []
  );

  /**
   * Kirim ulang email verifikasi untuk akun yang belum terverifikasi.
   */
  const requestVerification = useCallback(async (email) => {
    await pb.collection("users").requestVerification(email.trim().toLowerCase());
  }, []);

  /**
   * Konfirmasi alamat email memakai token dari tautan verifikasi.
   */
  const confirmVerification = useCallback(async (token) => {
    await pb.collection("users").confirmVerification(token);
  }, []);

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

    // F-11: hapus cache service worker agar data akun sebelumnya tidak
    // tersaji ulang ke akun berikutnya di perangkat yang sama.
    if (typeof caches !== "undefined") {
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        .catch(() => {});
    }
  }, []);

  const value = useMemo(() => {
    const isSuperuser = !!pb.authStore.isSuperuser || pb.authStore.record?.collectionName === "_superusers";
    const isAdmin = user?.username === "admin" || isSuperuser;
    const appRole = user?.app_role || (isAdmin ? "owner" : "couple");
    const isPanitia = appRole === "panitia" || appRole === "wo";
    const isOwner = !isPanitia;
    const canViewBudget = isOwner;

    // Akun demo: tandai dan hitung sisa hari sebelum kadaluarsa.
    const isDemo = !!user?.is_demo;
    let demoDaysLeft = null;
    if (isDemo && user?.demo_expires_at) {
      const expires = new Date(user.demo_expires_at).getTime();
      if (Number.isFinite(expires)) {
        // eslint-disable-next-line react-hooks/purity
        demoDaysLeft = Math.max(0, Math.ceil((expires - Date.now()) / 86400000));
      }
    }

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
      isDemo,
      demoDaysLeft,
      /** Nama yang layak ditampilkan — username lebih dikenali daripada email. */
      displayName: user?.name || user?.username || user?.email || "Pemilik",
      login,
      register,
      loginWithOAuth,
      requestPasswordReset,
      confirmPasswordReset,
      requestVerification,
      confirmVerification,
      getAuthMethods,
      logout,
    };
  }, [
    user,
    ready,
    login,
    register,
    loginWithOAuth,
    requestPasswordReset,
    confirmPasswordReset,
    requestVerification,
    confirmVerification,
    getAuthMethods,
    logout,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
