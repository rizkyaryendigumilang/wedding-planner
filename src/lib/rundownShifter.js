/**
 * Rundown Shifter & Vendor Brief Engine
 * Modul operasional wedding organizer (WO) untuk penyesuaian jadwal dinamis hari-H
 * dan pembuatan lembar ringkasan khusus vendor (Catering, MC, MUA, Fotografi, Dekorasi).
 */

import { formatNumber } from "./format";

/**
 * Menambahkan atau mengurangkan menit pada format waktu "HH:mm".
 * Menangani peralihan jam secara akurat (misal 08:50 + 15 menit = 09:05).
 * 
 * @param {string} timeStr - Format "HH:mm" (contoh: "08:30")
 * @param {number} deltaMinutes - Jumlah menit (positif untuk mundur, negatif untuk maju)
 * @returns {string} Format "HH:mm" hasil penyesuaian
 */
export function shiftTimeString(timeStr, deltaMinutes) {
  if (!timeStr || typeof timeStr !== "string") return timeStr || "";
  const parts = timeStr.trim().split(":");
  if (parts.length < 2) return timeStr;

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;

  let totalMinutes = hours * 60 + minutes + Number(deltaMinutes || 0);

  // Wrap around 24 hours (1440 minutes)
  const MINUTES_IN_DAY = 24 * 60;
  totalMinutes = ((totalMinutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;

  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;

  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(newHours)}:${pad(newMinutes)}`;
}

/**
 * Menghitung pratinjau pergeseran jadwal untuk daftar agenda rundown.
 * 
 * @param {Array} rundowns - Daftar agenda rundown
 * @param {number} deltaMinutes - Jumlah menit penyesuaian (+15, +30, -15, dll)
 * @param {number} startIndex - Indeks mulai agenda yang digeser (default 0 untuk semua)
 * @returns {Array} Daftar agenda dengan `time_start_new` dan `time_end_new`
 */
export function computeRundownShift(rundowns = [], deltaMinutes = 0, startIndex = 0) {
  if (!Array.isArray(rundowns) || rundowns.length === 0) return [];
  const delta = Number(deltaMinutes || 0);

  return rundowns.map((item, idx) => {
    if (idx < startIndex || delta === 0) {
      return {
        ...item,
        time_start_new: item.time_start,
        time_end_new: item.time_end,
        is_shifted: false,
      };
    }

    const newStart = shiftTimeString(item.time_start, delta);
    const newEnd = item.time_end ? shiftTimeString(item.time_end, delta) : "";

    return {
      ...item,
      time_start_new: newStart,
      time_end_new: newEnd,
      is_shifted: true,
      time_change_label: `${item.time_start} → ${newStart}`,
    };
  });
}

/**
 * Kategori vendor yang didukung untuk lembar ringkasan briefing hari-H.
 */
export const VENDOR_BRIEF_CATEGORIES = [
  { id: "all", label: "Semua Vendor (Master Briefing)" },
  { id: "catering", label: "Catering & Konsumsi" },
  { id: "photo", label: "Fotografer & Videografer" },
  { id: "mc", label: "MC & Sound System" },
  { id: "mua", label: "MUA & Busana (Wardrobe)" },
  { id: "decor", label: "Dekorasi & Panggung" },
];

/**
 * Membuat teks ringkasan operasional vendor yang siap disalin ke WhatsApp
 * atau dicetak untuk koordinasi di lapangan.
 * 
 * @param {Object} params
 * @param {string} params.vendorCategory - "all" | "catering" | "photo" | "mc" | "mua" | "decor"
 * @param {Object} params.couple - Data pasangan pengantin
 * @param {Array} params.rundowns - Susunan acara
 * @param {Array} params.vendors - Daftar vendor
 * @param {Object} params.guestSummary - Ringkasan kehadiran tamu
 * @returns {string} Teks briefing terformat rapi
 */
export function generateVendorBriefText({
  vendorCategory = "all",
  couple = {},
  rundowns = [],
  vendors = [],
  guestSummary = {},
}) {
  const coupleName = `${couple?.cpp_nickname || "CPP"} & ${couple?.cpw_nickname || "CPW"}`;
  const weddingDate = couple?.wedding_date || "17 Februari 2028";
  const venue = couple?.venue || "Ballroom Gedung Pernikahan";

  const divider = "════════════════════════════════════";
  const lines = [];

  lines.push(`📋 *BRIEFING OPERASIONAL VENDOR HARI-H*`);
  lines.push(`💍 *${coupleName}*`);
  lines.push(`📅 Tanggal: ${weddingDate}`);
  lines.push(`📍 Lokasi: ${venue}`);
  lines.push(divider);

  if (vendorCategory === "all" || vendorCategory === "catering") {
    lines.push(`\n🍽️ *CATATAN KHUSUS CATERING & KONSUMSI*`);
    lines.push(`• Total Tamu Undangan: ${formatNumber(guestSummary?.total || 0)} undangan`);
    lines.push(`• Estimasi Total Pax: ${formatNumber(guestSummary?.totalPax || 0)} porsi`);
    lines.push(`• Tamu Konfirmasi Hadir: ${formatNumber(guestSummary?.hadir || 0)} pax`);
    lines.push(`• Standby Makanan Keluarga: 06:30 (Ruang VIP)`);
    lines.push(`• Buka Prasmanan Resepsi: 11:30`);
    lines.push(`• Pengecekan Alur Piring & Gelas: Tim runner catering standby.`);
  }

  if (vendorCategory === "all" || vendorCategory === "photo") {
    lines.push(`\n📸 *CATATAN FOTOGRAFI & DOKUMENTASI*`);
    lines.push(`• Standby Tim Foto: 06:30 di Kamar Rias`);
    lines.push(`• Sesi Wajib: Detail Gaun/Cincin, Prosesi Akad, Sungkeman, Kirab Resepsi`);
    lines.push(`• Sesi Foto Keluarga Inti: Segera setelah prosesi akad nikah selesai`);
    lines.push(`• Sesi Foto Sahabat & VIP: Saat ramah tamah pelaminan`);
  }

  if (vendorCategory === "all" || vendorCategory === "mc") {
    lines.push(`\n🎤 *CATATAN MC & SOUND SYSTEM*`);
    lines.push(`• Nama Pengantin Pria: ${couple?.cpp_fullname || couple?.cpp_nickname || "CPP"}`);
    lines.push(`• Nama Pengantin Wanita: ${couple?.cpw_fullname || couple?.cpw_nickname || "CPW"}`);
    lines.push(`• Backsound Kirab: Musik pembuka pengantin masuk pelaminan.`);
    lines.push(`• Panggilan Sesi Foto: Diatur berurutan sesuai arahan koordinator WO.`);
  }

  if (vendorCategory === "all" || vendorCategory === "mua") {
    lines.push(`\n💄 *CATATAN MUA & WARDROBE*`);
    lines.push(`• Start Rias Pengantin: 05:00 pagi`);
    lines.push(`• Start Rias Ibu & Besan: 05:30 pagi`);
    lines.push(`• Waktu Retouch Resepsi: 10:00 - 11:00 (sebelum kirab dimulai)`);
  }

  if (vendorCategory === "all" || vendorCategory === "decor") {
    lines.push(`\n🌸 *CATATAN DEKORASI & AMBIENCE*`);
    lines.push(`• Handover Pelaminan & Meja Akad: Maksimal 06:00 pagi (bersih dan siap pakai)`);
    lines.push(`• Standby Janur & Bunga Melati: Siap sebelum rombongan CPP tiba.`);
  }

  lines.push(`\n⏱️ *RUNDOWN ACARA TERBARU:*`);
  if (rundowns && rundowns.length > 0) {
    rundowns.forEach((r, idx) => {
      const timeSpan = r.time_end ? `${r.time_start} - ${r.time_end}` : r.time_start;
      const statusIcon = r.is_completed ? "✅" : "⏳";
      const pic = r.pic_name ? ` (PIC: ${r.pic_name})` : "";
      lines.push(`${idx + 1}. [${timeSpan}] ${statusIcon} *${r.title}*${pic}`);
      if (r.location) lines.push(`   Lokasi: ${r.location}`);
    });
  } else {
    lines.push(`Belum ada agenda rundown yang terdaftar.`);
  }

  if (vendors && vendors.length > 0) {
    lines.push(`\n📞 *DAFTAR KONTAK PIC VENDOR:*`);
    vendors.forEach((v) => {
      const pic = v.pic_name || v.name || "PIC";
      const phone = v.phone ? ` (${v.phone})` : "";
      lines.push(`• ${v.category || "Vendor"}: *${v.name}* - ${pic}${phone}`);
    });
  }

  lines.push(`\n${divider}`);
  lines.push(`Mohon seluruh tim vendor dan panitia standby di pos masing-masing.`);
  lines.push(`Terima kasih atas kerja sama dan dedikasi rekan-rekan vendor sekalian! 🙏`);

  return lines.join("\n");
}
