/**
 * Quick Friend Invite & Temporary Password Utility
 * ---------------------------------------------------------------------------
 * Membantu Superadmin membuat akun akses cepat untuk rekan/teman hanya dengan
 * alamat email, lengkap dengan pembuatan password sementara dan format pesan WhatsApp.
 */
import pb from "./pocketbase";

const MEMORABLE_WORDS = [
  "nikah",
  "berkah",
  "bahagia",
  "jodoh",
  "cinta",
  "samawa",
  "abadi",
  "janji",
];

/**
 * Menghasilkan kata sandi sementara yang aman (min 8 karakter),
 * mudah dibaca, dan mudah diketik di keyboard ponsel.
 *
 * @returns {string} Contoh: "nikah5839", "samawa2418"
 */
export function generateTemporaryPassword() {
  const word = MEMORABLE_WORDS[Math.floor(Math.random() * MEMORABLE_WORDS.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${word}${num}`;
}

/**
 * Menghasilkan username bersih dan bebas tabrakan (collision-free) dari email atau nama.
 *
 * @param {string} email
 * @param {string} [name]
 * @param {Array<{ username: string }>} [existingUsers=[]]
 * @returns {string} Username unik
 */
export function generateCleanUsername(email = "", name = "", existingUsers = []) {
  let base = "";

  if (name && name.trim()) {
    base = name.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");
  }

  if (!base && email && email.includes("@")) {
    base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_.-]/g, "");
  }

  if (!base || base.length < 3) {
    base = "teman";
  }

  base = base.slice(0, 20);

  const existingSet = new Set(
    (existingUsers || []).map((u) => u?.username?.toLowerCase()).filter(Boolean)
  );

  if (!existingSet.has(base)) {
    return base;
  }

  // Jika username sudah ada, tambahkan suffix acak
  for (let i = 0; i < 10; i++) {
    const candidate = `${base}_${Math.floor(10 + Math.random() * 90)}`;
    if (!existingSet.has(candidate)) {
      return candidate;
    }
  }

  return `${base}_${Date.now().toString().slice(-4)}`;
}

/**
 * Mendapatkan URL basis aplikasi aktif untuk disematkan dalam pesan undangan.
 */
export function getAppBaseUrl() {
  if (typeof window === "undefined") {
    return "https://43.156.236.102/wedding/";
  }
  const origin = window.location.origin;
  const base = import.meta.env.BASE_URL || "/wedding/";
  const normalizedBase = base.startsWith("/") ? base : `/${base}`;
  return `${origin}${normalizedBase}`;
}

/**
 * Menyusun template pesan ramah siap kirim via WhatsApp atau disalin ke clipboard.
 */
export function buildInviteWhatsAppMessage({
  name,
  email,
  username,
  tempPassword,
  appUrl,
}) {
  const displayName = name || username || "Teman";
  const targetUrl = appUrl || getAppBaseUrl();

  return `Halo ${displayName}! 💍✨

Ini akun akses Wedding Planner kamu untuk merencanakan pernikahan secara privat dan mudah:

🌐 Link Web App: ${targetUrl}
📧 Email Login: ${email}
👤 Username: ${username}
🔑 Password Sementara: ${tempPassword}

Silakan login langsung di HP atau laptop. Setelah masuk, kamu bisa langsung mengatur nama calon pengantin, tanggal acara, serta mengganti kata sandi di menu Pengaturan.

Semoga persiapan pernikahannya lancar dan berkesan ya! 🎉`;
}

/**
 * Membuat akun baru di PocketBase atau memperbarui password sementara jika email sudah terdaftar.
 * Hanya dapat dipanggil oleh Superadmin / Admin.
 *
 * @param {object} params
 * @param {string} params.email - Email rekan (wajib)
 * @param {string} [params.name] - Nama panggilan rekan (opsional)
 * @param {Array<object>} [params.existingUsers] - Daftar pengguna lokal untuk deteksi tabrakan
 * @param {object} [params.pbClient] - Klien PocketBase (default: instance aplikasi)
 * @returns {Promise<{ isNew: boolean, record: object, tempPassword: string, username: string, messageText: string }>}
 */
export async function createOrResetFriendAccount({
  email,
  name = "",
  existingUsers = [],
  pbClient = pb,
}) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new Error("Format alamat email tidak valid.");
  }

  const cleanName = String(name || "").trim();
  const tempPassword = generateTemporaryPassword();

  // Cari apakah user dengan email ini sudah ada
  const existingUser = (existingUsers || []).find(
    (u) => u?.email?.toLowerCase() === cleanEmail
  );

  let record;
  const isNew = !existingUser?.id;

  if (existingUser?.id) {
    // Jika email sudah ada, perbarui kata sandi menjadi kata sandi sementara baru
    record = await pbClient.collection("users").update(existingUser.id, {
      password: tempPassword,
      passwordConfirm: tempPassword,
    });
  } else {
    // Buat record baru dengan role "owner" agar teman memiliki ruang pernikahan sendiri
    const username = generateCleanUsername(cleanEmail, cleanName, existingUsers);
    record = await pbClient.collection("users").create({
      email: cleanEmail,
      username,
      name: cleanName || username,
      password: tempPassword,
      passwordConfirm: tempPassword,
      app_role: "owner",
    });
  }

  const username = record?.username || generateCleanUsername(cleanEmail, cleanName);
  const finalName = record?.name || cleanName || username;
  const messageText = buildInviteWhatsAppMessage({
    name: finalName,
    email: cleanEmail,
    username,
    tempPassword,
  });

  return {
    isNew,
    record,
    tempPassword,
    username,
    name: finalName,
    email: cleanEmail,
    messageText,
  };
}
