/**
 * Utilitas kalender untuk DatePicker & DateRangePicker (tidak ada dependensi
 * eksternal — cukup Date bawaan JS, semuanya dalam zona waktu lokal).
 */

export const MONTHS_LONG = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export const MONTHS_SHORT = MONTHS_LONG.map((m) => m.slice(0, 3));

/** Senin .. Minggu — konvensi Indonesia, bukan Minggu .. Sabtu. */
export const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

/** "2028-02-17" -> Date lokal (bukan UTC, agar tidak bergeser sehari). */
export function parseISO(value) {
  if (!value) return null;
  const [y, m, d] = String(value).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Date -> "2028-02-17" */
export function toISO(date) {
  if (!date) return "";
  const p = (x) => String(x).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

export function isSameDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Susun 6 baris x 7 kolom (42 sel) untuk bulan tertentu, lengkap dengan
 * tanggal dari bulan sebelum/sesudahnya agar grid selalu penuh.
 */
export function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  // getDay(): 0 = Minggu. Kita butuh offset dari hari Senin.
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);

  const cells = [];
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    cells.push({ date, inMonth: date.getMonth() === month });
  }
  return cells;
}

export function addMonths(date, delta) {
  const d = new Date(date);
  d.setDate(1);
  d.setMonth(d.getMonth() + delta);
  return d;
}

/** Rentang inklusif antara dua tanggal, diurutkan otomatis. */
export function rangeInclusive(a, b) {
  if (!a || !b) return [];
  let start = startOfDay(a);
  let end = startOfDay(b);
  if (start > end) [start, end] = [end, start];

  const out = [];
  const cursor = new Date(start);
  while (cursor <= end && out.length < 400) {
    out.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

/** Jarak hari antara dua tanggal (selalu positif). */
export function diffDays(a, b) {
  if (!a || !b) return 0;
  return Math.round(
    Math.abs(startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000
  );
}

/**
 * Preset rentang yang berguna untuk perencanaan pernikahan.
 * Mengembalikan { from, to } dalam ISO string.
 */
export function rangePresets(today = new Date()) {
  const start = startOfDay(today);
  const endOfMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0);

  const plusDays = (n) => {
    const d = new Date(start);
    d.setDate(d.getDate() + n);
    return d;
  };
  const plusMonths = (n) => {
    const d = new Date(start);
    d.setMonth(d.getMonth() + n);
    return d;
  };

  return [
    { label: "Minggu ini", from: toISO(start), to: toISO(plusDays(6)) },
    { label: "30 hari ke depan", from: toISO(start), to: toISO(plusDays(30)) },
    { label: "Bulan ini", from: toISO(start), to: toISO(endOfMonth) },
    { label: "3 bulan ke depan", from: toISO(start), to: toISO(plusMonths(3)) },
    { label: "6 bulan ke depan", from: toISO(start), to: toISO(plusMonths(6)) },
  ];
}
