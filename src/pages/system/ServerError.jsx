import { useState } from "react";
import { ServerCrash, RefreshCw, Trash2, LifeBuoy } from "lucide-react";
import { Button, Card } from "../../components/ui";
import HelpdeskModal from "../../components/HelpdeskModal";

export default function ServerError() {
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const handleReload = () => {
    window.location.reload();
  };

  const handleClearCacheAndReload = () => {
    try {
      if (typeof window !== "undefined") {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith("wedding_") || k.includes("cache"))) {
            localStorage.removeItem(k);
          }
        }
      }
    } catch (_) {}
    window.location.href = import.meta.env.BASE_URL || "/";
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center p-6 sm:p-8 space-y-5 shadow-lift border-rose-200/60 dark:border-rose-900/40">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-600 dark:text-rose-400 grid place-items-center mx-auto">
          <ServerCrash size={32} />
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block mb-1">
            Galat 500 • Gangguan Server
          </span>
          <h1 className="font-display font-bold text-2xl text-ink dark:text-stone-50">
            Terjadi Kesalahan Server
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-2 leading-relaxed">
            Server database PocketBase sedang mengalami kendala sementara atau antrian tinggi. Jangan khawatir, data acara Anda tetap tersimpan aman.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <Button
            variant="primary"
            size="md"
            icon={RefreshCw}
            onClick={handleReload}
          >
            Muat Ulang Halaman
          </Button>

          <Button
            variant="neutral"
            size="md"
            icon={LifeBuoy}
            onClick={() => setIsHelpModalOpen(true)}
          >
            Laporkan ke Helpdesk
          </Button>

          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={handleClearCacheAndReload}
          >
            Bersihkan Cache Lokal & Muat Ulang
          </Button>
        </div>
      </Card>

      <HelpdeskModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
}
