import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { useAuth } from "../lib/auth";
import { LOGO_URL } from "../lib/icons";

/**
 * Halaman reset kata sandi.
 * Token berasal dari tautan email yang dikirim PocketBase:
 *   /wedding/reset-password?token=...
 */
export default function ResetPassword() {
  const { confirmPasswordReset } = useAuth();
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    document.title = "Atur Ulang Kata Sandi — Wedding Planner";
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setBusy(true);
    try {
      await confirmPasswordReset(token, password, passwordConfirm);
      setDone(true);
    } catch (err) {
      setError(
        err?.response?.message ||
          err?.message ||
          "Tautan tidak valid atau sudah kedaluwarsa. Minta tautan baru dari halaman masuk."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] grid place-items-center bg-canvas dark:bg-night px-5 py-10">
      <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-20 w-80 h-80 rounded-full bg-rose-500/15 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-brass-400/15 blur-3xl" />
      </div>

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm"
      >
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-rose-600 to-rose-700 p-2.5 shadow-glow grid place-items-center border border-white/20">
            <img
              src={LOGO_URL}
              alt="Logo Wedding Planner"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="font-display text-xl font-semibold mt-3 text-ink dark:text-stone-50">
            Atur ulang kata sandi
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            Buat kata sandi baru untuk akun Anda.
          </p>
        </div>

        <div className="rounded-3xl bg-canvas-card dark:bg-night-card border border-line dark:border-night-line p-6 shadow-soft">
          {!token ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs leading-relaxed">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>Tautan tidak memuat token. Buka tautan langsung dari email Anda.</span>
              </div>
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl border border-line dark:border-night-line text-xs font-semibold text-ink hover:bg-canvas-sunken dark:hover:bg-night-sunken transition"
              >
                <ArrowLeft size={14} /> Kembali ke halaman masuk
              </Link>
            </div>
          ) : done ? (
            <div className="space-y-4">
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs leading-relaxed">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                <span>Kata sandi berhasil diperbarui. Silakan masuk dengan kata sandi baru.</span>
              </div>
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-rose-600 text-white text-xs font-semibold shadow-glow hover:bg-rose-700 transition"
              >
                Masuk sekarang
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3.5">
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-[13px] font-medium text-ink-muted dark:text-stone-300 mb-1.5"
                >
                  Kata sandi baru
                </label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  required
                  autoFocus
                  minLength={8}
                  placeholder="Minimal 8 karakter"
                  className="field"
                />
              </div>

              <div>
                <label
                  htmlFor="new-password-confirm"
                  className="block text-[13px] font-medium text-ink-muted dark:text-stone-300 mb-1.5"
                >
                  Ulangi kata sandi
                </label>
                <input
                  id="new-password-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={passwordConfirm}
                  onChange={(e) => {
                    setPasswordConfirm(e.target.value);
                    if (error) setError("");
                  }}
                  required
                  minLength={8}
                  placeholder="Ulangi kata sandi"
                  className="field"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={busy || !password || !passwordConfirm}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-rose-600 text-white text-xs font-semibold shadow-glow hover:bg-rose-700 active:scale-[0.985] transition disabled:opacity-50 disabled:shadow-none"
              >
                {busy ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Menyimpan…
                  </>
                ) : (
                  <>
                    <KeyRound size={16} /> Simpan kata sandi baru
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] text-ink-faint mt-5">
          <Link to="/login" className="hover:underline">
            Kembali ke halaman masuk
          </Link>
        </p>
      </motion.main>
    </div>
  );
}
