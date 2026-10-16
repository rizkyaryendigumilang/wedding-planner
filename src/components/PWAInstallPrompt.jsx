import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Share2,
  PlusSquare,
  X,
  CheckCircle2,
  Sparkles,
  Smartphone,
  ExternalLink,
  Laptop,
} from "lucide-react";
import { usePWA } from "../lib/usePWA";

/**
 * Modal petunjuk untuk pengguna di dalam In-App Browser (misal: Instagram, WhatsApp, TikTok).
 */
export function InAppBrowserModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-ink/60 dark:bg-black/75 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="relative w-full max-w-sm rounded-3xl bg-canvas dark:bg-night-card border border-line dark:border-night-line p-6 shadow-lift text-ink dark:text-stone-100 z-10"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-ink-muted hover:bg-canvas-sunken dark:hover:bg-night-sunken transition"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 p-2 shadow-glow flex items-center justify-center shrink-0 border border-white/20">
              <ExternalLink className="text-white" size={24} />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base leading-tight">
                Buka di Browser Utama
              </h3>
              <p className="text-xs text-ink-faint mt-0.5">Untuk memasang aplikasi ke layar utama</p>
            </div>
          </div>

          <p className="text-xs text-ink-muted leading-relaxed mb-4">
            Anda sedang membuka tautan di dalam browser in-app (seperti WhatsApp / Instagram). Untuk memasang ke layar utama HP:
          </p>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-canvas-card dark:bg-night-sunken border border-line dark:border-night-line">
              <span className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold grid place-items-center shrink-0 text-[11px]">
                1
              </span>
              <p className="leading-relaxed">
                Ketuk menu <strong>titik tiga (⋮)</strong> atau tombol opsi di pojok kanan atas layar.
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-canvas-card dark:bg-night-sunken border border-line dark:border-night-line">
              <span className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold grid place-items-center shrink-0 text-[11px]">
                2
              </span>
              <p className="leading-relaxed">
                Pilih <strong>"Buka di Browser" / "Open in Chrome / Safari"</strong>.
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-canvas-card dark:bg-night-sunken border border-line dark:border-night-line">
              <span className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold grid place-items-center shrink-0 text-[11px]">
                3
              </span>
              <p className="leading-relaxed">
                Setelah terbuka di Chrome/Safari, Anda dapat memasangnya ke Layar Utama dengan 1-klik!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-[0.985] text-white font-medium text-xs shadow-glow transition"
          >
            Saya Mengerti
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/**
 * Modal instruksi khusus iOS (iPhone & iPad Safari).
 */
