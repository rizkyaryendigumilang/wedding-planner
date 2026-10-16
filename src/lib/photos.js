/**
 * Utilitas Google Drive / foto
 * ---------------------------------------------------------------------------
 * Tautan Google Drive tidak bisa dipakai langsung sebagai <img src>. Setiap
 * bentuk tautan yang dibagikan pengguna perlu dinormalisasi menjadi URL gambar
 * mentah. Modul ini mengumpulkan semua logika tersebut di satu tempat.
 */

export const DRIVE_FOLDER_MIME = "application/vnd.google-apps.folder";

/**
 * Ambil ID berkas dari berbagai bentuk tautan/ID Google Drive:
 *   https://drive.google.com/file/d/<ID>/view?usp=sharing
 *   https://drive.google.com/open?id=<ID>
 *   https://drive.google.com/uc?id=<ID>&export=download
 *   https://drive.google.com/thumbnail?id=<ID>&sz=w2000
 *   https://lh3.googleusercontent.com/d/<ID>
 *   <ID> (33+ karakter)
 */
export function extractDriveId(input) {
  if (!input) return null;
  const value = String(input).trim();

  // Sudah berupa ID mentah.
  if (/^[a-zA-Z0-9_-]{25,}$/.test(value)) return value;

  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/folders\/([a-zA-Z0-9_-]+)/,
  ];
  for (const re of patterns) {
    const match = value.match(re);
    if (match) return match[1];
  }
  return null;
}

/**
 * Ubah tautan apa pun menjadi URL gambar yang bisa dipakai <img>.
 * `sz=w1600` meminta ukuran yang cukup tajam untuk layar retina tanpa
 * mengunduh berkas resolusi penuh.
 */
export function toDirectImageUrl(input, size = "w1600") {
  if (!input) return "";
  const value = String(input).trim();

  const id = extractDriveId(value);
  if (id) {
    // Thumbnail endpoint paling andal untuk ditampilkan di <img>.
    return `https://drive.google.com/thumbnail?id=${id}&sz=${size}`;
  }

  // Bukan Drive (mis. Imgur/Unsplash) -> pakai apa adanya bila URL http.
  if (/^https?:\/\//i.test(value)) return value;
  return "";
}

/** Apakah tautan menunjuk ke sebuah folder Drive (bukan berkas foto). */
export function isDriveFolder(input) {
  return /\/folders\//.test(String(input || ""));
}

/** URL untuk membuka folder/berkas di tab baru. */
export function toDriveOpenUrl(input) {
  const value = String(input || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const id = extractDriveId(value);
  return id ? `https://drive.google.com/drive/folders/${id}` : "";
}

/**
 * Ambil id folder dari tautan "share" Drive.
 * Folder ID dipakai untuk memanggil Drive API saat daftar foto diimpor.
 */
export function folderIdFromUrl(input) {
  if (!input) return null;
  const match = String(input).match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Pisahkan daftar tautan yang ditempel sekaligus (satu per baris, atau
 * dipisah koma/spasi). Sering dipakai saat pengguna menempel banyak link foto.
 */
export function splitLinks(text) {
  return String(text || "")
    .split(/[\n,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Tebak nama berkas dari URL untuk dijadikan alt bawaan. */
export function guessAltFromUrl(url, fallback = "Foto prewedding") {
  try {
    const pathname = new URL(url).pathname;
    const name = decodeURIComponent(pathname.split("/").filter(Boolean).pop() || "");
    return name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").trim() || fallback;
  } catch {
    return fallback;
  }
}
