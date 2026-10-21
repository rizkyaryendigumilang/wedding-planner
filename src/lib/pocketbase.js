import PocketBase from "pocketbase";

const VPS_HOST = "43.156.236.102";

/**
 * Normalisasi URL PocketBase:
 * - Menjamin protocol http:// atau https://
 * - Mengembalikan origin murni (protokol + hostname + port jika ada)
 * - Menolak protokol berbahaya/tidak valid (javascript, file, ws, data)
 * - Menghilangkan path arbitrer, trailing slash, query parameter, dan hash fragment
 * - Mendukung localhost, IP LAN, dan port custom untuk development
 */
const normalizePbUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  // Validasi URL hanya menerima protokol http atau https
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return "";
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    return parsed.origin;
  } catch (_) {
    return "";
  }
};

/**
 * PocketBase client (singleton).
 * Membaca URL dari localStorage (wedding_pb_url) bila diubah saat testing di HP/perangkat,
 * atau dari variabel lingkungan VITE_PB_URL, dengan fallback localhost.
 */
const getEffectivePbUrl = () => {
  if (typeof window !== "undefined") {
    try {
      const storage = window.localStorage || (typeof localStorage !== "undefined" ? localStorage : null);
      const customUrl = storage?.getItem?.("wedding_pb_url");
      const normalizedCustom = normalizePbUrl(customUrl);
      if (normalizedCustom) {
        return normalizedCustom;
      }
    } catch (_) {}
  }
  const envUrl = normalizePbUrl(import.meta.env?.VITE_PB_URL);
  return envUrl || "http://127.0.0.1:8090";
};

const PB_URL = getEffectivePbUrl();

const pb = new PocketBase(PB_URL);

// Matikan auto-cancellation agar beberapa fetch paralel tidak saling membatalkan.
pb.autoCancellation(false);

/**
 * Memeriksa apakah URL ditujukan ke endpoint publik reverse proxy Caddy di VPS (43.156.236.102 via HTTPS standar).
 * - URL eksternal (Telegram, Google Drive, dsb): TIDAK di-rewrite.
 * - Endpoint lokal (127.0.0.1, LAN IP perangkat): TIDAK di-rewrite.
 * - Endpoint VPS dengan port khusus (misal port PocketBase langsung :8090): TIDAK di-rewrite.
 * - Hanya traffic HTTPS publik standar (port 443 / default) ke 43.156.236.102 yang melewati routing Caddy /wedding-api/.
 */
const isVpsPublicProxy = (urlStr) => {
  if (typeof urlStr !== "string" || !urlStr.trim()) return false;
  try {
    const isAbsolute = urlStr.startsWith("http://") || urlStr.startsWith("https://");
    const baseOrigin = PB_URL.startsWith("http") ? PB_URL : "http://127.0.0.1:8090";
    const parsed = new URL(urlStr, isAbsolute ? undefined : baseOrigin);

    // Hostname harus tepat VPS_HOST
    if (parsed.hostname !== VPS_HOST) {
      return false;
    }

    // Hanya traffic HTTPS standar (port default atau 443) yang melalui Caddy proxy
    const isStandardHttps = parsed.protocol === "https:" && (parsed.port === "" || parsed.port === "443");
    if (!isStandardHttps) {
      return false;
    }

    // Jika URL relatif, pastikan PB_URL yang dikonfigurasi memang menargetkan proxy publik VPS
    if (!isAbsolute) {
      const baseParsed = new URL(baseOrigin);
      return (
        baseParsed.hostname === VPS_HOST &&
        baseParsed.protocol === "https:" &&
        (baseParsed.port === "" || baseParsed.port === "443")
      );
    }

    return true;
  } catch (_) {
    return false;
  }
};

/**
 * VPS Reverse Proxy Rewriter:
 * Caddy me-route `/wedding-api/*` -> PocketBase (127.0.0.1:8090) dengan rewrite `/wedding-api` -> `/api`,
 * sedangkan `/api/*` di-route ke Open WebUI.
 *
 * Rewriter ini memastikan semua endpoint API, file media, dan EventSource di VPS
 * menggunakan prefix `/wedding-api/` serta mencegah duplikasi prefix.
 */
const rewritePbUrl = (urlStr) => {
  if (!isVpsPublicProxy(urlStr)) return urlStr;
  try {
    if (urlStr.startsWith("http://") || urlStr.startsWith("https://")) {
      const u = new URL(urlStr);
      let pathname = u.pathname;
      pathname = pathname
        .replace(/\/wedding-api\/api\//g, "/wedding-api/")
        .replace(/\/wedding-api\/wedding-api\//g, "/wedding-api/")
        .replace(/^\/api\//, "/wedding-api/")
        .replace(/^\/api$/, "/wedding-api");
      u.pathname = pathname;
      return u.toString();
    }
    return urlStr
      .replace(/\/wedding-api\/api\//g, "/wedding-api/")
      .replace(/\/wedding-api\/wedding-api\//g, "/wedding-api/")
      .replace(/^\/api\//, "/wedding-api/")
      .replace(/^\/api$/, "/wedding-api");
  } catch (_) {
    return urlStr;
  }
};

// Override URL builder agar file URL (pb.files.getURL) dan realtime URL otomatis ter-rewrite.
// (pb.buildUrl di SDK 0.28.1 otomatis memanggil this.buildURL, sehingga tidak diperlukan override ganda)
const originalBuildURL = pb.buildURL.bind(pb);
pb.buildURL = (path) => {
  return rewritePbUrl(originalBuildURL(path));
};

// Hook beforeSend untuk intercept dan rewrite setiap HTTP request PocketBase
pb.beforeSend = (url, options) => {
  return {
    url: rewritePbUrl(url),
    options,
  };
};

export default pb;
export { PB_URL, getEffectivePbUrl, normalizePbUrl, rewritePbUrl, isVpsPublicProxy };
