import PocketBase from "pocketbase";

/**
 * PocketBase client (singleton).
 * Ubah PB_URL lewat file .env (VITE_PB_URL) bila server tidak di localhost.
 */
const PB_URL = import.meta.env.VITE_PB_URL || "http://127.0.0.1:8090";

const pb = new PocketBase(PB_URL);

// Matikan auto-cancellation agar beberapa fetch paralel tidak saling membatalkan.
pb.autoCancellation(false);

export default pb;
export { PB_URL };