export function IOSInstallModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-ink/60 dark:bg-black/75 backdrop-blur-sm"
        />

        {/* Modal content */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="relative w-full max-w-sm rounded-3xl bg-canvas dark:bg-night-card border border-line dark:border-night-line p-6 shadow-lift text-ink dark:text-stone-100 z-10"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-ink-muted hover:bg-canvas-sunken dark:hover:bg-night-sunken transition"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 p-2 shadow-soft grid place-items-center shrink-0 border border-white/20">
              <img
                src="/logo-transparent.png"
                alt="Wedding Logo"
                className="w-full h-full object-contain filter drop-shadow"
              />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base leading-tight">
                Pasang di iPhone / iPad
              </h3>
              <p className="text-xs text-ink-faint mt-0.5">Tambahkan ke Layar Utama (Home Screen)</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-canvas-card dark:bg-night-sunken border border-line dark:border-night-line">
              <span className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold grid place-items-center shrink-0 text-[11px]">
                1
              </span>
              <p className="leading-relaxed">
                Di Safari, ketuk tombol <strong>Bagikan (Share)</strong>{" "}
                <Share2 size={13} className="inline text-rose-600 dark:text-rose-400 mx-0.5" /> di bilah alat Safari (bawah pada iPhone, atas pada iPad).
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-canvas-card dark:bg-night-sunken border border-line dark:border-night-line">
              <span className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold grid place-items-center shrink-0 text-[11px]">
                2
              </span>
              <p className="leading-relaxed">
                Gulir ke bawah pada menu opsi, lalu pilih{" "}
                <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>{" "}
                <PlusSquare size={13} className="inline text-rose-600 dark:text-rose-400 mx-0.5" />.
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-canvas-card dark:bg-night-sunken border border-line dark:border-night-line">
              <span className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold grid place-items-center shrink-0 text-[11px]">
                3
              </span>
              <p className="leading-relaxed">
                Ketuk tombol <strong>"Tambah" (Add)</strong> di pojok kanan atas. Ikon cincin pernikahan akan langsung terpasang di Layar Utama Anda!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-[0.985] text-white font-medium text-xs shadow-glow transition"
          >
            Siap, Saya Mengerti
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/**
 * Modal petunjuk untuk Desktop Chrome / Edge jika prompt native tidak muncul otomatis.
 */
export function DesktopInstallModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-ink/60 dark:bg-black/75 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-sm rounded-3xl bg-canvas dark:bg-night-card border border-line dark:border-night-line p-6 shadow-lift text-ink dark:text-stone-100 z-10"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-ink-muted hover:bg-canvas-sunken dark:hover:bg-night-sunken transition"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 p-2 shadow-glow flex items-center justify-center shrink-0 border border-white/20">
              <Laptop className="text-white" size={24} />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base leading-tight">
                Pasang di Laptop / Desktop
              </h3>
              <p className="text-xs text-ink-faint mt-0.5">Google Chrome, Microsoft Edge, atau Brave</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-canvas-card dark:bg-night-sunken border border-line dark:border-night-line">
              <span className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold grid place-items-center shrink-0 text-[11px]">
                1
              </span>
              <p className="leading-relaxed">
                Lihat di ujung kanan <strong>Address Bar (kolom URL browser)</strong> di atas.
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-canvas-card dark:bg-night-sunken border border-line dark:border-night-line">
              <span className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold grid place-items-center shrink-0 text-[11px]">
                2
              </span>
              <p className="leading-relaxed">
                Klik ikon <strong>Pasang (Install App)</strong> <Download size={13} className="inline text-rose-600 dark:text-rose-400 mx-0.5" /> atau menu titik tiga (⋮) ➔ <strong>"Install Wedding Planner"</strong>.
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-canvas-card dark:bg-night-sunken border border-line dark:border-night-line">
              <span className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold grid place-items-center shrink-0 text-[11px]">
                3
              </span>
              <p className="leading-relaxed">
                Aplikasi akan terbuka di jendela mandiri tanpa tab browser dan siap dibuka dari desktop atau start menu!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs shadow-glow transition"
          >
            Mengerti
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/**
 * Floating Banner Pintar 1-Klik: Melayang di atas bilah navigasi bawah (mobile)
 * atau di pojok kanan bawah (desktop), mengajak memasang aplikasi.
 */
export function PWAInstallFloatingBanner() {
  const { isStandalone, isIOS, isInApp, canPrompt, dismissed, dismissPrompt, promptInstall } = usePWA();
  const [iosModalOpen, setIosModalOpen] = useState(false);
  const [inAppModalOpen, setInAppModalOpen] = useState(false);
  const [desktopModalOpen, setDesktopModalOpen] = useState(false);

  // Jika sudah standalone atau user menolak di sesi ini, sembunyikan banner
  if (isStandalone || dismissed) return null;

  const handleInstallClick = () => {
    if (isInApp) {
      setInAppModalOpen(true);
    } else if (isIOS) {
      setIosModalOpen(true);
    } else if (canPrompt) {
      promptInstall();
    } else {
      setDesktopModalOpen(true);
    }
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 35, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 450, damping: 35, delay: 0.6 }}
          className="fixed z-40 inset-x-3 sm:inset-x-auto sm:right-6 max-w-md"
          style={{
            bottom: "calc(var(--nav-height) + var(--safe-bottom) + 0.85rem)",
          }}
        >
          <div className="relative overflow-hidden rounded-3xl bg-canvas-card/95 dark:bg-night-card/95 backdrop-blur-xl border border-rose-500/30 p-4 shadow-lift dark:shadow-glow/10">
            {/* Ambient accent background glow */}
            <div className="pointer-events-none absolute -right-10 -top-10 w-32 h-32 rounded-full bg-rose-500/10 blur-2xl" />

            <div className="flex items-center gap-3.5">
              {/* Logo squircle */}
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 p-2 shadow-soft grid place-items-center shrink-0 border border-white/20">
                  <img
                    src="/logo-transparent.png"
                    alt="Wedding Rings"
                    className="w-full h-full object-contain filter drop-shadow"
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-canvas dark:border-night grid place-items-center">
                  <Sparkles size={8} className="text-white" />
                </span>
              </div>

              {/* Text info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-display font-semibold text-[13px] leading-snug text-ink dark:text-stone-50 truncate">
                    Pasang ke Layar Utama
                  </p>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300">
                    1-Klik
                  </span>
                </div>
                <p className="text-[11px] text-ink-muted leading-tight mt-0.5 line-clamp-1">
                  Akses instan Wedding Planner Rizky &amp; Reina seperti aplikasi asli HP.
                </p>
              </div>

              {/* Dismiss X button */}
              <button
                type="button"
                onClick={dismissPrompt}
                className="p-1 rounded-xl text-ink-faint hover:text-ink hover:bg-canvas-sunken dark:hover:bg-night-sunken transition shrink-0"
                aria-label="Tutup ajakan pasang"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tombol aksi */}
            <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-line/60 dark:border-night-line/60">
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-[0.98] text-white text-xs font-semibold shadow-glow transition"
              >
                <Download size={14} />
                <span>Pasang Sekarang (1-Klik)</span>
              </button>

              <button
                type="button"
                onClick={dismissPrompt}
                className="py-2 px-3 rounded-xl text-ink-faint hover:text-ink text-xs transition"
              >
                Nanti
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <IOSInstallModal isOpen={iosModalOpen} onClose={() => setIosModalOpen(false)} />
      <InAppBrowserModal isOpen={inAppModalOpen} onClose={() => setInAppModalOpen(false)} />
      <DesktopInstallModal isOpen={desktopModalOpen} onClose={() => setDesktopModalOpen(false)} />
    </>
  );
}

