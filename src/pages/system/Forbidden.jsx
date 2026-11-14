import { ShieldAlert, ArrowLeft, Home, KeyRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card } from "../../components/ui";
import { useAuth } from "../../lib/auth";

export default function Forbidden() {
  const navigate = useNavigate();
  const { appRole } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center p-6 sm:p-8 space-y-5 shadow-lift border-rose-200/60 dark:border-rose-900/40">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-600 dark:text-rose-400 grid place-items-center mx-auto">
          <ShieldAlert size={32} />
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block mb-1">
            Galat 403 • Hak Akses Terbatas
          </span>
          <h1 className="font-display font-bold text-2xl text-ink dark:text-stone-50">
            Akses Ditolak
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-2 leading-relaxed">
            Peran akun Anda saat ini (
            <span className="font-semibold text-ink dark:text-stone-200">
              {appRole === "panitia"
                ? "Panitia Keluarga"
                : appRole === "wo"
                ? "Wedding Organizer"
                : appRole}
            </span>
            ) tidak memiliki wewenang untuk membuka halaman ini demi menjaga kerahasiaan data privat pengantin.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-canvas-sunken dark:bg-night-sunken text-xs text-ink-muted text-left space-y-1">
          <p className="font-semibold text-ink dark:text-stone-200 flex items-center gap-1.5">
            <KeyRound size={14} className="text-rose-600" />
            Butuh Akses ke Modul Ini?
          </p>
          <p>
            Hubungi Pemilik / Pengantin Utama untuk memberikan wewenang peran pada menu Manajemen Pengguna.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
          <Button
            variant="neutral"
            size="md"
            icon={ArrowLeft}
            className="w-full sm:w-auto"
            onClick={() => navigate(-1)}
          >
            Kembali
          </Button>
          <Button
            as={Link}
            to="/"
            variant="primary"
            size="md"
            icon={Home}
            className="w-full sm:w-auto"
          >
            Ke Beranda
          </Button>
        </div>
      </Card>
    </div>
  );
}
