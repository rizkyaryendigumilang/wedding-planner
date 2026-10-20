import PocketBase from "pocketbase";

/**
 * PocketBase client (singleton).
 * Membaca URL dari localStorage (wedding_pb_url) bila diubah saat testing di HP,
 * atau dari variabel lingkungan VITE_PB_URL, dengan fallback localhost.
 */
const getEffectivePbUrl = () => {
  if (typeof window !== "undefined") {
    try {
      const customUrl = localStorage.getItem("wedding_pb_url");
      if (customUrl && customUrl.trim()) {
        return customUrl.trim();
      }
    } catch (_) {}
  }
  return import.meta.env.VITE_PB_URL || "http://127.0.0.1:8090";
};

const PB_URL = getEffectivePbUrl();

const pb = new PocketBase(PB_URL);

// Matikan auto-cancellation agar beberapa fetch paralel tidak saling membatalkan.
pb.autoCancellation(false);

export default pb;
export { PB_URL, getEffectivePbUrl };
