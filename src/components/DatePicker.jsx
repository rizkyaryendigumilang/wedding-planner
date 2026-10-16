import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  buildMonthGrid,
  addMonths,
  isSameDay,
  parseISO,
  toISO,
  rangeInclusive,
  rangePresets,
  MONTHS_LONG,
  WEEKDAYS,
} from "../lib/calendar";
import { formatDateShort } from "../lib/format";

/**
 * Kalender popover: satu untuk semua kolom tanggal di aplikasi.
 * Dipakai langsung (DatePicker) maupun dua kali berdampingan (DateRangePicker).
 *
 * Catatan desain: pada layar < 420px kalender tidak lagi menjadi popover kecil
 * melainkan panel penuh — kalender 7 kolom memang tidak muat di sembarang tempat.
 */
function CalendarPanel({
  month,
  onMonthChange,
  isSelected,
  isInRange,
  onPick,
  compact = false,
}) {
  const cells = useMemo(() => buildMonthGrid(month.getFullYear(), month.getMonth()), [month]);
  const today = new Date();

  return (
    <div className={compact ? "w-full" : "w-[17.5rem]"}>
      {/* Navigasi bulan */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          aria-label="Bulan sebelumnya"
          onClick={() => onMonthChange(addMonths(month, -1))}
          className="p-2 rounded-xl text-ink-muted hover:bg-canvas-sunken dark:hover:bg-night-sunken transition-colors focus-ring"
        >
          <ChevronLeft size={17} />
        </button>
        <p className="text-sm font-semibold text-ink dark:text-stone-100">
          {MONTHS_LONG[month.getMonth()]} {month.getFullYear()}
        </p>
        <button
          type="button"
          aria-label="Bulan berikutnya"
          onClick={() => onMonthChange(addMonths(month, 1))}
          className="p-2 rounded-xl text-ink-muted hover:bg-canvas-sunken dark:hover:bg-night-sunken transition-colors focus-ring"
        >
          <ChevronRight size={17} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {WEEKDAYS.map((d) => (
          <span
            key={d}
            className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint text-center py-1"
          >
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map(({ date, inMonth }) => {
          const selected = isSelected(date);
          const inRange = isInRange?.(date);
          const isToday = isSameDay(date, today);

          return (
            <button
              key={toISO(date)}
              type="button"
              onClick={() => onPick(date)}
              className={`relative h-9 rounded-xl text-[13px] font-medium transition-colors duration-100 tabular-nums focus-ring ${
                selected
                  ? "bg-rose-600 text-white hover:bg-rose-700"
                  : inRange
                    ? "bg-rose-500/12 text-rose-700 dark:text-rose-300"
                    : inMonth
                      ? "text-ink dark:text-stone-200 hover:bg-canvas-sunken dark:hover:bg-night-sunken"
                      : "text-ink-faint/50 hover:bg-canvas-sunken/60 dark:hover:bg-night-sunken/60"
              }`}
            >
              {date.getDate()}
              {isToday && !selected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-rose-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Popover generik dengan penutup klik-di-luar dan tombol Escape. */
function Popover({ open, onClose, children, align = "left" }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.99 }}
          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: align === "right" ? "top right" : "top left" }}
          className={`absolute z-50 mt-2 p-3.5 rounded-3xl bg-canvas-card dark:bg-night-card border border-line dark:border-night-line shadow-lift ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Kolom tanggal tunggal. `value`/`onChange` memakai format ISO "YYYY-MM-DD". */
export function DatePicker({ value, onChange, placeholder = "Pilih tanggal", className = "" }) {
  const [open, setOpen] = useState(false);
  const selected = parseISO(value);
  const [month, setMonth] = useState(() => selected || new Date());

  // Saat nilai berubah dari luar, geser tampilan bulan agar tanggal yang
  // terpilih selalu terlihat. Pola "menyesuaikan state saat render" (bukan di
  // dalam effect) adalah cara yang disarankan React untuk kasus turunan ini.
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    if (selected) setMonth(selected);
  }

  const pick = (date) => {
    onChange(toISO(date));
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="field flex items-center justify-between gap-2 text-left"
      >
        <span className={value ? "text-ink dark:text-stone-100" : "text-ink-faint"}>
          {value ? formatDateShort(value) : placeholder}
        </span>
        <span className="flex items-center gap-1.5 shrink-0">
          {value && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Kosongkan tanggal"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  onChange("");
                }
              }}
              className="p-1 rounded-lg text-ink-faint hover:text-rose-600 hover:bg-rose-500/10"
            >
              <X size={14} />
            </span>
          )}
          <Calendar size={16} className="text-ink-faint" />
        </span>
      </button>

      <Popover open={open} onClose={() => setOpen(false)}>
        <CalendarPanel
          month={month}
          onMonthChange={setMonth}
          isSelected={(d) => isSameDay(d, selected)}
          onPick={pick}
        />
        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-line dark:border-night-line">
          <button
            type="button"
            onClick={() => pick(new Date())}
            className="text-xs font-medium text-rose-600 dark:text-rose-300 px-2 py-1 rounded-lg hover:bg-rose-500/10"
          >
            Hari ini
          </button>
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="text-xs font-medium text-ink-muted px-2 py-1 rounded-lg hover:bg-canvas-sunken dark:hover:bg-night-sunken"
            >
              Kosongkan
            </button>
          )}
        </div>
      </Popover>
    </div>
  );
}

/**
 * Rentang tanggal: satu popover dengan dua kalender berdampingan, daftar preset
 * di sisi kiri, dan ringkasan nominal opsional (mis. total pengeluaran periode).
 */
export function DateRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
  onClear,
  presets = true,
  label,
  summary,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(null);

  const fromDate = parseISO(from);
  const toDate = parseISO(to);
  const [month, setMonth] = useState(() => fromDate || new Date());

  const presetList = useMemo(() => rangePresets(), []);

  const activePreset = presetList.find((p) => p.from === from && p.to === to);

  const handlePick = (date) => {
    // Klik pertama menetapkan awal, klik kedua menetapkan akhir, klik ketiga
    // memulai rentang baru — perilaku yang sama dengan pemilih tanggal Airbnb.
    if (!fromDate || (fromDate && toDate) || date < fromDate) {
      onFromChange(toISO(date));
      if (toDate) onToChange("");
    } else {
      onToChange(toISO(date));
      setOpen(false);
    }
  };

  const isSelected = (d) => isSameDay(d, fromDate) || isSameDay(d, toDate);
  const isInRange = (d) => {
    const end = toDate || hovered;
    if (!fromDate || !end) return false;
    const [start, stop] = fromDate <= end ? [fromDate, end] : [end, fromDate];
    return d > start && d < stop;
  };

  const rangeDays = rangeInclusive(fromDate, toDate).length;

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full field flex items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <Calendar size={16} className="text-ink-faint shrink-0" />
          <span className="min-w-0">
            {label && (
              <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                {label}
              </span>
            )}
            {from ? (
              <span className="text-[13px] font-medium text-ink dark:text-stone-100 truncate block">
                {formatDateShort(from)}
                {to ? ` — ${formatDateShort(to)}` : " — pilih tanggal akhir"}
              </span>
            ) : (
              <span className="text-[13px] text-ink-faint">Pilih rentang tanggal</span>
            )}
          </span>
        </span>
        <span className="flex items-center gap-2 shrink-0">
          {(from || to) && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Kosongkan rentang"
              onClick={(e) => {
                e.stopPropagation();
                onClear?.();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.stopPropagation();
                  onClear?.();
                }
              }}
              className="p-1 rounded-lg text-ink-faint hover:text-rose-600 hover:bg-rose-500/10"
            >
              <X size={14} />
            </span>
          )}
          {to ? (
            <span className="text-[11px] font-semibold text-ink-faint tabular-nums">
              {rangeDays} hari
            </span>
          ) : (
            <ChevronRight size={15} className="text-ink-faint" />
          )}
        </span>
      </button>

      <Popover open={open} onClose={() => setOpen(false)}>
        <div className="flex flex-col lg:flex-row gap-4">
          {presets && (
            <div className="lg:w-36 shrink-0 lg:border-r lg:border-line dark:lg:border-night-line lg:pr-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint mb-2 px-2">
                Cepat
              </p>
              <div className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
                {presetList.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      onFromChange(p.from);
                      onToChange(p.to);
                    }}
                    className={`shrink-0 text-left px-2.5 py-1.5 rounded-xl text-[12.5px] transition-colors ${
                      activePreset?.label === p.label
                        ? "bg-rose-500/12 text-rose-700 dark:text-rose-300 font-semibold"
                        : "text-ink-muted hover:bg-canvas-sunken dark:hover:bg-night-sunken"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div
            className="flex flex-col sm:flex-row gap-4"
            onMouseLeave={() => setHovered(null)}
          >
            <div onMouseOver={() => setHovered(null)}>
              <CalendarPanel
                month={month}
                onMonthChange={setMonth}
                isSelected={isSelected}
                isInRange={isInRange}
                onPick={handlePick}
              />
            </div>
            <div className="hidden sm:block">
              <CalendarPanel
                month={addMonths(month, 1)}
                onMonthChange={(m) => setMonth(addMonths(m, -1))}
                isSelected={isSelected}
                isInRange={isInRange}
                onPick={handlePick}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-3.5 pt-3.5 border-t border-line dark:border-night-line">
          <p className="text-xs text-ink-muted">
            {from ? (
              <>
                <b className="text-ink dark:text-stone-100">{formatDateShort(from)}</b>
                {to ? (
                  <>
                    {" "}
                    sampai <b className="text-ink dark:text-stone-100">{formatDateShort(to)}</b> •{" "}
                    {rangeDays} hari
                  </>
                ) : (
                  " — klik tanggal akhir"
                )}
              </>
            ) : (
              "Klik tanggal awal, lalu tanggal akhir."
            )}
          </p>
          <div className="flex items-center gap-3">
            {summary && (
              <span className="text-sm font-semibold text-ink dark:text-stone-100 tabular-nums">
                {summary}
              </span>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-ink text-canvas dark:bg-stone-100 dark:text-night"
            >
              Selesai
            </button>
          </div>
        </div>
      </Popover>
    </div>
  );
}

