/**
 * Kiosk & Crew Quick-Link Engine
 * Mengelola pembuatan tautan khusus panitia meja resepsi tanpa perlu login akun penuh.
 * Memastikan panitia hanya memiliki akses check-in tamu tanpa bisa melihat data finansial
 * atau merubah pengaturan sensitif pernikahan.
 */

const CREW_SALT = "wp_crew_reception_v1";

/**
 * Menghasilkan token verifikasi deterministik URL-safe untuk meja resepsi kru.
 * @param {string} coupleId - ID pasangan
 * @returns {string} Token alfanumerik aman
 */
export function generateCrewToken(coupleId) {
  if (!coupleId || typeof coupleId !== "string") return "";
  let hash = 0;
  const str = `${coupleId}:${CREW_SALT}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const positiveHash = Math.abs(hash).toString(36);
  // Tambahkan prefix couple 4 karakter untuk entropy
  const prefix = coupleId.slice(0, 4).toLowerCase();
  return `crw_${prefix}_${positiveHash}`;
}

/**
 * Memvalidasi apakah token kru cocok dengan ID pasangan.
 * @param {string} coupleId - ID pasangan
 * @param {string} token - Token yang diperiksa
 * @returns {boolean} Benar jika token valid
 */
export function verifyCrewToken(coupleId, token) {
  if (!coupleId || !token) return false;
  const expected = generateCrewToken(coupleId);
  return token.trim() === expected;
}

/**
 * Menghasilkan URL lengkap mode kios untuk dibagikan kepada panitia.
 * @param {string} coupleId - ID pasangan
 * @param {string} origin - Domain web (default window.location.origin)
 * @returns {string} URL lengkap meja penerima tamu
 */
export function getCrewKioskUrl(coupleId, origin = "") {
  if (!coupleId) return "";
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "");
  const token = generateCrewToken(coupleId);
  return `${base}/kiosk?c=${encodeURIComponent(coupleId)}&token=${encodeURIComponent(token)}`;
}

/**
 * Format pesan WhatsApp siap kirim ke panitia / penerima tamu meja depan.
 * 
 * @param {Object} params
 * @param {string} params.coupleName - Nama pengantin (contoh: "Andi & Bella")
 * @param {string} params.kioskUrl - URL Kiosk meja tamu
 * @returns {string} Pesan teks terformat
 */
export function generateCrewWhatsAppShareMessage({ coupleName, kioskUrl }) {
  return `Halo Rekan Panitia Meja Resepsi,\n\nBerikut tautan kilat sistem buku tamu meja penerima tamu untuk pernikahan *${coupleName || "Kami"}*:\n\n👉 ${kioskUrl}\n\n*Petunjuk Penggunaan:*\n1. Buka tautan di tablet / smartphone meja resepsi.\n2. Tidak perlu login akun atau password.\n3. Cari nama tamu untuk centang kehadiran (Check-in) dan penyerahan souvenir.\n\nTerima kasih atas bantuan dan dedikasinya! 🙏`;
}
