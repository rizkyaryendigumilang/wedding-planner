import { useState } from "react";
import {
  LifeBuoy,
  Send,
  FolderSync,
  ExternalLink,
} from "lucide-react";
import { Card, SectionTitle, Button, Badge } from "../../components/ui";
import { laporkanKendalaKeHelpdesk } from "../../lib/helpdesk";
import { toast } from "sonner";
import RekeningQrisTab from "./RekeningQrisTab";

export default function IntegrationsTab({
  settings,
  saveSettings,
  saving,
}) {
  const [driveFolderUrl, setDriveFolderUrl] = useState(
    settings?.google_drive_folder_url || ""
  );
  const [savingDrive, setSavingDrive] = useState(false);

  const handleSaveDrive = async () => {
    setSavingDrive(true);
    try {
      await saveSettings({ google_drive_folder_url: driveFolderUrl.trim() });
      toast.success("Tautan Google Drive berhasil disimpan!");
    } catch (err) {
      toast.error("Gagal menyimpan tautan Google Drive: " + (err?.message || ""));
    } finally {
      setSavingDrive(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Integrasi Rekening & QRIS Angpao */}
      <RekeningQrisTab
        settings={settings}
        saveSettings={saveSettings}
        saving={saving}
      />

      {/* 2. Integrasi Layanan Eksternal */}
      <Card className="space-y-5">
        <SectionTitle
          title="Integrasi Layanan Eksternal & Cloud"
          subtitle="Hubungkan Wedding Planner dengan penyimpanan cloud dan portal dukungan"
        />

        {/* Google Drive Sync */}
        <div className="p-4 rounded-2xl bg-canvas-sunken dark:bg-night-sunken border border-line dark:border-night-line space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 grid place-items-center shrink-0">
              <FolderSync size={18} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-ink dark:text-stone-100">
                Google Drive Photo Folder Sync
              </h4>
              <p className="text-xs text-ink-muted">
                Tautkan folder Google Drive dokumentasi foto prewedding & hari-H untuk diakses fotografer
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <input
              type="url"
              placeholder="https://drive.google.com/drive/folders/…"
              value={driveFolderUrl}
              onChange={(e) => setDriveFolderUrl(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-night-card border border-line dark:border-night-line text-xs text-ink dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <Button
              variant="primary"
              size="sm"
              loading={savingDrive}
              onClick={handleSaveDrive}
            >
              Simpan Tautan
            </Button>
          </div>
        </div>

        {/* Helpdesk Integration */}
        <div className="p-4 rounded-2xl bg-canvas-sunken dark:bg-night-sunken border border-line dark:border-night-line space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 grid place-items-center shrink-0">
                <LifeBuoy size={18} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-ink dark:text-stone-100">
                  Helpdesk Support Handoff (43.156.236.102)
                </h4>
                <p className="text-xs text-ink-muted">
                  Sistem tiket otomatis terhubung langsung ke portal helpdesk server
                </p>
              </div>
            </div>
            <Badge tone="sage">Terhubung</Badge>
          </div>

          <p className="text-xs text-ink-muted leading-relaxed">
            Tiket laporan kendala yang dikirim pengguna otomatis memuat parameter aplikasi, identitas akun aktif, URL halaman, dan tangkapan layar opsional.
          </p>

          <Button
            variant="neutral"
            size="sm"
            icon={ExternalLink}
            onClick={() => {
              laporkanKendalaKeHelpdesk({
                subject: "Uji Coba Integrasi Helpdesk dari Pengaturan",
                description: "Verifikasi koneksi sistem handoff helpdesk berjalan lancar",
                category: "pertanyaan_fitur",
              });
            }}
          >
            Uji Coba Kirim Tiket Helpdesk
          </Button>
        </div>

        {/* WhatsApp Gateway Handoff */}
        <div className="p-4 rounded-2xl bg-canvas-sunken dark:bg-night-sunken border border-line dark:border-night-line space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 grid place-items-center shrink-0">
                <Send size={18} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-ink dark:text-stone-100">
                  WhatsApp Direct Web / App Gateway
                </h4>
                <p className="text-xs text-ink-muted">
                  Protokol URL wa.me dan api.whatsapp.com untuk pengiriman pesan personalisasi instan
                </p>
              </div>
            </div>
            <Badge tone="sage">Aktif</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
