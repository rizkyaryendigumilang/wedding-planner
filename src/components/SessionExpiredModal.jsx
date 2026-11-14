import { useState, useEffect } from "react";
import { Lock, LogIn, AlertCircle } from "lucide-react";
import { Button, Field, Input } from "./ui";
import { useAuth } from "../lib/auth";
import pb from "../lib/pocketbase";
import { toast } from "sonner";

export default function SessionExpiredModal() {
  const { user, login } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Listener untuk mendeteksi respons 401 dari PocketBase
    const checkAuthStatus = () => {
      if (user && !pb.authStore.isValid && !isOpen) {
        setIsOpen(true);
      }
    };

    const interval = setInterval(checkAuthStatus, 3000);
    return () => clearInterval(interval);
  }, [user, isOpen]);

  const handleReLogin = async (e) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg("Kata sandi wajib diisi.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const identity = user?.username || user?.email;
      await login(identity, password);
      setIsOpen(false);
      setPassword("");
      toast.success("Sesi berhasil dipulihkan! Anda dapat melanjutkan pekerjaan.");
    } catch (err) {
      setErrorMsg(err?.message || "Kata sandi salah. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleForceLogout = () => {
    pb.authStore.clear();
    setIsOpen(false);
    window.location.href = import.meta.env.BASE_URL || "/login";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-ink/60 dark:bg-black/80 backdrop-blur-md" />

      <div className="relative w-full max-w-sm bg-canvas-card dark:bg-night-card rounded-3xl border border-line dark:border-night-line p-6 shadow-lift z-10 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 grid place-items-center mx-auto">
          <Lock size={26} />
        </div>

        <div>
          <h3 className="font-display font-semibold text-lg text-ink dark:text-stone-100">
            Sesi Anda Telah Berakhir
          </h3>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed">
            Untuk menjaga keamanan data pernikahan, masukkan kata sandi akun{" "}
            <span className="font-semibold text-ink dark:text-stone-200">
              @{user?.username || user?.email}
            </span>{" "}
            untuk memperpanjang sesi tanpa kehilangan data yang belum disimpan.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 text-left">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleReLogin} className="space-y-3 pt-1 text-left">
          <Field label="Kata Sandi">
            <Input
              type="password"
              placeholder="Masukkan kata sandi akun…"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
          </Field>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={loading}
            icon={LogIn}
          >
            Lanjutkan Sesi
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={handleForceLogout}
          >
            Keluar ke Halaman Masuk
          </Button>
        </form>
      </div>
    </div>
  );
}
