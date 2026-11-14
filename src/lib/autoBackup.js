/**
 * Auto-Sync Backup & Export Engine
 * ---------------------------------------------------------------------------
 * Menyediakan sinkronisasi cadangan otomatis (auto-sync snapshot) di sisi klien,
 * serta unduhan cadangan pribadi baik format JSON terpadu maupun CSV per modul.
 */
import { exportToCsv, exportToJson } from "./export";

/**
 * Menyimpan snapshot cadangan terbaru secara otomatis ke penyimpanan lokal browser.
 *
 * @param {object} weddingData Data aktif pernikahan
 * @returns {object|null} Metadata cadangan yang tersimpan
 */
export function saveAutoBackupSnapshot(weddingData = {}) {
  const {
    couple,
    settings,
    budgets = [],
    cashflow = [],
    administrations = [],
    vendors = [],
    guests = [],
    seserahan = [],
    rundowns = [],
    gifts = [],
    logs = [],
  } = weddingData;

  const coupleId = couple?.id;
  if (!coupleId || typeof window === "undefined") return null;

  try {
    const timestamp = new Date().toISOString();
    const snapshot = {
      version: "2.0",
      exported_at: timestamp,
      couple,
      settings,
      budgets,
      cashflow,
      administrations,
      vendors,
      guests,
      seserahan,
      rundowns,
      gifts,
      logs,
    };

    const jsonString = JSON.stringify(snapshot);
    const sizeBytes = new Blob([jsonString]).size;

    const meta = {
      coupleId,
      lastBackupAt: timestamp,
      guestCount: guests.length,
      budgetCount: budgets.length,
      vendorCount: vendors.length,
      rundownCount: rundowns.length,
      giftCount: gifts.length,
      sizeBytes,
    };

    localStorage.setItem(`wedding_auto_backup_${coupleId}`, jsonString);
    localStorage.setItem(`wedding_auto_backup_meta_${coupleId}`, JSON.stringify(meta));

    return meta;
  } catch (err) {
    console.warn("Gagal menyimpan auto-sync backup snapshot:", err);
    return null;
  }
}

/**
 * Mengambil metadata snapshot cadangan otomatis terakhir.
 *
 * @param {string} coupleId
 * @returns {object|null}
 */
export function getAutoBackupMeta(coupleId) {
  if (!coupleId || typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(`wedding_auto_backup_meta_${coupleId}`);
    return saved ? JSON.parse(saved) : null;
  } catch (_) {
    return null;
  }
}

/**
 * Mengambil data lengkap snapshot cadangan otomatis terakhir.
 *
 * @param {string} coupleId
 * @returns {object|null}
 */
export function getAutoBackupSnapshot(coupleId) {
  if (!coupleId || typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(`wedding_auto_backup_${coupleId}`);
    return saved ? JSON.parse(saved) : null;
  } catch (_) {
    return null;
  }
}

/**
 * Format ukuran byte menjadi satuan yang ramah dibaca (KB, MB).
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Mengunduh snapshot lengkap dalam format JSON.
 */
export function downloadFullBackupJson(weddingData) {
  const {
    couple,
    settings,
    budgets = [],
    cashflow = [],
    administrations = [],
    vendors = [],
    guests = [],
    seserahan = [],
    rundowns = [],
    gifts = [],
    logs = [],
  } = weddingData;

  const snapshotData = {
    version: "2.0",
    exported_at: new Date().toISOString(),
    couple,
    settings,
    budgets,
    cashflow,
    administrations,
    vendors,
    guests,
    seserahan,
    rundowns,
    gifts,
    logs,
  };

  const couplePrefix =
    couple?.cpp_nickname && couple?.cpw_nickname
      ? `${couple.cpp_nickname}_${couple.cpw_nickname}`
      : "Pernikahan";
  const dateStr = new Date().toISOString().slice(0, 10);
  exportToJson(`Backup_${couplePrefix}_${dateStr}.json`, snapshotData);
}

/**
 * Mengunduh berkas CSV per modul.
 */
