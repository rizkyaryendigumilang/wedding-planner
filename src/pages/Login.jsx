import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Loader2, LockKeyhole, Mail, AlertTriangle } from "lucide-react";
import { useAuth } from "../lib/auth";

/**
 * Halaman login. Semua data pernikahan bersifat privat, jadi pengguna harus
 * masuk dengan akun PocketBase sebelum daftar di bursa data bisa dibaca.
 */
export default function Login() {
  const { login, isAuthed } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Sudah masuk -> langsung ke halaman yang dituju (atau dashboard).
  if (isAuthed) {
    const to = location.state?.from?.pathname || "/";
    return <Navigate to={to} replace />;
  }

  const submit = async (e) => {
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
          "Email atau kata sandi salah. Periksa kembali kredensial PocketBase Anda."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-gradient-to-br from-violet-600 via-primary to-fuchsia-500">
      {/* Ornamen latar */}
      <div className="absolute -left-16 -top-16 w-72 h-72 rounded-full bg-white/10" />
      <div className="absolute -right-10 bottom-0 w-96 h-96 rounded-full bg-white/10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white dark:bg-darksurface rounded-3xl shadow-2xl p-7 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-3xl bg-primary text-white grid place-items-center shadow-lg shadow-primary/30">
              <Heart size={24} />
            </div>
            <h1 className="text-xl font-bold mt-4 text-gray-900 dark:text-white">
              Wedding Planner
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Rizky &amp; Reina • 17 Februari 2028
            </p>
          </div>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Email
              </span>
              <div className="mt-1.5 flex items-center gap-2 px-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
                <Mail size={17} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  autoComplete="username"
                  value={identity}
                  onChange={(e) => { setIdentity(e.target.value); if (error) setError(""); }}
                  required
                  autoFocus
                  placeholder="nama@email.com"
                  className="w-full bg-transparent py-3 text-sm outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Kata Sandi
              </span>
              <div className="mt-1.5 flex items-center gap-2 px-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
                <LockKeyhole size={17} className="text-gray-400 shrink-0" />
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
                  required
                  placeholder="••••••••"
                  className="w-full bg-transparent py-3 text-sm outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
                />
              </div>
            </label>

            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 text-xs">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy || !identity || !password}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-white text-sm font-semibold shadow-lg shadow-primary/30 hover:brightness-110 active:scale-[0.99] transition disabled:opacity-50 disabled:shadow-none"
            >
              {busy ? (
                <>
                  <Loader2 size={17} className="animate-spin" /> Memeriksa…
                </>
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6 leading-relaxed">
            Data pernikahan hanya dapat diakses setelah masuk.
            <br />
            Gunakan akun PocketBase Anda.
          </p>
        </div>

        <p className="text-center text-xs text-white/70 mt-5">
          Tersambung ke PocketBase lokak • port 8090
        </p>
      </motion.div>
    </div>
  );
}