/**
 * Banner Inline untuk Dasbor atau Pengaturan: Penjelasan fitur PWA & tombol pasang.
 */
export function PWAInstallBanner({ className = "" }) {
  const { isStandalone, isIOS, isInApp, canPrompt, promptInstall } = usePWA();
  const [iosModalOpen, setIosModalOpen] = useState(false);
  const [inAppModalOpen, setInAppModalOpen] = useState(false);
  const [desktopModalOpen, setDesktopModalOpen] = useState(false);

  const handleInstallClick = () => {
    if (isInApp) {
      setInAppModalOpen(true);
    } else if (isIOS) {
      setIosModalOpen(true);
    } else if (canPrompt) {
      promptInstall();
    } else {
      setDesktopModalOpen(true);
    }
  };

  if (isStandalone) {
    return (
      <div
        className={`flex items-center gap-3 p-4 rounded-3xl bg-sage-500/10 border border-sage-500/20 text-sage-800 dark:text-sage-200 text-xs ${className}`}
      >
        <div className="w-10 h-10 rounded-2xl bg-sage-500/20 grid place-items-center text-sage-600 dark:text-sage-300 shrink-0">
          <CheckCircle2 size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Aplikasi Terpasang di Layar Utama (PWA)</p>
          <p className="text-sage-700/80 dark:text-sage-300/80 mt-0.5">
            Wedding Planner berjalan mandiri dalam mode layar penuh dengan cache offline aktif.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-amber-500/10 border border-rose-500/20 p-4 sm:p-5 ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 p-2 shadow-soft grid place-items-center shrink-0 border border-white/20">
              <img
                src="/logo-transparent.png"
                alt="Wedding Logo"
                className="w-full h-full object-contain filter drop-shadow"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-display font-semibold text-sm text-ink dark:text-stone-100">
                  Pasang ke Layar Utama (PWA 1-Klik)
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300">
                  Android &amp; iOS
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                Buka Wedding Planner Rizky &amp; Reina langsung dari Home Screen HP tanpa mengetik URL, lebih cepat dan hemat kuota.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleInstallClick}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-semibold shadow-glow active:scale-[0.98] transition shrink-0"
          >
            <Smartphone size={15} />
            <span>Pasang 1-Klik Instan</span>
          </button>
        </div>
      </div>

      <IOSInstallModal isOpen={iosModalOpen} onClose={() => setIosModalOpen(false)} />
      <InAppBrowserModal isOpen={inAppModalOpen} onClose={() => setInAppModalOpen(false)} />
      <DesktopInstallModal isOpen={desktopModalOpen} onClose={() => setDesktopModalOpen(false)} />
    </>
  );
}

/**
 * Tombol instal PWA pintar (bisa ditaruh di Sidebar, Header, atau Pengaturan).
 */
export function PWAInstallButton({ className = "" }) {
  const { isStandalone, isIOS, isInApp, canPrompt, promptInstall } = usePWA();
  const [iosModalOpen, setIosModalOpen] = useState(false);
  const [inAppModalOpen, setInAppModalOpen] = useState(false);
  const [desktopModalOpen, setDesktopModalOpen] = useState(false);

  if (isStandalone) {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-2xl bg-sage-500/10 text-sage-700 dark:text-sage-300 text-xs ${className}`}
      >
        <CheckCircle2 size={15} className="shrink-0 text-sage-600 dark:text-sage-400" />
        <span className="truncate">Terpasang (PWA)</span>
      </div>
    );
  }

  const handleClick = () => {
    if (isInApp) {
      setInAppModalOpen(true);
    } else if (isIOS) {
      setIosModalOpen(true);
    } else if (canPrompt) {
      promptInstall();
    } else {
      setDesktopModalOpen(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 active:scale-[0.98] text-rose-700 dark:text-rose-300 text-xs font-medium transition ${className}`}
        title="Pasang aplikasi di layar utama HP / Tablet / Desktop (1-Klik)"
      >
        <Download size={15} className="shrink-0" />
        <span className="truncate">Pasang 1-Klik</span>
      </button>

      <IOSInstallModal isOpen={iosModalOpen} onClose={() => setIosModalOpen(false)} />
      <InAppBrowserModal isOpen={inAppModalOpen} onClose={() => setInAppModalOpen(false)} />
      <DesktopInstallModal isOpen={desktopModalOpen} onClose={() => setDesktopModalOpen(false)} />
    </>
  );
}
