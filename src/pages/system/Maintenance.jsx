import { Wrench, Clock, RefreshCw } from "lucide-react";
import { Button, Card, Badge } from "../../components/ui";

export default function Maintenance() {
  const handleCheckStatus = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center p-6 sm:p-8 space-y-5 shadow-lift border-amber-200/60 dark:border-amber-900/40">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400 grid place-items-center mx-auto">
          <Wrench size={32} />
        </div>

        <div>
          <Badge tone="amber" className="mb-2">
            Pemeliharaan Terjadwal
          </Badge>
          <h1 className="font-display font-bold text-2xl text-ink dark:text-stone-50">
            Sistem Sedang Ditingkatkan
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-2 leading-relaxed">
            Kami sedang melakukan peningkatan performa server dan keamanan database secara berkala. Seluruh data persiapan pernikahan Anda tersimpan aman dan tidak akan berubah.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-canvas-sunken dark:bg-night-sunken text-xs space-y-1.5 text-left">
          <div className="flex items-center justify-between">
            <span className="text-ink-muted flex items-center gap-1.5">
              <Clock size={14} className="text-amber-600" />
              Perkiraan Selesai:
            </span>
            <span className="font-semibold text-ink dark:text-stone-100">~15 Menit</span>
          </div>
          <p className="text-[11px] text-ink-faint">
            Terima kasih atas kesabaran Anda demi kenyamanan hari bahagia.
          </p>
        </div>

        <div className="pt-2">
          <Button
            variant="primary"
            size="md"
            icon={RefreshCw}
            className="w-full"
            onClick={handleCheckStatus}
          >
            Periksa Status Sekarang
          </Button>
        </div>
      </Card>
    </div>
  );
}
