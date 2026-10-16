import { motion, useReducedMotion } from "framer-motion";
import { Loader2, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState, memo } from "react";
import { parseRupiahInput, formatRupiahInput } from "../lib/format";

/* ========================================================================== */
/*  Kerangka halaman                                                          */
/* ========================================================================== */

/**
 * Pembungkus animasi masuk. Durasi sengaja pendek (180ms) — transisi panjang
 * terasa lambat saat berpindah menu bolak-balik.
 */
export function Page({ children, className = "" }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className={`space-y-5 sm:space-y-6 ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function PageHeader({ title, subtitle, icon: Icon, action, eyebrow }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3.5 min-w-0">
        {Icon && (
          <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-300 shrink-0">
            <Icon size={21} strokeWidth={1.9} />
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint mb-1">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-2xl sm:text-[28px] font-semibold tracking-tight text-ink dark:text-stone-50">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-ink-muted mt-1 max-w-2xl">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "", padded = true, as: Tag = "div", ...rest }) {
  return (
    <Tag
      className={`bg-canvas-card dark:bg-night-card rounded-3xl border border-line dark:border-night-line shadow-soft ${
        padded ? "p-5 sm:p-6" : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ========================================================================== */
/*  Tombol                                                                    */
/* ========================================================================== */

const BUTTON_VARIANTS = {
  // Aksi utama. Warna rose-600 dipakai konsisten untuk seluruh aksi positif.
  primary:
    "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-soft disabled:bg-rose-300 disabled:shadow-none",
  // Aksi sekunder di dalam kartu.
  neutral:
    "bg-canvas-sunken dark:bg-night-sunken text-ink dark:text-stone-200 hover:bg-line dark:hover:bg-night-line",
  // Aksi di atas permukaan berwarna (hero).
  onColor: "bg-white/15 text-white border border-white/25 hover:bg-white/25 backdrop-blur-sm",
  ghost:
    "text-ink-muted hover:text-ink dark:hover:text-stone-100 hover:bg-canvas-sunken dark:hover:bg-night-sunken",
  danger:
    "text-rose-600 hover:bg-rose-500/10 dark:text-rose-300",
  outline:
    "border border-line dark:border-night-line text-ink dark:text-stone-200 hover:bg-canvas-sunken dark:hover:bg-night-sunken",
};

const BUTTON_SIZES = {
  sm: "text-[13px] px-3 py-2 rounded-xl gap-1.5",
  md: "text-sm px-4 py-2.5 rounded-2xl gap-2",
  lg: "text-[15px] px-5 py-3.5 rounded-2xl gap-2",
  // Target sentuh minimal 44px — ukuran ikon tunggal yang nyaman di jempol.
  icon: "p-2.5 rounded-xl",
};

/**
 * Satu tombol untuk seluruh aplikasi. `active:scale` di bawah 1 memberi umpan
 * balik fisik yang membuat sentuhan terasa "kena", bukan sekadar berubah warna.
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  className = "",
  loading = false,
  ...rest
}) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 ease-glide active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none focus-ring whitespace-nowrap ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin shrink-0" />
      ) : (
        Icon && <Icon size={size === "sm" ? 15 : 17} className="shrink-0" strokeWidth={2} />
      )}
      {children}
      {IconRight && <IconRight size={15} className="shrink-0" />}
    </button>
  );
}

/* ========================================================================== */
/*  Data & status                                                             */
/* ========================================================================== */

export function Badge({ children, tone = "gray", className = "" }) {
  const tones = {
    gray: "bg-canvas-sunken text-ink-muted dark:bg-night-sunken dark:text-stone-300",
    rose: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
    sage: "bg-sage-500/14 text-sage-700 dark:text-sage-300",
    amber: "bg-brass-400/18 text-brass-700 dark:text-brass-300",
    sky: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
    plum: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap ${tones[tone] || tones.gray} ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * Kartu statistik. Angka ditampilkan dengan `tabular-nums` supaya lebar digit
 * tidak berubah-ubah saat nilainya diperbarui.
 */
export const StatCard = memo(function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "rose",
  delay = 0,
  to,
  compactValue = false,
}) {
  const tones = {
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
    sage: "bg-sage-500/12 text-sage-600 dark:text-sage-300",
    amber: "bg-brass-400/16 text-brass-600 dark:text-brass-300",
    sky: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
    plum: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
    neutral: "bg-canvas-sunken text-ink-muted dark:bg-night-sunken dark:text-stone-300",
  };

  const reduce = useReducedMotion();
  const body = (
    <Card className="h-full group relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
            {label}
          </p>
          <p
            className={`font-display font-semibold mt-1.5 text-ink dark:text-stone-50 tabular-nums ${
              compactValue ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"
            }`}
          >
            {value}
          </p>
          {sub && <p className="text-xs text-ink-muted mt-1.5 leading-relaxed">{sub}</p>}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-2xl shrink-0 ${tones[tone] || tones.rose}`}>
            <Icon size={19} strokeWidth={1.9} />
          </div>
        )}
      </div>
      {to && (
        <ArrowRight
          size={15}
          className="absolute bottom-5 right-5 text-ink-faint opacity-0 -translate-x-1 transition-all duration-200 ease-glide group-hover:opacity-100 group-hover:translate-x-0"
        />
      )}
    </Card>
  );

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduce ? 0 : delay, type: "spring", stiffness: 280, damping: 26 }}
      className="h-full"
    >
      {to ? (
        <Link to={to} className="block h-full focus-ring rounded-3xl">
          {body}
        </Link>
      ) : (
        body
      )}
    </motion.div>
  );
});

export function ProgressBar({ value, tone = "bg-rose-500", height = "h-2", trackClassName = "" }) {
  const clamped = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`w-full bg-canvas-sunken dark:bg-night-sunken ${height} rounded-full overflow-hidden ${trackClassName}`}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={`h-full ${tone} rounded-full`}
      />
    </div>
  );
}

/** Angka besar yang menghitung naik saat pertama muncul di layar. */
export function Counter({ value, suffix = "", prefix = "", duration = 900, className = "" }) {
  const frame = useRef();
  const reduce = useReducedMotion();

  // Nilai awal langsung memakai nilai akhir bila animasi dimatikan — tidak ada
  // alasan untuk menunda angka yang sudah benar hanya demi animasi.
  const [display, setDisplay] = useState(() => (reduce ? Number(value) || 0 : 0));

  useEffect(() => {
    if (reduce) return undefined;

    const start = performance.now();
    const from = 0;
    const to = Number(value) || 0;

    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      // easeOutExpo — melambat di akhir sehingga angka terasa "mendarat".
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setDisplay(from + (to - from) * eased);
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [value, duration, reduce]);

  // `display` diabaikan sepenuhnya saat reduced-motion aktif.
  const shown = reduce ? Number(value) || 0 : display;

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {Math.round(shown).toLocaleString("id-ID")}
      {suffix}
    </span>
  );
}

/* ========================================================================== */
/*  Keadaan kosong / memuat / galat                                           */
/* ========================================================================== */

export function Loading({ label = "Menyiapkan data…" }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-ink-faint">
      <Loader2 className="animate-spin" size={24} />
      <p className="text-sm">{label}</p>
    </div>
  );
}

/** Kerangka muat berbentuk kartu supaya tata letak tidak meloncat saat data tiba. */
export function Skeleton({ className = "" }) {
  return (
    <div
      className={`rounded-2xl bg-gradient-to-r from-canvas-sunken via-line to-canvas-sunken dark:from-night-sunken dark:via-night-line dark:to-night-sunken bg-[length:200%_100%] animate-shimmer ${className}`}
    />
  );
}

export function PageSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3.5 w-64" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-3xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-3xl" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 rounded-2xl" />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <Card className="text-center py-14">
      <div className="flex flex-col items-center gap-3">
        <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500">
          <AlertTriangle size={22} />
        </div>
        <p className="text-sm text-ink dark:text-stone-200 font-medium">{message}</p>
        <p className="text-xs text-ink-faint max-w-sm">
          Pastikan PocketBase berjalan di port 8090, lalu muat ulang halaman.
        </p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
            Coba lagi
          </Button>
        )}
      </div>
    </Card>
  );
}

export function EmptyState({ message, hint, icon: Icon, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center gap-2.5">
      {Icon && (
        <div className="p-3 rounded-2xl bg-canvas-sunken dark:bg-night-sunken text-ink-faint">
          <Icon size={22} strokeWidth={1.7} />
        </div>
      )}
      <p className="text-sm text-ink-muted max-w-xs">{message}</p>
      {hint && <p className="text-xs text-ink-faint max-w-xs">{hint}</p>}
      {action}
    </div>
  );
}

/* ========================================================================== */
/*  Tata letak kecil                                                          */
/* ========================================================================== */

export function SectionTitle({ children, count, action }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <h2 className="font-display text-base font-semibold text-ink dark:text-stone-100 truncate">
          {children}
        </h2>
        {count != null && (
          <span className="text-xs font-medium text-ink-faint tabular-nums">{count}</span>
        )}
      </div>
      {action}
    </div>
  );
}

/** Deretan chip yang bisa digeser mendatar di layar sempit. */
export function ChipGroup({ children, className = "" }) {
  return (
    <div className={`flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-0.5 ${className}`}>
      {children}
    </div>
  );
}

export function Chip({ active, children, className = "", ...rest }) {
  return (
    <button
      className={`shrink-0 px-3.5 py-2 rounded-2xl text-[13px] font-medium transition-colors duration-150 focus-ring ${
        active
          ? "bg-ink text-canvas dark:bg-stone-100 dark:text-night"
          : "bg-canvas-card dark:bg-night-card border border-line dark:border-night-line text-ink-muted hover:text-ink dark:hover:text-stone-100"
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Baris label + nilai untuk daftar rincian. */
export function KeyValue({ label, value, tone = "", mono = false }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-[13px] text-ink-muted shrink-0">{label}</span>
      <span
        className={`text-sm font-semibold text-right text-ink dark:text-stone-100 ${
          mono ? "tabular-nums" : ""
        } ${tone}`}
      >
        {value}
      </span>
    </div>
  );
}

/* ========================================================================== */
/*  Tabel                                                                     */
/* ========================================================================== */

/**
 * Tabel data.
 * Di layar sempit tabel TIDAK dipaksa muat — ia digeser mendatar dengan
 * "isyarat tepi" (gradasi) supaya jelas masih ada kolom di sebelah kanan.
 * Cara ini lebih baik daripada menyusun ulang tabel menjadi daftar kartu untuk
 * data bertabular, karena hubungan baris-kolom tetap terjaga.
 */
export function Table({ head, children, className = "" }) {
  return (
    <div className={`relative -mx-5 sm:mx-0 ${className}`}>
      <div className="overflow-x-auto scroll-area px-5 sm:px-0">
        <table className="w-full min-w-[36rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line dark:border-night-line">
              {head.map((h, i) => (
                <th
                  key={i}
                  className={`pb-3 px-3 first:pl-0 last:pr-0 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint whitespace-nowrap ${
                    i === head.length - 1 ? "text-right" : ""
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70 dark:divide-night-line/70">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  Formulir                                                                  */
/* ========================================================================== */

export function Field({ label, hint, error, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint mb-1.5">
          {label}
        </span>
      )}
      {children}
      {error ? (
        <span className="block text-xs text-rose-600 dark:text-rose-400 mt-1.5">{error}</span>
      ) : (
        hint && <span className="block text-xs text-ink-faint mt-1.5">{hint}</span>
      )}
    </label>
  );
}

export function Input({ className = "", ...rest }) {
  return <input className={`field ${className}`} {...rest} />;
}

export function Select({ options, className = "", ...rest }) {
  return (
    <select className={`field appearance-none pr-9 ${className}`} {...rest}>
      {options.map((opt) => {
        const [value, label] = Array.isArray(opt) ? opt : [opt, opt];
        return (
          <option key={value} value={value}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

export function Textarea({ className = "", rows = 3, ...rest }) {
  return <textarea rows={rows} className={`field resize-none ${className}`} {...rest} />;
}

/**
 * Kolom rupiah dengan pemisah ribuan otomatis saat diketik.
 * Nilai yang dikirim ke pemanggil selalu berupa angka murni.
 */
export function MoneyInput({ value, onValueChange, className = "", ...rest }) {
  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-ink-faint pointer-events-none">
        Rp
      </span>
      <input
        type="text"
        inputMode="numeric"
        value={formatRupiahInput(value)}
        onChange={(e) => onValueChange(parseRupiahInput(e.target.value))}
        placeholder="0"
        className="field pl-10 tabular-nums"
        {...rest}
      />
    </div>
  );
}
