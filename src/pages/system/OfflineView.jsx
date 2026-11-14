import { WifiOff, RefreshCw, Database } from "lucide-react";
import { Button, Card, Badge } from "../../components/ui";

export default function OfflineView() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center p-6 sm:p-8 space-y-5 shadow-lift border-line dark:border-night-line">
        <div className="w-16 h-16 rounded-3xl bg-line dark:bg-night-line text-ink-muted grid place-items-center mx-auto">
          <WifiOff size={32} />
        </div>

        <div>
          <Badge tone="gray" className="mb-2">
            Mode Offline
          </Badge>
          <h1 className="font-display font-bold text-2xl text-ink dark:text-stone-50">
            Koneksi Internet Terputus
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-2 leading-relaxed">
            Perangkat Anda sedang tidak tersambung ke jaringan internet.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-canvas-sunken dark:bg-night-sunken text-xs space-y-2 text-left">
          <p className="font-semibold text-ink dark:text-stone-100 flex items-center gap-1.5">
            <Database size={15} className="text-emerald-600" />
            Fitur Offline PWA Aktif:
          </p>
          <ul className="space-y-1 text-ink-muted text-[11px] list-disc list-inside">
            <li>Data yang sudah pernah dibuka tetap bisa dilihat di perangkat ini.</li>
            <li>Perubahan akan otomatis disinkronkan ke server begitu internet kembali aktif.</li>
          </ul>
        </div>

        <div className="pt-2">
          <Button
            variant="primary"
            size="md"
            icon={RefreshCw}
            className="w-full"
            onClick={handleRetry}
          >
            Coba Sambungkan Lagi
          </Button>
        </div>
      </Card>
    </div>
  );
}
