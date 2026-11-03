/**
 * Aturan Resolusi Nama Pasangan (Couple & Partner Dynamic Resolution Rule)
 *
 * Mengatur penentuan nama CPP, CPW, nama gabungan, inisial avatar, dan slug link secara dinamis
 * sesuai data `couple` dan akun pengguna yang sedang login (`user`).
 * Menjamin tidak ada nama orang yang ter-hardcode di judul dokumen, pratinjau tautan,
 * balon chat WhatsApp, atau komponen UI lainnya.
 */

/**
 * Resolusi nama panggilan CPP:
 * 1. Jika data couple tersimpan dan bukan placeholder generic ("CPP"), gunakan nama dari couple.
 * 2. Jika user yang login bertindak sebagai CPP (partner_role === "CPP") dan memiliki nama profil, gunakan nama user.
 * 3. Fallback: nilai nickname dari couple atau "CPP".
 */
export function getCppNickname(couple, user) {
  const fromCouple = couple?.cpp_nickname?.trim();
  if (fromCouple && fromCouple.toLowerCase() !== "cpp") {
    return fromCouple;
  }
  if (user?.partner_role === "CPP" && user.name?.trim()) {
    return user.name.trim();
  }
  return fromCouple || "CPP";
}

/**
 * Resolusi nama panggilan CPW:
 * 1. Jika data couple tersimpan dan bukan placeholder generic ("CPW"), gunakan nama dari couple.
 * 2. Jika user yang login bertindak sebagai CPW (partner_role === "CPW") dan memiliki nama profil, gunakan nama user.
 * 3. Fallback: nilai nickname dari couple atau "CPW".
 */
export function getCpwNickname(couple, user) {
  const fromCouple = couple?.cpw_nickname?.trim();
  if (fromCouple && fromCouple.toLowerCase() !== "cpw") {
    return fromCouple;
  }
  if (user?.partner_role === "CPW" && user.name?.trim()) {
    return user.name.trim();
  }
  return fromCouple || "CPW";
}

/**
 * Resolusi nama lengkap CPP
 */
export function getCppFullName(couple, user) {
  return couple?.cpp_full_name?.trim() || getCppNickname(couple, user);
}

/**
 * Resolusi nama lengkap CPW
 */
export function getCpwFullName(couple, user) {
  return couple?.cpw_full_name?.trim() || getCpwNickname(couple, user);
}

/**
 * Mendapatkan nama tampilan gabungan pasangan untuk UI, tab browser, dan footer.
 * Aturan:
 * - Jika kedua nama ada dan bukan placeholder generic: "${cpp} & ${cpw}"
 * - Jika hanya CPP: "${cpp} & Pasangan"
 * - Jika hanya CPW: "Pasangan & ${cpw}"
 * - Jika data belum disesuaikan atau belum login: fallback ke "Wedding Planner"
 */
export function getCoupleDisplayName(couple, user, fallback = "Wedding Planner") {
  const cpp = getCppNickname(couple, user);
  const cpw = getCpwNickname(couple, user);

  const hasCpp = Boolean(cpp && cpp.toLowerCase() !== "cpp");
  const hasCpw = Boolean(cpw && cpw.toLowerCase() !== "cpw");

  if (hasCpp && hasCpw) {
    return `${cpp} & ${cpw}`;
  }
  if (hasCpp) {
    return `${cpp} & Pasangan`;
  }
  if (hasCpw) {
    return `Pasangan & ${cpw}`;
  }
  if (cpp && cpw && (couple?.cpp_nickname || couple?.cpw_nickname)) {
    return `${cpp} & ${cpw}`;
  }
  return fallback;
}

/**
 * Inisial avatar dua mempelai (contoh: "R&R", "D&A", atau "WP")
 */
export function getCoupleInitials(couple, user) {
  const cpp = getCppNickname(couple, user);
  const cpw = getCpwNickname(couple, user);
  const c1 = cpp && cpp.toLowerCase() !== "cpp" ? cpp.charAt(0).toUpperCase() : "";
  const c2 = cpw && cpw.toLowerCase() !== "cpw" ? cpw.charAt(0).toUpperCase() : "";
  if (c1 && c2) return `${c1}&${c2}`;
  if (c1) return c1;
  if (c2) return c2;
  return "WP";
}

/**
 * Slug dinamis untuk URL undangan atau pratinjau tautan (misal: "dimas-annisa")
 */
export function getCoupleSlug(couple, user) {
  const cpp = getCppNickname(couple, user);
  const cpw = getCpwNickname(couple, user);
  const hasCpp = cpp && cpp.toLowerCase() !== "cpp";
  const hasCpw = cpw && cpw.toLowerCase() !== "cpw";

  if (hasCpp && hasCpw) {
    return `${cpp}-${cpw}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  if (hasCpp) {
    return cpp.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }
  if (hasCpw) {
    return cpw.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }
  return "undangan";
}
