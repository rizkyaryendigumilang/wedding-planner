/**
 * Helpdesk SSO Just-In-Time Handoff Helper
 * ---------------------------------------------------------------------------
 * Mengarahkan pengguna langsung ke formulir "Buat Tiket Baru" di VPS Helpdesk
 * terpusat tanpa harus login atau registrasi ulang, lengkap dengan keluhan
 * dan bukti foto opsional.
 */
import pb from "./pocketbase";

export const HELPDESK_BASE_URL = "https://43.156.236.102/helpdesk/handoff";
export const HELPDESK_APP_SLUG = "wedding";

/**
 * Mengambil sesi pengguna aktif dari PocketBase AuthStore.
 */
export function dapatkanSesiPenggunaAktif() {
  return pb?.authStore?.record || null;
}

/**
 * Menghasilkan fallback ID sesi anonim yang konsisten selama sesi browser aktif.
 */
function getGuestSessionId() {
  if (typeof window === "undefined") return "anonymous";
  try {
    let sid = sessionStorage.getItem("wp_helpdesk_guest_id");
    if (!sid) {
      sid = "guest_" + Math.random().toString(36).slice(2, 9);
      sessionStorage.setItem("wp_helpdesk_guest_id", sid);
    }
    return sid;
  } catch (_) {
    return "guest_" + Math.random().toString(36).slice(2, 9);
  }
}

/**
 * Menghasilkan peran pengguna yang mudah dipahami oleh operator helpdesk.
 */
export function formatUserRole(user) {
  if (!user) return "Tamu / Pengguna";
  if (user.isSuperuser || user.app_role === "admin") return "Super Admin";
  if (user.app_role === "owner") return "Owner / Pengantin";
  if (user.app_role === "panitia") return "Panitia Acara";
  if (user.app_role === "wo") return "Wedding Organizer";
  if (user.app_role) return String(user.app_role);
  if (user.role) return String(user.role);
  return "Member";
}

/**
 * Membangun URL Handoff Helpdesk dengan query parameters lengkap dan terenkode.
 *
 * @param {object} [user] - Data objek user sesi aktif (dari AuthContext / PocketBase)
 * @param {object|string} [optionsOrFromUrl] - URL atau opsi payload tiket (subject, description, dll)
 * @returns {string} URL handoff helpdesk
 */
export function getHelpdeskHandoffUrl(user, optionsOrFromUrl) {
  const options =
    typeof optionsOrFromUrl === "string"
      ? { fromUrl: optionsOrFromUrl }
      : optionsOrFromUrl || {};

  const uid =
    user?.id ||
    user?.username ||
    user?.email ||
    getGuestSessionId();

  const name =
    user?.name ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "Pengguna Wedding Planner";

  const role = formatUserRole(user);

  const fromUrl =
    options.fromUrl ||
    (typeof window !== "undefined" ? window.location.href : "");

  const params = new URLSearchParams({
    app: HELPDESK_APP_SLUG,
    uid: String(uid).slice(0, 200),
    name: String(name),
    role: String(role),
    from_url: fromUrl,
    new: "1",
  });

  if (options.subject) {
    params.set("subject", String(options.subject).slice(0, 200));
  }

  if (options.description) {
    params.set("description", String(options.description).slice(0, 4000));
  }

  if (options.category) {
    params.set("category", String(options.category));
  }

  if (options.priority) {
    params.set("priority", String(options.priority));
  }

  if (options.autoSubmit) {
    params.set("auto_submit", "1");
  }

  return `${HELPDESK_BASE_URL}?${params.toString()}`;
}

/**
 * Unggah berkas foto lampiran bukti kendala ke PocketBase (opsional).
 *
 * @param {File} photoFile - Berkas foto tangkapan layar / bukti kendala
 * @param {object} metadata - Data penyerta (user, keluhan, url asal)
 * @returns {Promise<string|null>} URL publik berkas di server
 */
export async function uploadHelpdeskAttachment(photoFile, metadata = {}) {
  if (!photoFile) return null;

  try {
    const formData = new FormData();
    formData.append("attachment", photoFile);
    formData.append("app", HELPDESK_APP_SLUG);
    formData.append("user_name", metadata.name || "Pengguna");
    formData.append("user_role", metadata.role || "Pengguna");
    formData.append("complaint", (metadata.complaint || "Lampiran bukti kendala").slice(0, 5000));
    formData.append("from_url", metadata.fromUrl || "");

    const record = await pb.collection("helpdesk_reports").create(formData);
    if (record && record.attachment) {
      return pb.files.getURL(record, record.attachment);
    }
  } catch (err) {
    console.warn("Gagal mengunggah foto ke koleksi helpdesk_reports:", err);
  }

  return null;
}