export function exportModuleCsv(type, weddingData, t = (s) => s) {
  const {
    couple,
    guests = [],
    budgets = [],
    vendors = [],
    seserahan = [],
    rundowns = [],
    gifts = [],
  } = weddingData;

  const couplePrefix =
    couple?.cpp_nickname && couple?.cpw_nickname
      ? `${couple.cpp_nickname}_${couple.cpw_nickname}`
      : "Pernikahan";

  if (type === "guests") {
    const headers = [
      { key: "name", label: t("Nama Tamu") },
      { key: "side", label: "Pihak (CPP/CPW)" },
      { key: "group_name", label: t("Kategori") },
      { key: "pax", label: "Jumlah Pax" },
      { key: "table_number", label: "Nomor Meja" },
      { key: "rsvp_status", label: "Status Konfirmasi (RSVP)" },
      { key: "invitation_sent", label: "Undangan Terkirim", format: (v) => (v ? "Sudah" : "Belum") },
      { key: "checked_in", label: "Hadir Hari-H", format: (v) => (v ? "Hadir" : "Belum") },
      { key: "phone", label: "No. HP / WhatsApp" },
      { key: "notes", label: "Catatan Khusus" },
    ];
    exportToCsv(`Daftar_Tamu_${couplePrefix}.csv`, headers, guests);
  } else if (type === "budgets") {
    const headers = [
      { key: "category", label: t("Kategori") },
      { key: "item", label: "Nama Pos / Item" },
      { key: "allocated", label: "Alokasi Target (Rp)", format: (v) => v || 0 },
      { key: "actual", label: "Realisasi (Rp)", format: (v) => v || 0 },
      { key: "selisih", label: "Selisih (Rp)", format: (_, r) => (r.allocated || 0) - (r.actual || 0) },
      { key: "paid_by", label: "Ditanggung Oleh" },
      { key: "notes", label: "Catatan" },
    ];
    exportToCsv(`Rencana_Anggaran_${couplePrefix}.csv`, headers, budgets);
  } else if (type === "vendors") {
    const headers = [
      { key: "category", label: t("Kategori") },
      { key: "name", label: "Nama Vendor" },
      { key: "contact", label: "Kontak / PIC" },
      { key: "phone", label: "No. HP / WA" },
      { key: "cost", label: "Biaya (Rp)", format: (v) => v || 0 },
      { key: "due_date", label: "Tenggat Waktu" },
      { key: "done", label: "Status Selesai", format: (v) => (v ? "Selesai" : "Belum") },
      { key: "notes", label: "Catatan" },
    ];
    exportToCsv(`Daftar_Vendor_${couplePrefix}.csv`, headers, vendors);
  } else if (type === "rundowns") {
    const headers = [
      { key: "time_start", label: "Jam Mulai" },
      { key: "time_end", label: "Jam Selesai" },
      { key: "title", label: "Sesi Acara" },
      { key: "location", label: "Lokasi" },
      { key: "pic", label: "Penanggung Jawab (PIC)" },
      { key: "notes", label: "Keterangan / Panduan" },
    ];
    exportToCsv(`Susunan_Acara_${couplePrefix}.csv`, headers, rundowns);
  } else if (type === "seserahan") {
    const headers = [
      { key: "side", label: "Pihak (CPP/CPW)" },
      { key: "box_number", label: "Nomor Kotak" },
      { key: "title", label: "Nama Barang / Item" },
      { key: "purchased", label: "Sudah Dibeli", format: (v) => (v ? "Sudah" : "Belum") },
      { key: "packed", label: "Sudah Dihias/Bungkus", format: (v) => (v ? "Sudah" : "Belum") },
      { key: "cost", label: "Biaya (Rp)", format: (v) => v || 0 },
      { key: "notes", label: "Catatan" },
    ];
    exportToCsv(`Daftar_Seserahan_${couplePrefix}.csv`, headers, seserahan);
  } else if (type === "gifts") {
    const headers = [
      { key: "giver_name", label: "Nama Pemberi" },
      { key: "gift_type", label: "Tipe Hadiah" },
      { key: "amount", label: "Nominal (Rp)", format: (v) => v || 0 },
      { key: "notes", label: "Catatan & Ucapan" },
    ];
    exportToCsv(`Catatan_Kado_Amplop_${couplePrefix}.csv`, headers, gifts);
  }
}

/**
 * Mengunduh seluruh data dalam rangkaian file CSV (Batch Bundle).
 */
export function exportAllCsvBundle(weddingData, t = (s) => s) {
  const modules = ["guests", "budgets", "vendors", "rundowns", "seserahan", "gifts"];
  modules.forEach((mod, idx) => {
    setTimeout(() => {
      exportModuleCsv(mod, weddingData, t);
    }, idx * 250);
  });
}
