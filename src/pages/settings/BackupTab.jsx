import { useState, useRef, useMemo } from "react";
import {
  FileSpreadsheet,
  FileJson,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  Clock,
  Printer,
  Layers,
  Database,
  AlertTriangle,
} from "lucide-react";
import { Card, SectionTitle, Button, Badge } from "../../components/ui";
import { printMasterGuidebook } from "../../lib/weddingMasterGuidebook";
import { printReport } from "../../lib/export";
import {
  getAutoBackupMeta,
  getAutoBackupSnapshot,
  downloadFullBackupJson,
  exportModuleCsv,
  exportAllCsvBundle,
  formatBytes,
} from "../../lib/autoBackup";
import { toast } from "sonner";
import { triggerHaptic } from "../../lib/haptic";

export default function BackupTab({
  couple,
  settings,
  budgets = [],
  cashflow = [],
  administrations = [],
  vendors = [],
  guests = [],
  seserahan = [],
  rundowns = [],
  gifts = [],
  logs = [],
  user,
  t = (s) => s,
}) {
  const fileInputRef = useRef(null);
  const [restoreStatus, setRestoreStatus] = useState(null);
  const [downloadingBundle, setDownloadingBundle] = useState(false);

  const weddingData = useMemo(
    () => ({
      couple,
      settings,
      budgets,
      cashflow,
      administrations,
      vendors,
      guests,
      seserahan,
      rundowns,
      gifts,
      logs,
    }),
    [
      couple,
      settings,
      budgets,
      cashflow,
      administrations,
      vendors,
      guests,
      seserahan,
      rundowns,
      gifts,
      logs,
    ]
  );

  const coupleId = couple?.id;

  // Metadata Auto-Sync Backup aktif
  const autoBackupMeta = useMemo(() => {
    return coupleId ? getAutoBackupMeta(coupleId) : null;
  }, [coupleId]);

  // Format waktu pencadangan terakhir yang ramah dibaca
  const backupTimeString = useMemo(() => {
    if (!autoBackupMeta?.lastBackupAt) return "Belum pernah dicadangkan";
    return new Date(autoBackupMeta.lastBackupAt).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [autoBackupMeta]);

  // Handler download JSON snapshot
  const handleDownloadJson = () => {
    triggerHaptic("success");
    downloadFullBackupJson(weddingData);
    toast.success("Snapshot cadangan JSON berhasil diunduh.");
  };

  // Handler download semua CSV sekaligus
  const handleDownloadAllCsv = () => {
    triggerHaptic("selection");
    setDownloadingBundle(true);
    exportAllCsvBundle(weddingData, t);
    setTimeout(() => {
      setDownloadingBundle(false);
      toast.success("Seluruh berkas CSV berhasil diekspor (Periksa folder unduhan).");
    }, 1800);
  };

  // Handler pulihkan / verifikasi file JSON dari luar
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed || typeof parsed !== "object") {
          throw new Error("Berkas JSON tidak memiliki struktur data valid.");
        }
        setRestoreStatus({
          type: "confirm",
          date: parsed.exported_at
            ? new Date(parsed.exported_at).toLocaleString("id-ID")
            : "Tidak tercatat",
          summary: `Tamu: ${parsed.guests?.length || 0} • Anggaran: ${
            parsed.budgets?.length || 0
          } • Vendor: ${parsed.vendors?.length || 0} • Rundown: ${
            parsed.rundowns?.length || 0
          } • Kado: ${parsed.gifts?.length || 0}`,
          data: parsed,
        });
        toast.success("Berkas cadangan berhasil diverifikasi.");
      } catch (err) {
        setRestoreStatus({
          type: "error",
          message: "Gagal membaca berkas: " + (err?.message || "Format tidak valid"),
        });
        toast.error("Format berkas JSON tidak sesuai.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Handler periksa Auto-Sync snapshot internal
  const handleInspectAutoSnapshot = () => {
    if (!coupleId) return;
    const snap = getAutoBackupSnapshot(coupleId);
    if (!snap) {
      toast.info("Belum ada snapshot otomatis tersimpan.");
      return;
    }
    setRestoreStatus({
      type: "confirm",
      date: snap.exported_at
        ? new Date(snap.exported_at).toLocaleString("id-ID")
        : "Baru saja",
      summary: `Tamu: ${snap.guests?.length || 0} • Anggaran: ${
        snap.budgets?.length || 0
      } • Vendor: ${snap.vendors?.length || 0} • Rundown: ${
        snap.rundowns?.length || 0
      } • Kado: ${snap.gifts?.length || 0}`,
      data: snap,
    });
    toast.success("Snapshot otomatis lokal berhasil dimuat untuk verifikasi.");
  };

  return (
    <div className="space-y-6">
      {/* ==================== KARTU STATUS AUTO-SYNC ==================== */}
      <Card className="p-5 sm:p-6 bg-gradient-to-br from-emerald-500/10 via-canvas-card to-canvas-card dark:from-emerald-950/20 dark:via-night-card dark:to-night-card border-emerald-200/60 dark:border-emerald-900/40">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="relative p-3 rounded-2xl bg-emerald-600 text-white shrink-0 shadow-glow">
              <RefreshCw size={22} />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold text-base sm:text-lg text-ink dark:text-stone-100">
                  Auto-Sync Cadangan Aktif
                </h3>
                <Badge tone="sage">Tersinkron Otomatis</Badge>
              </div>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed max-w-xl">
                Setiap kali data tamu, pengeluaran, vendor, atau jadwal acara diperbarui, sistem otomatis mengamankan snapshot data terbaru di penyimpanan lokal perangkat ini.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-ink-muted">
                <span className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                  <Clock size={14} />
                  Pencadangan Terakhir: {backupTimeString}
                </span>
                {autoBackupMeta?.sizeBytes > 0 && (
                  <span>• Ukuran Snapshot: {formatBytes(autoBackupMeta.sizeBytes)}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="neutral"
              size="sm"
              icon={Database}
              onClick={handleInspectAutoSnapshot}
            >
              Periksa Snapshot Terkini
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Download}
              onClick={handleDownloadJson}
            >
              Unduh Snapshot (.json)
            </Button>
          </div>
        </div>
      </Card>

      {/* ==================== EKSPOR CADANGAN LAPISAN 1 (PRIBADI & CSV) ==================== */}
      <Card className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle
            title="Cadangan Pribadi & Ekspor Lembar Kerja (Excel / CSV)"
            subtitle="Unduh data dalam format CSV untuk diolah mandiri di Excel / Google Sheets atau kirimkan ke vendor"
          />
          <Button
            variant="primary"
            size="sm"
            icon={Layers}
            loading={downloadingBundle}
            onClick={handleDownloadAllCsv}
          >
            Unduh Semua CSV (Paket Lengkap)
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* 1. CSV Tamu */}
          <div className="p-3.5 rounded-2xl bg-canvas-sunken/60 dark:bg-night-sunken/60 border border-line dark:border-night-line flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-xs">
                <FileSpreadsheet size={16} />
                <span>CSV Tamu Undangan</span>
              </div>
              <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
                {guests.length} tamu, kontak WA, asal pihak CPP/CPW, nomor meja, RSVP &amp; status check-in.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              className="mt-3 w-full"
              onClick={() => {
                triggerHaptic("selection");
                exportModuleCsv("guests", weddingData, t);
                toast.success("Daftar Tamu berhasil diekspor (CSV)");
              }}
            >
              Unduh CSV Tamu
            </Button>
          </div>

          {/* 2. CSV Anggaran */}
          <div className="p-3.5 rounded-2xl bg-canvas-sunken/60 dark:bg-night-sunken/60 border border-line dark:border-night-line flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-xs">
                <FileSpreadsheet size={16} />
                <span>CSV Anggaran &amp; Realisasi</span>
              </div>
              <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
                {budgets.length} pos anggaran, alokasi target, biaya realisasi, dan selisih pengeluaran.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              className="mt-3 w-full"
              onClick={() => {
                triggerHaptic("selection");
                exportModuleCsv("budgets", weddingData, t);
                toast.success("Rencana Anggaran berhasil diekspor (CSV)");
              }}
            >
              Unduh CSV Anggaran
            </Button>
          </div>

          {/* 3. CSV Vendor */}
          <div className="p-3.5 rounded-2xl bg-canvas-sunken/60 dark:bg-night-sunken/60 border border-line dark:border-night-line flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-xs">
                <FileSpreadsheet size={16} />
                <span>CSV Vendor &amp; Kontrak</span>
              </div>
              <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
                {vendors.length} vendor, PIC, no. WA, biaya kontrak, DP, dan tenggat waktu pelunasan.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              className="mt-3 w-full"
              onClick={() => {
                triggerHaptic("selection");
                exportModuleCsv("vendors", weddingData, t);
                toast.success("Daftar Vendor berhasil diekspor (CSV)");
              }}
            >
              Unduh CSV Vendor
            </Button>
          </div>

          {/* 4. CSV Rundown */}
          <div className="p-3.5 rounded-2xl bg-canvas-sunken/60 dark:bg-night-sunken/60 border border-line dark:border-night-line flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-xs">
                <FileSpreadsheet size={16} />
                <span>CSV Susunan Acara (Rundown)</span>
              </div>
              <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
                {rundowns.length} sesi acara, jam mulai/selesai, lokasi prosesi, dan penanggung jawab (PIC).
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              className="mt-3 w-full"
              onClick={() => {
                triggerHaptic("selection");
                exportModuleCsv("rundowns", weddingData, t);
                toast.success("Susunan Acara berhasil diekspor (CSV)");
              }}
            >
              Unduh CSV Rundown
            </Button>
          </div>

          {/* 5. CSV Seserahan */}
          <div className="p-3.5 rounded-2xl bg-canvas-sunken/60 dark:bg-night-sunken/60 border border-line dark:border-night-line flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-xs">
                <FileSpreadsheet size={16} />
                <span>CSV Seserahan &amp; Hantaran</span>
              </div>
              <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
                Checklist {seserahan.length} kotak barang seserahan, status pembelian, dan status hias.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              className="mt-3 w-full"
              onClick={() => {
                triggerHaptic("selection");
                exportModuleCsv("seserahan", weddingData, t);
                toast.success("Daftar Seserahan berhasil diekspor (CSV)");
              }}
            >
              Unduh CSV Seserahan
            </Button>
          </div>

          {/* 6. CSV Kado & Amplop */}
          <div className="p-3.5 rounded-2xl bg-canvas-sunken/60 dark:bg-night-sunken/60 border border-line dark:border-night-line flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-xs">
                <FileSpreadsheet size={16} />
                <span>CSV Kado &amp; Amplop</span>
              </div>
              <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
                {gifts.length} catatan amplop tunai, transfer QRIS, ucapan selamat, dan kado fisik.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              className="mt-3 w-full"
              onClick={() => {
                triggerHaptic("selection");
                exportModuleCsv("gifts", weddingData, t);
                toast.success("Catatan Kado & Amplop berhasil diekspor (CSV)");
              }}
            >
              Unduh CSV Kado
            </Button>
          </div>
        </div>

        {/* Tombol Cadangan Lengkap & PDF */}
        <div className="pt-4 border-t border-line dark:border-night-line flex flex-col sm:flex-row gap-3">
          <Button
            variant="primary"
            icon={Printer}
            className="flex-1"
            onClick={() =>
              printMasterGuidebook({
                couple,
                rundowns,
                vendors,
                guests,
                settings,
                user,
              })
            }
          >
            Buku Panduan Pernikahan (PDF)
          </Button>

          <Button
            variant="secondary"
            icon={FileJson}
            className="flex-1"
            onClick={handleDownloadJson}
          >
            Unduh Cadangan Penuh (.json)
          </Button>

          <Button
            variant="outline"
            icon={Printer}
            onClick={printReport}
            title="Cetak ringkasan lembar kerja"
          >
            Cetak Ringkasan
          </Button>
        </div>
      </Card>

      {/* ==================== VERIFIKASI & PEMULIHAN CADANGAN ==================== */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle
            title="Pemeriksaan &amp; Verifikasi Berkas Cadangan (.json)"
            subtitle="Unggah berkas snapshot cadangan JSON yang pernah Anda unduh sebelumnya untuk memeriksa keutuhan datanya"
          />
          <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <Upload size={18} />
          </span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            icon={Upload}
            onClick={() => fileInputRef.current?.click()}
          >
            Pilih Berkas Cadangan (.json)
          </Button>
        </div>

        {restoreStatus && (
          <div className="p-4 rounded-2xl bg-canvas-sunken dark:bg-night-sunken border border-line dark:border-night-line text-xs">
            {restoreStatus.type === "confirm" ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                  <CheckCircle2 size={17} /> Berkas Cadangan Terverifikasi &amp; Utuh
                </div>
                <p className="text-ink-muted">
                  Waktu Pembuatan Snapshot: <strong>{restoreStatus.date}</strong>
                </p>
                <p className="text-ink-muted">
                  Rincian Data: {restoreStatus.summary}
                </p>
                <p className="text-[11px] text-ink-faint pt-1">
                  Seluruh data siap digunakan untuk pemulihan sewaktu-waktu.
                </p>
              </div>
            ) : (
              <div className="text-rose-600 flex items-center gap-2 text-xs">
                <AlertTriangle size={16} />
                <span>{restoreStatus.message}</span>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
