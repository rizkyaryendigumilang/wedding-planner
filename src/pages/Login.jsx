import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Loader2,
  LockKeyhole,
  AlertTriangle,
  LogIn,
  UserPlus,
  Send,
  X,
  ExternalLink,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { PWAInstallButton } from "../components/PWAInstallPrompt";

function GoogleIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function GitHubIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

function TelegramIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .36z" />
    </svg>
  );
}

/**
 * Halaman Masuk & Daftar Akun dengan dukungan Gmail (Google), GitHub, Telegram,
 * dan PWA branding logo wedding rings.
 */
export default function Login() {
  const { login, register, loginWithOAuth, loginWithTelegram, isAuthed } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const reduce = useReducedMotion();

  // Mode: 'login' | 'register'
  const [mode, setMode] = useState("login");

  // Form state
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyProvider, setBusyProvider] = useState("");

  // Modals
  const [telegramModalOpen, setTelegramModalOpen] = useState(false);
  const [tgUsername, setTgUsername] = useState("");
  const [tgName, setTgName] = useState("");

  const [oauthHelpModal, setOauthHelpModal] = useState({ open: false, provider: "" });

  if (isAuthed) {
    const to = location.state?.from?.pathname || "/";
    return <Navigate to={to} replace />;
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(identity.trim(), password);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      setError(
        err?.response?.message ||
          err?.message ||
          "Nama pengguna atau kata sandi salah. Periksa kembali."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirm) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    if (password.length < 5) {
      setError("Kata sandi minimal 5 karakter.");
      return;
    }

    setBusy(true);
    try {
      await register({
        name,
        username,
        email,
        password,
        passwordConfirm,
      });
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      const errMsg =
        err?.response?.data?.email?.message ||
        err?.response?.data?.username?.message ||
        err?.response?.data?.password?.message ||
        err?.response?.message ||
        err?.message ||
        "Gagal mendaftar. Periksa format isian Anda.";
      setError(errMsg);
    } finally {
      setBusy(false);
    }
  };

  const handleOAuthClick = async (providerName) => {
    setError("");
    setBusy(true);
    setBusyProvider(providerName);
    try {
      await loginWithOAuth(providerName);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      console.warn("OAuth error:", err);
      // Jika provider belum diaktifkan di admin PocketBase
      setOauthHelpModal({ open: true, provider: providerName });
    } finally {
      setBusy(false);
      setBusyProvider("");
    }
  };

  const handleTelegramSubmit = async (e) => {
    e.preventDefault();
    if (!tgUsername.trim()) return;

    setError("");
    setBusy(true);
    setBusyProvider("telegram");
    try {
      await loginWithTelegram({
        username: tgUsername.trim(),
        name: tgName.trim() || tgUsername.trim(),
      });
      setTelegramModalOpen(false);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      setError(err?.message || "Gagal masuk via Telegram. Coba lagi.");
    } finally {
      setBusy(false);
      setBusyProvider("");
    }
  };

  return (
    <div className="relative min-h-[100dvh] grid lg:grid-cols-[1.1fr_1fr] bg-canvas dark:bg-night overflow-hidden">
      {/* ---------------- Panel kiri: branding visual ---------------- */}
      <aside className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-to-b from-stone-900 via-ink to-night-card text-stone-100">
        {/* Efek kilau latar lembut */}
        <motion.div
          aria-hidden
          animate={reduce ? {} : { x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.08, 0.96, 1] }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-24 -left-24 w-[30rem] h-[30rem] rounded-full bg-rose-600/20 blur-3xl pointer-events-none"
        />
        <motion.div
          aria-hidden
          animate={reduce ? {} : { x: [0, -30, 25, 0], y: [0, 25, -15, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 right-0 w-[26rem] h-[26rem] rounded-full bg-brass-400/20 blur-3xl pointer-events-none"
        />
        <div aria-hidden className="absolute inset-0 grain opacity-40 pointer-events-none" />

        {/* Brand Header */}
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 p-2 shadow-glow grid place-items-center shrink-0 border border-white/20">
              <img
                src="/logo-transparent.png"
                alt="Logo Wedding Rings"
                className="w-full h-full object-contain filter drop-shadow"
              />
            </div>
            <div>
              <p className="font-display font-semibold text-white tracking-tight text-base">Wedding Planner</p>
              <p className="text-xs text-stone-400">Rizky &amp; Reina • 17 Februari 2028</p>
            </div>
          </div>

          <PWAInstallButton className="bg-white/10 text-stone-200 hover:bg-white/15 border border-white/10" />
        </div>

        {/* Center Hero Card */}
        <div className="relative max-w-lg my-auto py-8">
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brass-500/15 border border-brass-400/30 text-brass-300 text-xs font-medium mb-6 backdrop-blur-md"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brass-400 animate-pulse" />
            Official Wedding Planner Platform
          </motion.div>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-4xl xl:text-5xl font-semibold text-white leading-[1.12] tracking-tight"
          >
            Rencana pernikahan
            <br />
            <span className="font-accent italic font-normal text-brass-300">dalam satu genggaman.</span>
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 text-stone-300/80 text-[15px] leading-relaxed"
          >
            Akses menyeluruh untuk Anggaran, Administrasi, Daftar Tamu, Seserahan, dan Galeri.
            Tersedia dalam format PWA untuk Android, iPhone, iPad, dan Desktop.
          </motion.p>

          <div className="flex items-center gap-6 mt-8 pt-6 border-t border-white/10 text-xs text-stone-400">
            <div>
              <span className="block font-semibold text-white text-sm">PWA Ready</span>
              <span>Android &amp; iOS</span>
            </div>
            <div className="w-px h-7 bg-white/10" />
            <div>
              <span className="block font-semibold text-white text-sm">Multi-Auth</span>
              <span>Gmail, GitHub, Telegram</span>
            </div>
            <div className="w-px h-7 bg-white/10" />
            <div>
              <span className="block font-semibold text-white text-sm">Gedung PINDAD</span>
              <span>17 Februari 2028</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative flex items-center justify-between text-stone-400 text-xs">
          <span>&copy; 2028 Rizky &amp; Reina</span>
          <span className="text-stone-500">Tersinkron dengan PocketBase</span>
        </div>
      </aside>

      {/* ---------------- Panel kanan: formulir autentikasi ---------------- */}
      <main className="relative flex items-center justify-center p-5 sm:p-8 lg:p-12 overflow-y-auto">
        <div aria-hidden className="absolute inset-0 lg:hidden overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-20 w-80 h-80 rounded-full bg-rose-500/15 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-brass-400/15 blur-3xl" />
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-sm py-4"
        >
          {/* Logo khusus tampilan layar kecil / tablet */}
          <div className="lg:hidden flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-rose-600 to-rose-700 p-2.5 shadow-glow grid place-items-center shrink-0 border border-white/20">
              <img
                src="/logo-transparent.png"
                alt="Logo Wedding Planner"
                className="w-full h-full object-contain filter drop-shadow"
              />
            </div>
            <h1 className="font-display text-xl font-semibold mt-3 text-ink dark:text-stone-50">
              Wedding Planner
            </h1>
            <p className="text-xs text-ink-muted mt-0.5">Rizky &amp; Reina • 17 Februari 2028</p>
            <div className="mt-3">
              <PWAInstallButton />
            </div>
          </div>

          {/* Heading desktop */}
          <div className="hidden lg:block mb-6">
            <h2 className="font-display text-2xl font-semibold text-ink dark:text-stone-50">
              {mode === "login" ? "Selamat datang kembali" : "Buat akun baru"}
            </h2>
            <p className="text-xs text-ink-muted mt-1">
              {mode === "login"
                ? "Masuk untuk melanjutkan persiapan pernikahan."
                : "Daftar untuk mengakses perencanaan pernikahan."}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-canvas-sunken dark:bg-night-sunken mb-5 border border-line dark:border-night-line">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`relative py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
                mode === "login"
                  ? "bg-canvas-card dark:bg-night-card text-rose-600 dark:text-rose-400 shadow-soft"
                  : "text-ink-muted hover:text-ink dark:hover:text-stone-200"
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
              }}
              className={`relative py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
                mode === "register"
                  ? "bg-canvas-card dark:bg-night-card text-rose-600 dark:text-rose-400 shadow-soft"
                  : "text-ink-muted hover:text-ink dark:hover:text-stone-200"
              }`}
            >
              Daftar
            </button>
          </div>

          {/* ---------------- DERETAN TOMBOL OAUTH (GMAIL, GITHUB, TELEGRAM) ---------------- */}
          <div className="space-y-2 mb-5">
            <p className="text-[11px] font-medium text-ink-faint text-center uppercase tracking-wider mb-2.5">
              {mode === "login" ? "Masuk cepat dengan" : "Daftar instan dengan"}
            </p>

            <div className="grid grid-cols-3 gap-2">
              {/* Tombol Google / Gmail */}
              <button
                type="button"
                onClick={() => handleOAuthClick("google")}
                disabled={busy}
                title="Lanjutkan dengan akun Google / Gmail"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border border-line dark:border-night-line bg-canvas-card dark:bg-night-card hover:bg-canvas-sunken dark:hover:bg-night-sunken text-xs font-medium text-ink dark:text-stone-100 transition shadow-sm active:scale-[0.97] focus-ring disabled:opacity-50"
              >
                {busy && busyProvider === "google" ? (
                  <Loader2 size={16} className="animate-spin text-rose-600" />
                ) : (
                  <GoogleIcon className="w-4 h-4 shrink-0" />
                )}
                <span className="truncate">Google</span>
              </button>

              {/* Tombol GitHub */}
              <button
                type="button"
                onClick={() => handleOAuthClick("github")}
                disabled={busy}
                title="Lanjutkan dengan akun GitHub"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border border-line dark:border-night-line bg-canvas-card dark:bg-night-card hover:bg-canvas-sunken dark:hover:bg-night-sunken text-xs font-medium text-ink dark:text-stone-100 transition shadow-sm active:scale-[0.97] focus-ring disabled:opacity-50"
              >
                {busy && busyProvider === "github" ? (
                  <Loader2 size={16} className="animate-spin text-rose-600" />
                ) : (
                  <GitHubIcon className="w-4 h-4 shrink-0" />
                )}
                <span className="truncate">GitHub</span>
              </button>

              {/* Tombol Telegram */}
              <button
                type="button"
                onClick={() => setTelegramModalOpen(true)}
                disabled={busy}
                title="Lanjutkan dengan akun Telegram"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border border-line dark:border-night-line bg-canvas-card dark:bg-night-card hover:bg-canvas-sunken dark:hover:bg-night-sunken text-xs font-medium text-ink dark:text-stone-100 transition shadow-sm active:scale-[0.97] focus-ring disabled:opacity-50"
              >
                {busy && busyProvider === "telegram" ? (
                  <Loader2 size={16} className="animate-spin text-[#229ED9]" />
                ) : (
                  <span className="text-[#229ED9] shrink-0">
                    <TelegramIcon className="w-4 h-4" />
                  </span>
                )}
                <span className="truncate">Telegram</span>
              </button>
            </div>
          </div>

          {/* Pemisah Garis */}
          <div className="relative flex items-center justify-center my-4">
            <div className="w-full border-t border-line dark:border-night-line" />
            <span className="absolute bg-canvas dark:bg-night px-3 text-[11px] text-ink-faint">
              atau gunakan formulir
            </span>
          </div>

          {/* ---------------- FORMULIR MASUK / DAFTAR ---------------- */}
          {mode === "login" ? (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              {/* Quick Profile Switcher (Rizky & Reina) */}
              <div className="p-3 rounded-2xl bg-canvas-sunken/60 dark:bg-night-sunken/60 border border-line dark:border-night-line">
                <p className="text-[10px] font-semibold text-ink-faint uppercase tracking-wider mb-2 text-center">
                  Pilih Profil Masuk Cepat
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIdentity("admin");
                      setError("");
                      document.getElementById("password")?.focus();
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition ${
                      identity === "admin" || identity === "rizky"
                        ? "border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300 font-semibold shadow-xs"
                        : "border-line dark:border-night-line bg-canvas-card dark:bg-night-card hover:border-sky-400 text-ink"
                    }`}
                  >
                    <span className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-sky-600 text-white grid place-items-center text-xs font-bold shrink-0">
                      R
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs truncate leading-tight">Rizky (CPP)</p>
                      <p className="text-[10px] text-ink-faint leading-none mt-0.5">@admin</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIdentity("reina");
                      setError("");
                      document.getElementById("password")?.focus();
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition ${
                      identity === "reina"
                        ? "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 font-semibold shadow-xs"
                        : "border-line dark:border-night-line bg-canvas-card dark:bg-night-card hover:border-rose-400 text-ink"
                    }`}
                  >
                    <span className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 text-white grid place-items-center text-xs font-bold shrink-0">
                      R
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs truncate leading-tight">Reina (CPW)</p>
                      <p className="text-[10px] text-ink-faint leading-none mt-0.5">@reina</p>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="identity"
                  className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint mb-1.5"
                >
                  Nama pengguna atau email
                </label>
                <input
                  id="identity"
                  type="text"
                  autoComplete="username"
                  value={identity}
                  onChange={(e) => {
                    setIdentity(e.target.value);
                    if (error) setError("");
                  }}
                  required
                  autoFocus
                  placeholder="admin atau email@contoh.com"
                  className="field"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint mb-1.5"
                >
                  Kata sandi
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  required
                  placeholder="••••••••"
                  className="field"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs"
                >
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={busy || !identity || !password}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-rose-600 text-white text-xs font-semibold shadow-glow hover:bg-rose-700 active:scale-[0.985] transition-all duration-150 ease-glide disabled:opacity-50 disabled:shadow-none focus-ring"
              >
                {busy && !busyProvider ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Memeriksa…
                  </>
                ) : (
                  <>
                    <LogIn size={16} /> Masuk ke Aplikasi
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label
                  htmlFor="reg-name"
                  className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint mb-1"
                >
                  Nama Lengkap
                </label>
                <input
                  id="reg-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Rizky Aryendi"
                  className="field"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label
                    htmlFor="reg-user"
                    className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint mb-1"
                  >
                    Username
                  </label>
                  <input
                    id="reg-user"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="rizky"
                    className="field"
                  />
                </div>
                <div>
                  <label
                    htmlFor="reg-email"
                    className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint mb-1"
                  >
                    Email
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="nama@email.com"
                    className="field"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reg-pass"
                  className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint mb-1"
                >
                  Kata Sandi (min. 5 karakter)
                </label>
                <input
                  id="reg-pass"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="field"
                />
              </div>

              <div>
                <label
                  htmlFor="reg-confirm"
                  className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint mb-1"
                >
                  Konfirmasi Kata Sandi
                </label>
                <input
                  id="reg-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="field"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs"
                >
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={busy || !email || !password || !passwordConfirm}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-rose-600 text-white text-xs font-semibold shadow-glow hover:bg-rose-700 active:scale-[0.985] transition-all duration-150 ease-glide disabled:opacity-50 disabled:shadow-none focus-ring mt-2"
              >
                {busy && !busyProvider ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Mendaftarkan…
                  </>
                ) : (
                  <>
                    <UserPlus size={16} /> Daftar Akun Baru
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer info box */}
          <div className="flex items-start gap-2.5 mt-5 p-3.5 rounded-2xl bg-canvas-sunken/70 dark:bg-night-sunken/70 border border-line/60 dark:border-night-line/60">
            <LockKeyhole size={14} className="text-ink-faint shrink-0 mt-0.5" />
            <p className="text-[11px] text-ink-muted leading-relaxed">
              Data pernikahan bersifat privat &amp; terlindungi. Masuk dengan akun keluarga atau registrasi akun baru untuk mengakses dasbor.
            </p>
          </div>
        </motion.div>
      </main>

      {/* ---------------- MODAL TELEGRAM AUTH ---------------- */}
      <AnimatePresence>
        {telegramModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTelegramModalOpen(false)}
              className="absolute inset-0 bg-ink/60 dark:bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm rounded-3xl bg-canvas-card dark:bg-night-card border border-line dark:border-night-line p-6 shadow-lift z-10"
            >
              <button
                onClick={() => setTelegramModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-ink-muted hover:bg-canvas-sunken dark:hover:bg-night-sunken transition"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-[#229ED9]/15 text-[#229ED9] grid place-items-center shrink-0">
                  <TelegramIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-sm">Masuk via Telegram</h3>
                  <p className="text-xs text-ink-faint">Daftar atau masuk dengan akun Telegram</p>
                </div>
              </div>

              <form onSubmit={handleTelegramSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-1">
                    Username Telegram
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-ink-faint text-sm">@</span>
                    <input
                      type="text"
                      value={tgUsername}
                      onChange={(e) => setTgUsername(e.target.value)}
                      required
                      autoFocus
                      placeholder="username_anda"
                      className="field pl-8"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-1">
                    Nama Panggilan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={tgName}
                    onChange={(e) => setTgName(e.target.value)}
                    placeholder="Contoh: Reina / Keluarga CPP"
                    className="field"
                  />
                </div>

                <button
                  type="submit"
                  disabled={busy || !tgUsername.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#229ED9] hover:bg-[#1d8bc0] text-white text-xs font-semibold shadow-soft active:scale-[0.985] transition disabled:opacity-50"
                >
                  {busy && busyProvider === "telegram" ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Menghubungkan…
                    </>
                  ) : (
                    <>
                      <Send size={15} /> Lanjutkan dengan Telegram
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- MODAL BANTUAN OAUTH (JIKA OAUTH BELUM DIKONFIGURASI) ---------------- */}
      <AnimatePresence>
        {oauthHelpModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOauthHelpModal({ open: false, provider: "" })}
              className="absolute inset-0 bg-ink/60 dark:bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md rounded-3xl bg-canvas-card dark:bg-night-card border border-line dark:border-night-line p-6 shadow-lift z-10"
            >
              <button
                onClick={() => setOauthHelpModal({ open: false, provider: "" })}
                className="absolute top-4 right-4 p-2 rounded-xl text-ink-muted hover:bg-canvas-sunken dark:hover:bg-night-sunken transition"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-brass-500/15 text-brass-600 dark:text-brass-300 grid place-items-center shrink-0">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-sm">
                    Konfigurasi OAuth {oauthHelpModal.provider === "google" ? "Google" : "GitHub"}
                  </h3>
                  <p className="text-xs text-ink-faint">Penyedia login belum diaktifkan di backend</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-ink-muted leading-relaxed">
                <p>
                  Penyedia masuk <strong>{oauthHelpModal.provider === "google" ? "Google (Gmail)" : "GitHub"}</strong>{" "}
                  memerlukan Client ID &amp; Secret pada PocketBase:
                </p>
                <ol className="list-decimal list-inside space-y-1 pl-1 bg-canvas-sunken dark:bg-night-sunken p-3 rounded-2xl">
                  <li>
                    Buka Dashboard Admin:{" "}
                    <a
                      href="http://127.0.0.1:8090/_/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-rose-600 dark:text-rose-400 font-medium inline-flex items-center gap-1 hover:underline"
                    >
                      localhost:8090/_/ <ExternalLink size={11} />
                    </a>
                  </li>
                  <li>Masuk ke menu <strong>Settings</strong> &gt; <strong>Auth providers</strong></li>
                  <li>Pilih <strong>{oauthHelpModal.provider === "google" ? "Google" : "GitHub"}</strong> dan aktifkan</li>
                  <li>Masukkan <strong>Client ID</strong> &amp; <strong>Client Secret</strong> Anda</li>
                </ol>
                <p className="text-[11px] text-ink-faint pt-1">
                  💡 <em>Sementara itu, Anda dapat langsung masuk memakai formulir username/password atau opsi Telegram.</em>
                </p>
              </div>

              <button
                onClick={() => setOauthHelpModal({ open: false, provider: "" })}
                className="w-full mt-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-[0.985] text-white text-xs font-semibold transition shadow-glow"
              >
                Mengerti &amp; Gunakan Formulir
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
