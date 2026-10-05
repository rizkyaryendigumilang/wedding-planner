import { motion } from "framer-motion";
import { Loader2, AlertTriangle } from "lucide-react";

/** Pembungkus animasi masuk untuk setiap halaman. */
export function Page({ children, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className={`space-y-6 ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function PageHeader({ title, subtitle, icon: Icon, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="p-3 rounded-2xl bg-primary/10 text-primary shrink-0">
            <Icon size={22} />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {title}
          </h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "", padded = true }) {
  return (
    <div
      className={`bg-white dark:bg-darksurface rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 ${
        padded ? "p-5 sm:p-6" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({ label, value, sub, icon: Icon, tone = "primary", delay = 0 }) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10",
    red: "bg-rose-50 text-rose-600 dark:bg-rose-500/10",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10",
    blue: "bg-sky-50 text-sky-600 dark:bg-sky-500/10",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 260, damping: 24 }}
    >
      <Card className="h-full">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white truncate">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
          </div>
          {Icon && <div className={`p-3 rounded-2xl shrink-0 ${tones[tone]}`}><Icon size={20} /></div>}
        </div>
      </Card>
    </motion.div>
  );
}

export function ProgressBar({ value, tone = "bg-primary", height = "h-2.5" }) {
  return (
    <div className={`w-full bg-gray-100 dark:bg-gray-700/60 ${height} rounded-full overflow-hidden`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className={`h-full ${tone} rounded-full`}
      />
    </div>
  );
}

export function Badge({ children, tone = "gray" }) {
  const tones = {
    gray: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10",
    red: "bg-rose-50 text-rose-600 dark:bg-rose-500/10",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10",
    blue: "bg-sky-50 text-sky-600 dark:bg-sky-500/10",
    purple: "bg-primary/10 text-primary",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Loading({ label = "Memuat data dari PocketBase…" }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
      <Loader2 className="animate-spin" size={26} />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="p-3 rounded-2xl bg-rose-50 text-rose-500"><AlertTriangle size={24} /></div>
      <p className="text-sm text-gray-500 max-w-md">{message}</p>
      <p className="text-xs text-gray-400">
        Pastikan PocketBase berjalan di port 8090 lalu muat ulang halaman.
      </p>
    </div>
  );
}

export function EmptyState({ message, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center gap-2 text-gray-400">
      {Icon && <Icon size={26} />}
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function SectionTitle({ children, count }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{children}</h2>
      {count != null && <span className="text-xs text-gray-400">({count})</span>}
    </div>
  );
}

export function Table({ head, children }) {
  return (
    <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="text-gray-400 text-xs uppercase tracking-wide">
            {head.map((h) => (
              <th key={h} className="py-3 px-3 font-medium whitespace-nowrap first:pl-0">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">{children}</tbody>
      </table>
    </div>
  );
}