/**
 * Mengirim keluhan dan foto bukti kendala (opsional) langsung ke Helpdesk VPS.
 *
 * @param {object} params
 * @param {object} [params.user] - Data pengguna aktif
 * @param {string} params.complaint - Deskripsi keluhan atau kendala
 * @param {File|null} [params.photoFile] - Foto bukti masalah (tidak wajib)
 * @param {string} [params.fromUrl] - URL lokasi terjadinya kendala
 * @param {boolean} [params.autoSubmit=true] - Otomatis buat tiket dan buka detail tiket
 * @param {string} [params.category="bug_error"] - Kategori tiket
 * @param {boolean} [params.isUrgent=false] - Prioritas mendesak
 * @returns {Promise<{ ok: boolean, url: string, photoUrl: string|null }>}
 */
export async function sendHelpdeskReport({
  user,
  complaint,
  photoFile = null,
  fromUrl = null,
  autoSubmit = true,
  category = "bug_error",
  isUrgent = false,
}) {
  const currentUser = user || dapatkanSesiPenggunaAktif();
  const currentUrl =
    fromUrl || (typeof window !== "undefined" ? window.location.href : "");
  const role = formatUserRole(currentUser);
  const name = currentUser?.name || currentUser?.username || "Pengguna";

  let photoUrl = null;
  if (photoFile) {
    photoUrl = await uploadHelpdeskAttachment(photoFile, {
      name,
      role,
      complaint,
      fromUrl: currentUrl,
    });
  }

  // Ringkas judul laporan maksimal 80 karakter
  const cleanSummary = (complaint || "Laporan Kendala")
    .replace(/\r?\n+/g, " ")
    .trim()
    .slice(0, 80);
  const subject = `[Wedding Planner] ${cleanSummary}`;

  // Susun deskripsi lengkap dengan tautan foto dan URL halaman asal
  let description = complaint.trim();
  if (photoUrl) {
    description += `\n\n📸 Foto Bukti Kendala:\n${photoUrl}`;
  }
  description += `\n\n📍 Halaman Asal:\n${currentUrl}`;

  const targetUrl = getHelpdeskHandoffUrl(currentUser, {
    fromUrl: currentUrl,
    subject,
    description,
    category,
    priority: isUrgent ? "urgent" : "medium",
    autoSubmit,
  });

  if (typeof window !== "undefined") {
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }

  return { ok: true, url: targetUrl, photoUrl };
}

/**
 * Fungsi pelaporan kendala cepat langsung ke Helpdesk VPS
 * sesuai spesifikasi handoff SSO aplikasi.
 *
 * @param {object} params
 * @param {string} params.subject - Judul laporan kendala
 * @param {string} params.description - Deskripsi lengkap keluhan
 * @param {string} [params.category='bug_error'] - Kategori tiket
 * @param {boolean} [params.isUrgent=false] - Apakah kendala berkategori darurat/mendesak
 * @param {object} [params.user] - Sesi pengguna opsional
 * @returns {string} URL target Helpdesk VPS yang dibuka
 */
export function laporkanKendalaKeHelpdesk({
  subject = "",
  description = "",
  category = "bug_error",
  isUrgent = false,
  user = null,
} = {}) {
  const currentUser = user || dapatkanSesiPenggunaAktif();
  const uid =
    currentUser?.id ||
    currentUser?.username ||
    currentUser?.email ||
    getGuestSessionId();

  const name =
    currentUser?.name ||
    currentUser?.username ||
    currentUser?.email?.split("@")[0] ||
    "Pengguna Wedding Planner";

  const role = formatUserRole(currentUser);
  const fromUrl = typeof window !== "undefined" ? window.location.href : "";

  const params = new URLSearchParams({
    app: HELPDESK_APP_SLUG, // 'wedding'
    uid: String(uid).slice(0, 200),
    name: String(name),
    role: String(role),
    from_url: fromUrl,
    new: "1",
    auto_submit: "1",
    subject: String(subject).trim().slice(0, 200),
    description: String(description).trim().slice(0, 4000),
    category,
    priority: isUrgent ? "urgent" : "medium",
  });

  const targetUrl = `${HELPDESK_BASE_URL}?${params.toString()}`;
  if (typeof window !== "undefined") {
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }
  return targetUrl;
}

/**
 * Pembuka cepat (kompatibilitas mundur) ke formulir helpdesk.
 */
export function openHelpdeskTicket(user, fromUrl) {
  const targetUrl = getHelpdeskHandoffUrl(user, fromUrl);
  if (typeof window !== "undefined") {
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }
  return targetUrl;
}
