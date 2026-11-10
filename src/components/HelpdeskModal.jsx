import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LifeBuoy,
  X,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Send,
  ExternalLink,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { modalBackdropVariants, modalDialogVariants } from "../lib/motion";
import { useModalA11y } from "../lib/useModalA11y";
import { sendHelpdeskReport, formatUserRole } from "../lib/helpdesk";
import { Button, Field } from "./ui";
import { triggerHaptic } from "../lib/haptic";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function HelpdeskModalDialog({
  onClose,
  user,
  initialComplaint = "",
  initialFromUrl = "",
}) {
  const [complaint, setComplaint] = useState(initialComplaint);
  const [photoFile, setPhotoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  // Aksesibilitas ESC & scroll lock
  useModalA11y(true, onClose);

  // Bersihkan memory URL object saat unmount atau saat berkas diganti
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = useCallback((file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Hanya berkas gambar (PNG, JPG, WebP, GIF) yang diperbolehkan.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Ukuran foto maksimal adalah 10MB.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setPhotoFile(file);
    setPreviewUrl(objectUrl);
    triggerHaptic("selection");
  }, [previewUrl]);

  const handleRemovePhoto = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setPhotoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    triggerHaptic("light");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    const trimmedComplaint = complaint.trim();
    if (!trimmedComplaint) {
      toast.warning("Mohon tuliskan deskripsi keluhan atau bantuan yang Anda butuhkan.");
      return;
    }

    setIsSubmitting(true);
    triggerHaptic("light");

    try {
      const activeUrl =
        initialFromUrl ||
        (typeof window !== "undefined" ? window.location.href : "");

      await sendHelpdeskReport({
        user,
        complaint: trimmedComplaint,
        photoFile,
        fromUrl: activeUrl,
        autoSubmit: true,
        category: "bug_error",
        isUrgent,
      });

      triggerHaptic("success");
      toast.success("Laporan berhasil dikirim! Membuka Helpdesk di tab baru…");
      onClose();
    } catch (err) {
      console.error("Gagal mengirim laporan kendala:", err);
      triggerHaptic("error");
      toast.error("Gagal mengirim laporan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleLabel = formatUserRole(user);
  const userName = user?.name || user?.username || "Pengguna Sesi";
  const currentPath =
    typeof window !== "undefined"
      ? window.location.hash || window.location.pathname
      : "/";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop Scrim */}
      <motion.div
        variants={modalBackdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        onClick={isSubmitting ? undefined : onClose}
        className="absolute inset-0 bg-ink/50 dark:bg-black/75 backdrop-blur-sm"
      />

      {/* Dialog Card */}
      <motion.div
        variants={modalDialogVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="relative w-full max-w-lg rounded-3xl bg-canvas-card dark:bg-night-card border border-line dark:border-night-line p-5 sm:p-6 shadow-lift z-10 max-h-[90dvh] overflow-y-auto scroll-area"
      >
        {/* Tombol Tutup */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-2 rounded-xl text-ink-muted hover:text-ink dark:hover:text-stone-100 hover:bg-canvas-sunken dark:hover:bg-night-sunken transition disabled:opacity-50"
          aria-label="Tutup"
        >
          <X size={18} />
        </button>

        {/* Header Modal */}
        <div className="flex items-start gap-3.5 mb-5 pr-8">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 grid place-items-center shrink-0">
            <LifeBuoy size={22} />
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-lg text-ink dark:text-stone-100">
              Bantuan &amp; Laporkan Kendala
            </h3>
            <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
              Kirimkan keluhan Anda langsung ke sistem VPS Helpdesk terpusat.
            </p>
          </div>
        </div>

        {/* Banner Konteks Sesi & Lokasi */}
        <div className="mb-4 p-3 rounded-2xl bg-canvas-sunken/60 dark:bg-night-sunken/60 border border-line/70 dark:border-night-line/70 text-xs flex items-start gap-2.5">
          <Info size={16} className="text-rose-500 shrink-0 mt-0.5" />
          <div className="min-w-0 leading-relaxed text-ink-muted">
            <span>Pelapor: </span>
            <strong className="text-ink dark:text-stone-200">{userName}</strong>
            <span className="mx-1">•</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
              {roleLabel}
            </span>
            <div className="text-[11px] text-ink-faint mt-0.5 truncate">
              Lokasi halaman: <code className="font-mono">{currentPath}</code>
            </div>
          </div>
        </div>

        {/* Formulir Keluhan */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Field Keluhan (Mandatory) */}
          <Field
            label="Deskripsi Keluhan atau Masalah *"
            hint="Jelaskan kendala, galat, atau bantuan yang Anda butuhkan secara terperinci."
          >
            <textarea
              rows={4}
              required
              autoFocus
              disabled={isSubmitting}
              placeholder="Contoh: Terjadi kesalahan saat menyimpan data vendor baru, muncul pesan koneksi terputus..."
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              className="field resize-none text-xs leading-relaxed"
            />
          </Field>

          {/* Field Foto / Bukti Masalah (Tidak Mandatory) */}
          <div>
            <label className="block text-[13px] font-medium text-ink-muted dark:text-stone-300 mb-1.5">
              Foto / Tangkapan Layar Kendala <span className="text-[11px] text-ink-faint font-normal">(Opsional)</span>
            </label>

            {previewUrl ? (
              <div className="relative rounded-2xl border border-line dark:border-night-line overflow-hidden bg-canvas-sunken/40 dark:bg-night-sunken/40 p-2.5">
                <img
                  src={previewUrl}
                  alt="Tangkapan layar kendala"
                  className="w-full max-h-48 object-contain rounded-xl bg-black/5 dark:bg-black/20"
                />
                <div className="flex items-center justify-between gap-3 mt-2 px-1">
                  <div className="flex items-center gap-2 min-w-0 text-[11px] text-ink-muted">
                    <ImageIcon size={14} className="shrink-0 text-rose-500" />
                    <span className="truncate">{photoFile?.name}</span>
                    <span className="text-ink-faint shrink-0">
                      ({photoFile?.size ? (photoFile.size / 1024).toFixed(0) : 0} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition shrink-0"
                  >
                    <Trash2 size={13} />
                    Hapus Foto
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => !isSubmitting && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
                  isDragging
                    ? "border-rose-500 bg-rose-500/5"
                    : "border-line dark:border-night-line hover:border-rose-400/60 hover:bg-canvas-sunken/40 dark:hover:bg-night-sunken/40"
                } ${isSubmitting ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div className="w-9 h-9 rounded-xl bg-canvas-sunken dark:bg-night-sunken text-ink-muted flex items-center justify-center">
                  <UploadCloud size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium text-ink dark:text-stone-200">
                    Klik atau seret foto bukti kendala ke sini
                  </p>
                  <p className="text-[11px] text-ink-faint mt-0.5">
                    Format PNG, JPG, WebP, atau GIF (Maks. 10MB)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
              </div>
            )}
          </div>

          {/* Opsi Kendala Mendesak (Urgent) */}
          <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-canvas-sunken/40 dark:bg-night-sunken/40 border border-line/60 dark:border-night-line/60 cursor-pointer select-none transition hover:bg-canvas-sunken/70 dark:hover:bg-night-sunken/70">
            <input
              type="checkbox"
              checked={isUrgent}
              onChange={(e) => {
                triggerHaptic("selection");
                setIsUrgent(e.target.checked);
              }}
              className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer accent-rose-600"
            />
            <div className="min-w-0 text-xs">
              <span className="font-semibold text-ink dark:text-stone-200 flex items-center gap-1.5">
                <span>Tandai sebagai kendala mendesak</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    isUrgent
                      ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                      : "bg-ink-faint/10 text-ink-faint"
                  }`}
                >
                  Urgent
                </span>
              </span>
              <p className="text-[11px] text-ink-muted mt-0.5 leading-relaxed">
                Beri prioritas tinggi bila kendala mengganggu jalannya resepsi atau data penting.
              </p>
            </div>
          </label>

          {/* Keterangan Integrasi VPS */}
          <div className="flex items-center gap-1.5 text-[11px] text-ink-faint pt-1">
            <ExternalLink size={12} className="shrink-0 text-ink-faint" />
            <span>
              Tiket otomatis dibuat di VPS Helpdesk dan formulir dibuka di tab baru.
            </span>
          </div>

          {/* Tombol Aksi */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line/60 dark:border-night-line/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={Send}
              loading={isSubmitting}
              disabled={isSubmitting || !complaint.trim()}
            >
              {isSubmitting ? "Mengirim Laporan…" : "Kirim ke Helpdesk"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/**
 * Modal Terpadu Laporkan Kendala / Bantuan ke VPS Helpdesk
 * ---------------------------------------------------------------------------
 * Menyediakan antarmuka ringkas & elegan untuk mengirimkan:
 * 1. Rincian keluhan / deskripsi kendala (Wajib)
 * 2. Foto tangkapan layar / bukti masalah (Opsional / Tidak Wajib)
 * 3. Konteks sesi login pengguna & lokasi halaman aktif
 */
export default function HelpdeskModal({
  isOpen,
  onClose,
  user,
  initialComplaint = "",
  initialFromUrl = "",
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <HelpdeskModalDialog
          onClose={onClose}
          user={user}
          initialComplaint={initialComplaint}
          initialFromUrl={initialFromUrl}
        />
      )}
    </AnimatePresence>
  );
}
