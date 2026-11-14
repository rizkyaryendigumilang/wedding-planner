import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  CheckCheck,
  Calendar,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge, ToggleRow } from "./ui";
import { modalBackdropVariants, modalDialogVariants } from "../lib/motion";
import { useModalA11y } from "../lib/useModalA11y";
import { triggerHaptic } from "../lib/haptic";
import { generateNotifications } from "../lib/notifications";
import { useWedding } from "../lib/weddingData";

export default function NotificationCenterModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const weddingData = useWedding();
  const [tab, setTab] = useState("all"); // 'all', 'alerts', 'reminders', 'preferences'

  useModalA11y(isOpen, onClose);

  // Preferensi notifikasi lokal
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem("wedding_notification_prefs");
      return saved
        ? JSON.parse(saved)
        : {
            budgetAlerts: true,
            rsvpReminders: true,
            vendorAlerts: true,
            rundownAlerts: true,
            soundHaptic: true,
          };
    } catch (_) {
      return {
        budgetAlerts: true,
        rsvpReminders: true,
        vendorAlerts: true,
        rundownAlerts: true,
        soundHaptic: true,
      };
    }
  });

  const savePref = (key, val) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: val };
      try {
        localStorage.setItem("wedding_notification_prefs", JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  // State notifikasi yang sudah dibaca (disimpan di localStorage)
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem("wedding_read_notifications");
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  const allNotifications = useMemo(() => {
    return generateNotifications(weddingData, prefs);
  }, [weddingData, prefs]);

  const unreadCount = useMemo(() => {
    return allNotifications.filter((n) => !readIds.includes(n.id)).length;
  }, [allNotifications, readIds]);

  const markAllAsRead = () => {
    triggerHaptic("success");
    const allIds = allNotifications.map((n) => n.id);
    setReadIds(allIds);
    try {
      localStorage.setItem("wedding_read_notifications", JSON.stringify(allIds));
    } catch (_) {}
  };

  const markSingleAsRead = (id) => {
    if (!readIds.includes(id)) {
      setReadIds((prev) => {
        const next = [...prev, id];
        try {
          localStorage.setItem("wedding_read_notifications", JSON.stringify(next));
        } catch (_) {}
        return next;
      });
    }
  };

  const filteredItems = useMemo(() => {
    if (tab === "alerts") {
      return allNotifications.filter((n) => n.category === "alert");
    }
    if (tab === "reminders") {
      return allNotifications.filter((n) => n.category === "reminder" || n.category === "milestone");
    }
    return allNotifications;
  }, [allNotifications, tab]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          variants={modalBackdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
          className="fixed inset-0 bg-ink/50 dark:bg-black/70 backdrop-blur-sm"
        />

        {/* Dialog */}
        <motion.div
          variants={modalDialogVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="relative w-full max-w-lg bg-canvas-card dark:bg-night-card rounded-3xl border border-line dark:border-night-line shadow-lift overflow-hidden flex flex-col max-h-[88vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-line dark:border-night-line shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 grid place-items-center shrink-0">
                <Bell size={18} />
              </div>
              <div>
                <h2 className="font-display font-semibold text-ink dark:text-stone-100 flex items-center gap-2 text-base">
                  Pusat Notifikasi
                  {unreadCount > 0 && (
                    <Badge tone="rose">{unreadCount} Baru</Badge>
                  )}
                </h2>
                <p className="text-[11px] text-ink-muted">
                  Peringatan acara, pengingat tamu, & rekomendasi sistem
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && tab !== "preferences" && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="p-1.5 rounded-xl text-ink-muted hover:text-ink hover:bg-canvas-sunken dark:hover:bg-night-sunken transition text-xs flex items-center gap-1 focus-ring"
                  title="Tandai semua sudah dibaca"
                >
                  <CheckCheck size={16} />
                  <span className="hidden sm:inline text-[11px]">Tandai Dibaca</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-ink-muted hover:bg-canvas-sunken dark:hover:bg-night-sunken transition focus-ring"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center px-4 pt-2.5 border-b border-line dark:border-night-line gap-2 shrink-0 overflow-x-auto scrollbar-none">
            {[
              { id: "all", label: "Semua", count: allNotifications.length },
              {
                id: "alerts",
                label: "Peringatan",
                count: allNotifications.filter((n) => n.category === "alert").length,
              },
              {
                id: "reminders",
                label: "Pengingat",
                count: allNotifications.filter((n) => n.category === "reminder" || n.category === "milestone").length,
              },
              { id: "preferences", label: "Preferensi", count: null },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  triggerHaptic("selection");
                  setTab(t.id);
                }}
                className={`pb-2.5 px-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                  tab === t.id
                    ? "border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-300"
                    : "border-transparent text-ink-muted hover:text-ink dark:hover:text-stone-300"
                }`}
              >
                <span>{t.label}</span>
                {t.count !== null && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      tab === t.id
                        ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                        : "bg-canvas-sunken dark:bg-night-sunken text-ink-faint"
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Body Content */}
          <div className="p-4 overflow-y-auto flex-1 space-y-3">
            {tab === "preferences" ? (
              <div className="space-y-2">
                <p className="text-xs text-ink-muted px-2 mb-2">
                  Atur jenis peringatan dan pengingat yang ingin Anda terima di Wedding Planner:
                </p>
                <ToggleRow
                  icon={AlertTriangle}
                  label="Peringatan Anggaran"
                  hint="Beri tahu jika total pengeluaran mendekati atau melampaui target anggaran"
                  checked={prefs.budgetAlerts}
                  onChange={(val) => savePref("budgetAlerts", val)}
                />
                <ToggleRow
                  icon={Clock}
                  label="Pengingat Konfirmasi Tamu (RSVP)"
                  hint="Ingatkan daftar tamu yang belum merespon status kehadiran"
                  checked={prefs.rsvpReminders}
                  onChange={(val) => savePref("rsvpReminders", val)}
                />
                <ToggleRow
                  icon={CheckCircle2}
                  label="Peringatan Tagihan Vendor"
                  hint="Pantau sisa pelunasan vendor sebelum tanggal jatuh tempo acara"
                  checked={prefs.vendorAlerts}
                  onChange={(val) => savePref("vendorAlerts", val)}
                />
                <ToggleRow
                  icon={Calendar}
                  label="Pengingat Susunan Acara (Rundown)"
                  hint="Beri tahu jika ada sesi acara yang belum memiliki penanggung jawab (PIC)"
                  checked={prefs.rundownAlerts}
                  onChange={(val) => savePref("rundownAlerts", val)}
                />
                <ToggleRow
                  icon={Sparkles}
                  label="Getaran & Umpan Balik Haptic"
                  hint="Aktifkan getaran halus di ponsel saat berinteraksi"
                  checked={prefs.soundHaptic}
                  onChange={(val) => savePref("soundHaptic", val)}
                />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-sage-500/10 text-sage-600 dark:text-sage-300 grid place-items-center mx-auto mb-3">
                  <CheckCircle2 size={24} />
                </div>
                <p className="font-semibold text-sm text-ink dark:text-stone-200">
                  Semuanya Siap & Aman!
                </p>
                <p className="text-xs text-ink-muted mt-1 max-w-xs mx-auto">
                  Tidak ada pemberitahuan mendesak saat ini. Persiapan pernikahan Anda berjalan tertib.
                </p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const isRead = readIds.includes(item.id);
                const isUrgent = item.type === "urgent";
                const isWarning = item.type === "warning";

                return (
                  <div
                    key={item.id}
                    onClick={() => markSingleAsRead(item.id)}
                    className={`p-3.5 rounded-2xl border transition relative flex items-start gap-3 ${
                      !isRead
                        ? "bg-rose-500/5 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/40"
                        : "bg-canvas-card dark:bg-night-card border-line dark:border-night-line opacity-85"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl shrink-0 grid place-items-center ${
                        isUrgent
                          ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                          : isWarning
                          ? "bg-brass-400/20 text-brass-700 dark:text-brass-300"
                          : "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                      }`}
                    >
                      {isUrgent ? (
                        <AlertTriangle size={17} />
                      ) : isWarning ? (
                        <Clock size={17} />
                      ) : (
                        <Bell size={17} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="text-sm font-semibold text-ink dark:text-stone-100 truncate">
                            {item.title}
                          </h4>
                          {!isRead && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                          )}
                        </div>
                        <Badge
                          tone={isUrgent ? "rose" : isWarning ? "amber" : "sky"}
                        >
                          {item.category === "alert"
                            ? "Peringatan"
                            : item.category === "milestone"
                            ? "Milestone"
                            : "Pengingat"}
                        </Badge>
                      </div>

                      <p className="text-xs text-ink-muted dark:text-stone-300 leading-relaxed mb-2.5">
                        {item.message}
                      </p>

                      {item.actionUrl && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markSingleAsRead(item.id);
                            onClose();
                            navigate(item.actionUrl);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:underline"
                        >
                          <span>{item.actionLabel || "Buka Halaman"}</span>
                          <ArrowRight size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
