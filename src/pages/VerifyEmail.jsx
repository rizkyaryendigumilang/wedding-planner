import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Loader2, MailCheck } from "lucide-react";
import { useAuth } from "../lib/auth";
import { LOGO_URL } from "../lib/icons";

/**
 * Halaman verifikasi email.
 * Token berasal dari tautan email PocketBase:
 *   /wedding/verify-email?token=...
 */
export default function VerifyEmail() {
  const { confirmVerification } = useAuth();
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [state, setState] = useState(token ? "checking" : "missing");
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    document.title = "Verifikasi Email — Wedding Planner";
  }, []);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;

    let active = true;
    (async () => {
      try {
        await confirmVerification(token);
        if (active) setState("success");
      } catch (err) {
        if (!active) return;
        setError(
          err?.response?.message ||
            err?.message ||
            "Tautan verifikasi tidak valid atau sudah kedaluwarsa."
        );
        setState("error");
      }
    })();

    return () => {
      active = false;
    };
  }, [token, confirmVerification]);

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
            Verifikasi email
          </h1>
        </div>

        <div className="rounded-3xl bg-canvas-card dark:bg-night-card border border-line dark:border-night-line p-6 shadow-soft text-center">
          {state === "checking" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 size={22} className="animate-spin text-rose-600" />
              <p className="text-xs text-ink-muted">Memverifikasi alamat email Anda…</p>
            </div>
          )}

          {state === "success" && (
            <div className="flex flex-col items-center gap-3 py-2">
              <CheckCircle2 size={32} className="text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm font-semibold text-ink dark:text-stone-50">
                Email berhasil diverifikasi
              </p>
              <p className="text-xs text-ink-muted leading-relaxed">
                Akun Anda kini aktif sepenuhnya. Notifikasi penting akan dikirim ke email ini.
              </p>
            </div>
          )}

          {state === "error" && (
            <div className="flex flex-col items-center gap-3 py-2">
              <AlertTriangle size={30} className="text-rose-600 dark:text-rose-400" />
              <p className="text-sm font-semibold text-ink dark:text-stone-50">
                Verifikasi gagal
              </p>
              <p className="text-xs text-ink-muted leading-relaxed">{error}</p>
            </div>
          )}

          {state === "missing" && (
            <div className="flex flex-col items-center gap-3 py-2">
              <MailCheck size={30} className="text-ink-muted" />
              <p className="text-sm font-semibold text-ink dark:text-stone-50">
                Buka tautan dari email
              </p>
              <p className="text-xs text-ink-muted leading-relaxed">
                Halaman ini membutuhkan token verifikasi. Gunakan tautan yang kami kirim ke email
                Anda.
              </p>
            </div>
          )}

          <Link
            to="/login"
            className="mt-5 flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl border border-line dark:border-night-line text-xs font-semibold text-ink hover:bg-canvas-sunken dark:hover:bg-night-sunken transition"
          >
            Ke halaman masuk
          </Link>
        </div>
      </motion.main>
    </div>
  );
}
