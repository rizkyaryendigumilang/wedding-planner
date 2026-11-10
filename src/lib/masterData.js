/**
 * Master Data Kategori Pernikahan & Bank Indonesia
 */

export const DEFAULT_BUDGET_CATEGORIES = [
  "VENUE & KATERING",
  "DEKORASI & BUNGA",
  "BUSANA & RIAS",
  "DOKUMENTASI",
  "HIBURAN & SOUND",
  "UNDANGAN & SOUVENIR",
  "SESERAHAN & MAHAR",
  "LOGISTIK & LAINNYA",
];

export const TRADITIONAL_CUSTOM_PRESETS = [
  "Siraman & Sungkeman",
  "Pengajian & Doa Bersama",
  "Malam Midodareni",
  "Adat Seserahan & Lamaran",
  "Martumpol & Adat Batak",
  "Akad Nikah / Pemberkatan",
  "Ngunduh Mantu",
  "After Party",
];

export const DEFAULT_VENDOR_CATEGORIES = [
  "Booking Vendor",
  "Things To Do",
  "Administrasi Pernikahan",
  "Rangkaian Acara",
];

export const TRADITIONAL_VENDOR_PRESETS = [
  "Fitting & Seragam Keluarga",
  "Properti & Seserahan Adat",
  "Tes Kesehatan / Medis",
  "Perizinan Kepolisian & Keamanan",
  "Akomodasi & Transportasi Tamu",
];

export const INDONESIAN_BANKS = [
  { code: "BCA", name: "Bank Central Asia (BCA)", color: "from-blue-600 to-blue-700" },
  { code: "MANDIRI", name: "Bank Mandiri", color: "from-amber-600 to-blue-900" },
  { code: "BRI", name: "Bank Rakyat Indonesia (BRI)", color: "from-blue-700 to-sky-600" },
  { code: "BNI", name: "Bank Negara Indonesia (BNI)", color: "from-teal-600 to-emerald-700" },
  { code: "BSI", name: "Bank Syariah Indonesia (BSI)", color: "from-emerald-600 to-teal-700" },
  { code: "CIMB", name: "CIMB Niaga", color: "from-red-600 to-rose-700" },
  { code: "PERMATA", name: "Bank Permata", color: "from-emerald-700 to-lime-600" },
  { code: "JAGO", name: "Bank Jago", color: "from-amber-500 to-orange-600" },
  { code: "SEABANK", name: "SeaBank", color: "from-orange-500 to-orange-600" },
  { code: "OTHER", name: "Bank / E-Wallet Lainnya", color: "from-stone-600 to-stone-700" },
];

/**
 * Format teks rekening ke pesan WhatsApp:
 * Contoh:
 * *Rekening Tanda Kasih / Angpao Digital:*
 * • BCA: 1234567890 a.n. Dimas (CPP)
 * • Mandiri: 0987654321 a.n. Annisa (CPW)
 */
export function formatBankAccountsForWa(accounts = []) {
  if (!accounts || accounts.length === 0) return "";
  const lines = accounts.map((acc) => {
    const sideLabel = acc.side ? ` (${acc.side})` : "";
    return `• ${acc.bank_name}: ${acc.account_number} a.n. ${acc.account_holder}${sideLabel}`;
  });
  return `*Rekening Tanda Kasih / Angpao Digital:*\n${lines.join("\n")}`;
}
