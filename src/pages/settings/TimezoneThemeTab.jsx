import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Languages,
  Check,
  Moon,
  Sun,
  Clock,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { Card, Button, SectionTitle, ToggleSwitch } from "../../components/ui";
import {
  TIMEZONES,
  getCurrentTimeInTimezone,
  formatDateFormal,
  formatDateId,
  formatDateConfigured,
} from "../../lib/format";

const EASE = [0.22, 1, 0.36, 1];

export default function TimezoneThemeTab({
  settings,
  saveSettings,
  weddingDate,
  isDark,
  toggle,
  followsSystem,
  lang,
  userSelectedLang,
  setUserSelectedLang,
  handleApplyLanguage,
  reduce,
  t,
}) {
  const [eventTimezone, setEventTimezone] = useState(() => settings?.event_timezone || "Asia/Jakarta");
  const [dateFormatStyle, setDateFormatStyle] = useState(() => settings?.date_format_style || "formal");
  const [savingTimezone, setSavingTimezone] = useState(false);
  const [savedTimezone, setSavedTimezone] = useState(false);
  const [currentTimeInTz, setCurrentTimeInTz] = useState(() => getCurrentTimeInTimezone(eventTimezone));

  const selectedLang = userSelectedLang ?? lang;
  const ThemeIcon = isDark ? Sun : Moon;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeInTz(getCurrentTimeInTimezone(eventTimezone));
    }, 10000);
    return () => clearInterval(timer);
  }, [eventTimezone]);

  const handleSaveTimezone = async () => {
    setSavingTimezone(true);
    setSavedTimezone(false);
    try {
      await saveSettings({
        event_timezone: eventTimezone,
        date_format_style: dateFormatStyle,
      });
      setSavedTimezone(true);
      toast.success(t ? t("Zona waktu & format tanggal berhasil disimpan.") : "Zona waktu & format tanggal berhasil disimpan.");
      setTimeout(() => setSavedTimezone(false), 2400);
    } catch (err) {
      console.error(err);
      toast.error(t ? t("Gagal menyimpan preferensi waktu:") + " " + (err?.message || err) : "Gagal menyimpan: " + (err?.message || err));
    } finally {
      setSavingTimezone(false);
    }
  };

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="space-y-6"
    >
      {/* Pilihan Bahasa Aplikasi */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <SectionTitle>{t("Bahasa Aplikasi")}</SectionTitle>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
              {t("Pilih bahasa yang dipakai di seluruh halaman aplikasi.")}
            </p>
          </div>
          <span className="p-2.5 rounded-2xl bg-canvas-sunken dark:bg-night-sunken text-ink-muted shrink-0">
            <Languages size={18} />
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {/* Bahasa Indonesia */}
          <button
            type="button"
            onClick={() => setUserSelectedLang("id")}
            className={`p-4 rounded-3xl border text-left transition-colors duration-150 focus-ring relative ${
              selectedLang === "id"
                ? "border-rose-500 bg-rose-500/5 dark:bg-rose-500/10 shadow-sm ring-1 ring-rose-500/30"
                : "border-line dark:border-night-line hover:bg-canvas-sunken dark:hover:bg-night-sunken"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="block text-sm font-semibold text-ink dark:text-stone-100">
                Bahasa Indonesia
              </span>
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                  selectedLang === "id"
                    ? "bg-rose-600 text-white"
                    : "border border-line-strong dark:border-night-line"
                }`}
              >
                {selectedLang === "id" && <Check size={12} strokeWidth={3} />}
              </span>
            </div>
            <span className="block text-xs text-ink-muted mt-1">
              {t("Bawaan aplikasi")} (Bahasa Indonesia)
            </span>
            <div className="mt-2.5 flex items-center gap-1.5">
              {lang === "id" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {t("Aktif")}
                </span>
              ) : (
                selectedLang === "id" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                    {t("Dipilih")}
                  </span>
                )
              )}
            </div>
          </button>

          {/* English */}
          <button
            type="button"
            onClick={() => setUserSelectedLang("en")}
            className={`p-4 rounded-3xl border text-left transition-colors duration-150 focus-ring relative ${
              selectedLang === "en"
                ? "border-rose-500 bg-rose-500/5 dark:bg-rose-500/10 shadow-sm ring-1 ring-rose-500/30"
                : "border-line dark:border-night-line hover:bg-canvas-sunken dark:hover:bg-night-sunken"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="block text-sm font-semibold text-ink dark:text-stone-100">
                English
              </span>
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                  selectedLang === "en"
                    ? "bg-rose-600 text-white"
                    : "border border-line-strong dark:border-night-line"
                }`}
              >
                {selectedLang === "en" && <Check size={12} strokeWidth={3} />}
              </span>
            </div>
            <span className="block text-xs text-ink-muted mt-1">
              English translation (US)
            </span>
            <div className="mt-2.5 flex items-center gap-1.5">
              {lang === "en" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {t("Aktif")}
                </span>
              ) : (
                selectedLang === "en" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                    {t("Dipilih")}
                  </span>
                )
              )}
            </div>
          </button>
        </div>

        {/* Action Bar dengan Tombol Terapkan */}
        <div className="mt-4 pt-3.5 border-t border-line/60 dark:border-night-line/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs">
            {selectedLang !== lang ? (
              <span className="text-amber-700 dark:text-amber-300 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                {t("Pilihan bahasa belum diterapkan.")}
              </span>
            ) : (
              <span className="text-ink-faint">
                {t("Bahasa saat ini: ")}
                <strong className="text-ink dark:text-stone-200">
                  {lang === "id" ? "Bahasa Indonesia" : "English"}
                </strong>
              </span>
            )}
          </div>
          <Button
            type="button"
            onClick={handleApplyLanguage}
            icon={Check}
            size="sm"
            variant={selectedLang !== lang ? "primary" : "secondary"}
          >
            {t("Terapkan")}
          </Button>
        </div>
      </Card>

      {/* Mode Tampilan (Dark / Light) */}
      <Card>
        <SectionTitle>Mode Tampilan</SectionTitle>
        <button
          onClick={toggle}
          className="w-full flex items-center gap-4 mt-4 p-3 -mx-3 rounded-2xl hover:bg-canvas-sunken dark:hover:bg-night-sunken transition-colors text-left focus-ring"
        >
          <span className="p-2.5 rounded-2xl bg-canvas-sunken dark:bg-night-sunken text-ink-muted shrink-0">
            <ThemeIcon size={19} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-medium">
              {isDark ? "Mode gelap (Dark Mode)" : "Mode terang (Light Mode)"}
            </span>
            <span className="block text-xs text-ink-faint mt-0.5">
              {followsSystem ? "Mengikuti setelan sistem operasi perangkat" : "Dipilih manual"}
            </span>
          </span>
          <ToggleSwitch checked={isDark} onChange={toggle} aria-label="Toggle dark mode" />
        </button>
      </Card>

      {/* Zona Waktu Acara */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <SectionTitle>{t("Zona Waktu Acara")}</SectionTitle>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
              Menentukan perhitungan waktu rundown dan hitungan mundur acara sesuai lokasi pernikahan.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300">
            <Clock size={13} />
            <span>{currentTimeInTz}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          {TIMEZONES.map((tz) => (
            <button
              key={tz.value}
              type="button"
              onClick={() => {
                setEventTimezone(tz.value);
                setCurrentTimeInTz(getCurrentTimeInTimezone(tz.value));
              }}
              className={`p-4 rounded-3xl border text-left transition-colors duration-150 focus-ring relative ${
                eventTimezone === tz.value
                  ? "border-rose-500 bg-rose-500/5 dark:bg-rose-500/10 shadow-sm ring-1 ring-rose-500/30"
                  : "border-line dark:border-night-line hover:bg-canvas-sunken dark:hover:bg-night-sunken"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-display font-semibold text-sm text-ink dark:text-stone-100">
                  {tz.short}
                </span>
                {eventTimezone === tz.value && (
                  <span className="w-5 h-5 rounded-full bg-rose-600 text-white grid place-items-center">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-ink-muted">UTC+{tz.offset}</p>
              <p className="text-[11px] text-ink-faint mt-1 leading-tight">{tz.desc}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* Format Tampilan Tanggal Acara */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <SectionTitle>{t("Format Tampilan Tanggal")}</SectionTitle>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
              Pilih gaya penulisan tanggal di dashboard, rundown, dan kartu undangan.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          {[
            { id: "formal", label: "Formal Indonesia", example: formatDateFormal(weddingDate) },
            { id: "standard", label: "Standar Ringkas", example: formatDateId(weddingDate) },
            { id: "numeric", label: "Numerik DD-MM-YYYY", example: formatDateConfigured(weddingDate, "numeric") },
          ].map((fmt) => (
            <button
              key={fmt.id}
              type="button"
              onClick={() => setDateFormatStyle(fmt.id)}
              className={`p-4 rounded-3xl border text-left transition-colors duration-150 focus-ring relative ${
                dateFormatStyle === fmt.id
                  ? "border-rose-500 bg-rose-500/5 dark:bg-rose-500/10 shadow-sm ring-1 ring-rose-500/30"
                  : "border-line dark:border-night-line hover:bg-canvas-sunken dark:hover:bg-night-sunken"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs text-ink dark:text-stone-100">
                  {fmt.label}
                </span>
                {dateFormatStyle === fmt.id && (
                  <span className="w-5 h-5 rounded-full bg-rose-600 text-white grid place-items-center">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </div>
              <p className="text-xs font-mono font-medium text-rose-600 dark:text-rose-400 mt-2 truncate">
                {fmt.example}
              </p>
            </button>
          ))}
        </div>

        <div className="flex justify-end mt-4 pt-3 border-t border-line dark:border-night-line">
          <Button
            type="button"
            variant="primary"
            icon={savedTimezone ? Check : Save}
            loading={savingTimezone}
            onClick={handleSaveTimezone}
          >
            {savedTimezone ? "Tersimpan!" : "Simpan Waktu & Tanggal"}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
