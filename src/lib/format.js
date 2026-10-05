/**
 * Utilitas umum: format mata uang, tanggal, dan hitung mundur.
 */

/** Rp 1.500.000 */
export function formatRupiah(value, options = {}) {
  const n = Number(value) || 0;
  return `Rp ${n.toLocaleString("id-ID", options)}`;
}

/** 1.500.000 (tanpa "Rp") */
export function formatNumber(value) {
  return Number(value || 0).toLocaleString("id-ID");
}

/** 1.500.000 -> singkatan "1,5 jt" untuk tampilan ringkas */
export function formatCompact(value) {
  const n = Number(value) || 0;
  if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(".", ",")} M`;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")} jt`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)} rb`;
  return String(n);
}

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** 2028-02-17 -> "17 Februari 2028" */
export function formatDateId(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

/** 2026-10-30 -> "30 Okt 2026" */
export function formatDateShort(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  const m = MONTHS_ID[d.getMonth()].slice(0, 3);
  return `${d.getDate()} ${m} ${d.getFullYear()}`;
}

/** 2026-04-29 -> "29-04-2026" */
export function formatDateNumeric(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  const p = (x) => String(x).padStart(2, "0");
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`;
}

/**
 * Selisih hari dari hari ini menuju target (bisa negatif bila lewat).
 * Dihitung pada tengah malam agar tidak terpengaruh jam.
 */
export function daysUntil(target) {
  if (!target) return null;
  const end = new Date(target);
  if (Number.isNaN(end.getTime())) return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.round((end - start) / 86_400_000);
}

/** Pecah selisih hari menjadi { days, hours, minutes, seconds } menuju target. */
export function countdownParts(target) {
  const diff = new Date(target).getTime() - Date.now();
  const clamped = Math.max(diff, 0);
  return {
    days: Math.floor(clamped / 86_400_000),
    hours: Math.floor((clamped % 86_400_000) / 3_600_000),
    minutes: Math.floor((clamped % 3_600_000) / 60_000),
    seconds: Math.floor((clamped % 60_000) / 1000),
    isPast: diff < 0,
  };
}

/** Ambil inisial dari nama: "Rizky Aryendi" -> "RA" */
export function initials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

/** Persentase aman (0-100). */
export function pct(part, total) {
  if (!total) return 0;
  return Math.min(100, Math.max(0, (Number(part) / Number(total)) * 100));
}

export function clsx(...args) {
  return args.filter(Boolean).join(" ");
}
