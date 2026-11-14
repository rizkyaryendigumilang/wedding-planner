import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import pb from "./pocketbase";
import { useAuth } from "./auth";
import { toDirectImageUrl, toDriveOpenUrl, guessAltFromUrl } from "./photos";
import { saveAutoBackupSnapshot } from "./autoBackup";

/**
 * WeddingDataContext
 * Satu kali fetch untuk seluruh aplikasi, dipakai bersama oleh semua modul.
 * Menyediakan: couple, budgets, administrations, seserahan, vendors, guests,
 * cashflow, logs, plus helper statistik & mutation.
 */
const WeddingContext = createContext(null);

const EMPTY = {
  couple: null,
  budgets: [],
  administrations: [],
  seserahan: [],
  vendors: [],
  guests: [],
  cashflow: [],
  logs: [],
  photos: [],
  settings: null,
  trashItems: [],
  rundowns: [],
  gifts: [],
};

export const DEFAULT_WA_TEMPLATE = `Kepada Yth. {nama},

Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri pernikahan kami:

💍 {pengantin}
📅 {tanggal}
📍 {venue}

Tautan undangan dan konfirmasi kehadiran (RSVP) dapat diakses melalui:
{link}

Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.

Terima kasih,
{pengantin}`;

export function getBudgetPaid(b) {
  return Number(b?.termin1 || 0) + Number(b?.termin2 || 0) + Number(b?.termin3 || 0) + Number(b?.termin4 || 0);
}

/**
 * Ubah rekaman `gallery_photos` menjadi bentuk siap-tampil: tambahkan `src`
 * (URL thumbnail 600x600 untuk grid & card agar hemat kuota ~90%), `fullSrc` untuk resolusi penuh,
 * dan `openUrl`.
 */
export function normalizePhoto(record) {
  let thumb = "";
  let full = "";

  if (record.image) {
    thumb = pb.files.getURL(record, record.image, { thumb: "600x600" });
    full = pb.files.getURL(record, record.image);
  } else if (record.source_url) {
    thumb = toDirectImageUrl(record.source_url);
    full = thumb;
  }

  return {
    ...record,
    src: thumb,
    fullSrc: full || thumb,
    openUrl: record.image ? full : toDriveOpenUrl(record.source_url),
    alt: record.alt || (record.source_url ? guessAltFromUrl(record.source_url) : "Foto Prewedding"),
    isRenderable: Boolean(thumb),
  };
}

export function getScopedCacheKey(userOrCoupleId) {
  if (!userOrCoupleId) return "wedding_planner_cache_v2";
  const id = typeof userOrCoupleId === "string" ? userOrCoupleId : userOrCoupleId?.couple || userOrCoupleId?.id;
  return id ? `wedding_planner_cache_v2_${id}` : "wedding_planner_cache_v2";
}

function loadCachedData(user) {
  if (typeof window === "undefined") return null;
  try {
    const targetUserId = user?.id || pb.authStore.record?.id;
    const targetCoupleId = user?.couple || pb.authStore.record?.couple;

    // 1. Coba baca cache ber-namespace spesifik untuk user/couple ini
    let raw = null;
    if (targetCoupleId) raw = localStorage.getItem(getScopedCacheKey(targetCoupleId));
    if (!raw && targetUserId) raw = localStorage.getItem(getScopedCacheKey(targetUserId));
    if (!raw) raw = localStorage.getItem("wedding_planner_cache_v2");

    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.couple) {
      // Isolasi ketat: jika user sudah terotentikasi dan data cache milik couple/owner lain, abaikan
      if (
        targetUserId &&
        parsed.couple.owner &&
        parsed.couple.owner !== targetUserId &&
        targetCoupleId &&
        parsed.couple.id !== targetCoupleId
      ) {
        return null;
      }
      return {
        ...EMPTY,
        ...parsed,
        trashItems: parsed.trashItems || [],
        photos: (parsed.photos || []).map(normalizePhoto),
        rundowns: parsed.rundowns || [],
        gifts: parsed.gifts || [],
      };
    }
  } catch (err) {
    console.warn("Gagal membaca cache lokal:", err);
  }
  return null;
}

function saveCachedData(freshData) {
  if (typeof window === "undefined" || !freshData?.couple) return;
  try {
    const coupleId = freshData.couple.id;
    const targetKey = getScopedCacheKey(coupleId);

    // Filter logs & photos down to light essentials for cache efficiency
    const cachePayload = {
      couple: freshData.couple,
      budgets: freshData.budgets,
      administrations: freshData.administrations,
      seserahan: freshData.seserahan,
      vendors: freshData.vendors,
      guests: freshData.guests,
      cashflow: freshData.cashflow,
      logs: (freshData.logs || []).slice(0, 15),
      settings: freshData.settings,
      photos: (freshData.photos || []).map((p) => ({
        id: p.id,
        src: p.src,
        fullSrc: p.fullSrc,
        alt: p.alt,
        isRenderable: p.isRenderable,
      })),
      trashItems: (freshData.trashItems || []).slice(0, 20),
      rundowns: freshData.rundowns || [],
      gifts: freshData.gifts || [],
      cachedAt: Date.now(),
    };

    const serialized = JSON.stringify(cachePayload);
    localStorage.setItem(targetKey, serialized);

    // Auto-Sync Snapshot Cadangan Lapisan 1 secara otomatis
    try {
      saveAutoBackupSnapshot(freshData);
    } catch (_) {}

    // Hapus duplikat key legacy untuk menghemat kuota localStorage 5MB
    if (localStorage.getItem("wedding_planner_cache_v2") && targetKey !== "wedding_planner_cache_v2") {
      try {
        localStorage.removeItem("wedding_planner_cache_v2");
      } catch (_) {}
    }
  } catch (err) {
    if (err?.name === "QuotaExceededError" || err?.code === 22) {
      console.warn("Kapasitas LocalStorage penuh, menyimpan data inti saja...");
      try {
        const minimalPayload = JSON.stringify({
          couple: freshData.couple,
          budgets: freshData.budgets,
          vendors: freshData.vendors,
          guests: freshData.guests,
          rundowns: freshData.rundowns,
          settings: freshData.settings,
          cachedAt: Date.now(),
        });
        localStorage.setItem(getScopedCacheKey(freshData.couple.id), minimalPayload);
      } catch (_) {}
    } else {
      console.warn("Gagal menyimpan cache lokal:", err);
    }
  }
}

/** Beri tahu PocketBase bahwa koleksi berubah -> semua modul refresh. */
export function useWedding() {
  const ctx = useContext(WeddingContext);
  if (!ctx) throw new Error("useWedding harus dipakai di dalam <WeddingProvider>");
  return ctx;
}

export function WeddingProvider({ children }) {
  const { user, isAuthed, ready: authReady } = useAuth();
  const [data, setData] = useState(() => {
    // SWR Instant launch: gunakan cache lokal jika tersedia untuk akun ini
    const cached = loadCachedData(user);
    return cached || EMPTY;
  });
  // Jika cache lokal sudah ada, jangan kunci layar dengan spinner (0ms render!)
  const [loading, setLoading] = useState(() => !loadCachedData(user));
  const [error, setError] = useState("");

  const load = useCallback(async (isBackground = false) => {
    // Koleksi data butuh login; jangan memanggil API saat belum masuk.
    if (!pb.authStore.isValid) {
      setData(EMPTY);
      setError("");
      setLoading(false);
      return;
    }
    // Cek apakah data lokal sudah ada agar tidak memicu spinner yang mengganggu
    const hasLocalData = Boolean(loadCachedData(user)?.couple?.id);
    if (!isBackground && !hasLocalData) {
      setLoading(true);
    }
    setError("");
    try {
      let couple = null;
      if (user?.couple) {
        try {
          couple = await pb.collection("couples").getOne(user.couple);
        } catch (_) {}
      }
      if (!couple && user?.id) {
        try {
          couple = await pb.collection("couples").getFirstListItem(`owner="${user.id}"`);
        } catch (_) {}
      }
      if (!couple && user?.id) {
        // Tidak ada couple untuk user ini -> buat couple baru (default) agar
        // data antar akun tidak saling bocor. Jangan pernah fallback ke couple
        // pertama di database (itu milik orang lain).
        try {
          const isCpw = user?.partner_role === "CPW";
          couple = await pb.collection("couples").create({
            owner: user.id,
            cpp_nickname: isCpw ? "CPP" : (user?.name || "CPP"),
            cpw_nickname: isCpw ? (user?.name || "CPW") : "CPW",
            wedding_date: "2028-02-17",
            venue: "Gedung Pernikahan",
            target_budget: 85000000,
          });
          // Tautkan couple baru ke user agar kunjungan berikutnya langsung.
          try {
            await pb.collection("users").update(user.id, { couple: couple.id });
          } catch (_) {}
        } catch (_) {
          couple = null;
        }
      }
      const coupleId = couple?.id;

      if (!coupleId) {
        setData(EMPTY);
        return;
      }

      // 1. Tahap Prioritas 1: Data inti pernikahan untuk Dashboard, Tamu, Resepsi, & Rundown
      const [
        budgets,
        vendors,
        guests,
        cashflow,
        rundowns,
        settings,
      ] = await Promise.all([
        pb.collection("budgets").getFullList({ filter: `couple="${coupleId}"`, sort: "budget_type,category" }).catch(() => []),
        pb.collection("vendor_checklists").getFullList({ filter: `couple="${coupleId}"`, sort: "sort_order" }).catch(() => []),
        pb.collection("wedding_guests").getFullList({ filter: `couple="${coupleId}"`, sort: "name" }).catch(() => []),
        pb.collection("cashflow_entries").getFullList({ filter: `couple="${coupleId}"`, sort: "sort_order" }).catch(() => []),
        pb.collection("rundown_events").getFullList({ filter: `couple="${coupleId}"`, sort: "time_start,sort_order" }).catch(() => []),
        pb
          .collection("app_settings")
          .getFirstListItem(`couple="${coupleId}"`)
          .catch(() => pb.collection("app_settings").getFirstListItem(`owner_key="default"`))
          .catch(() => null),
      ]);

      // 2. Tahap Prioritas 2: Modul sekunder & media (mencegah saturasi koneksi simultan)
      const [
        administrations,
        seserahan,
        logs,
        photosRaw,
        trashItems,
        gifts,
      ] = await Promise.all([
        pb.collection("administrations").getFullList({ filter: `couple="${coupleId}"`, sort: "sort_order" }).catch(() => []),
        pb.collection("seserahan_items").getFullList({ filter: `couple="${coupleId}"`, sort: "category" }).catch(() => []),
        pb
          .collection("activity_logs")
          .getList(1, 40, { filter: `couple="${coupleId}"`, sort: "-created" })
          .then((res) => res.items)
          .catch(() => []),
        pb
          .collection("gallery_photos")
          .getFullList({ filter: `couple="${coupleId}"`, sort: "sort_order,-created" })
          .catch(() => []),
        pb
          .collection("recycle_bin")
          .getList(1, 50, { filter: `couple="${coupleId}"`, sort: "-created" })
          .catch(() => pb.collection("recycle_bin").getList(1, 50, { sort: "-created" }))
          .then((res) => res.items || [])
          .catch(() => []),
        pb
          .collection("wedding_gifts")
          .getFullList({ filter: `couple="${coupleId}"`, sort: "-created" })
          .catch(() => []),
      ]);

      let mergedSettings = settings;
      try {
        const localExtra = JSON.parse(localStorage.getItem(`wedding_settings_extra_${coupleId}`) || "{}");
        if (localExtra && Object.keys(localExtra).length > 0) {
          mergedSettings = { ...(settings || {}), ...localExtra };
        }
      } catch (_) {}

      const freshData = {
        couple,
        budgets,
        administrations,
        seserahan,
        vendors,
        guests,
        cashflow,
        logs,
        photos: photosRaw.map(normalizePhoto),
        settings: mergedSettings,
        trashItems,
        rundowns,
        gifts,
      };

      setData(freshData);
      saveCachedData(freshData);
    } catch (err) {
      console.error("Gagal memuat data:", err);
      setError(err?.message || "Gagal memuat data dari PocketBase");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthed) {
      // Menyesuaikan state dengan sesi eksternal (PocketBase authStore).
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sinkronisasi dengan store auth eksternal
      setData(EMPTY);
      setLoading(false);
      return;
    }
    load();
  }, [authReady, isAuthed, load]);

  const coupleId = data.couple?.id;

  // ------------------------------------------------------------------ real-time sync
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [lastLiveUpdate, setLastLiveUpdate] = useState(null);

  useEffect(() => {
    if (!authReady || !isAuthed || !coupleId) {
      return;
    }

    let debounceTimer = null;
    const triggerReload = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        load(true);
        setLastLiveUpdate(Date.now());
      }, 600);
    };

    const COLLECTION_KEY_MAP = {
      couples: "couple",
      app_settings: "settings",
      budgets: "budgets",
      administrations: "administrations",
      seserahan_items: "seserahan",
      vendor_checklists: "vendors",
      wedding_guests: "guests",
      cashflow_entries: "cashflow",
      activity_logs: "logs",
      gallery_photos: "photos",
      recycle_bin: "trashItems",
      rundown_events: "rundowns",
      wedding_gifts: "gifts",
    };

    const handleRealtimeEvent = (collectionName, e) => {
      if (!e || !e.action || !e.record) return;
      const { action, record } = e;
      const key = COLLECTION_KEY_MAP[collectionName];
      if (!key) return;

      // Isolasi couple: pastikan record milik couple ini (kecuali app_settings tanpa couple)
      if (record.couple && record.couple !== coupleId) {
        return;
      }

      setLastLiveUpdate(Date.now());

      if (key === "couple") {
        if (record.id === coupleId && action === "update") {
          setData((prev) => {
            const next = { ...prev, couple: record };
            saveCachedData(next);
            return next;
          });
        }
        return;
      }

      if (key === "settings") {
        setData((prev) => {
          const next = { ...prev, settings: { ...(prev.settings || {}), ...record } };
          saveCachedData(next);
          return next;
        });
        return;
      }

      const formattedRecord = key === "photos" ? normalizePhoto(record) : record;

      setData((prev) => {
        const list = Array.isArray(prev[key]) ? prev[key] : [];
        let updatedList;

        if (action === "create") {
          const exists = list.some((item) => item.id === formattedRecord.id);
          if (exists) {
            updatedList = list.map((item) => (item.id === formattedRecord.id ? formattedRecord : item));
          } else if (key === "logs" || key === "gifts" || key === "trashItems") {
            updatedList = [formattedRecord, ...list].slice(0, key === "logs" ? 40 : 100);
          } else {
            updatedList = [...list, formattedRecord];
          }
        } else if (action === "update") {
          updatedList = list.map((item) => (item.id === formattedRecord.id ? { ...item, ...formattedRecord } : item));
        } else if (action === "delete") {
          updatedList = list.filter((item) => item.id !== formattedRecord.id);
        } else {
          updatedList = list;
        }

        const nextData = { ...prev, [key]: updatedList };
        saveCachedData(nextData);
        return nextData;
      });
    };

    const COLLECTIONS = [
      "couples",
      "budgets",
      "administrations",
      "seserahan_items",
      "vendor_checklists",
      "wedding_guests",
      "cashflow_entries",
      "activity_logs",
      "gallery_photos",
      "app_settings",
      "recycle_bin",
      "rundown_events",
      "wedding_gifts",
    ];

    COLLECTIONS.forEach((name) => {
      pb.collection(name)
        .subscribe("*", (e) => {
          try {
            handleRealtimeEvent(name, e);
          } catch (err) {
            console.warn(`Granular update warning for ${name}, fallback to reload:`, err);
            triggerReload();
          }
        })
        .then(() => {
          setIsLiveConnected(true);
        })
        .catch((err) => {
          console.warn(`Gagal menghubungkan real-time ke ${name}:`, err);
        });
    });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      COLLECTIONS.forEach((name) => {
        pb.collection(name).unsubscribe("*").catch(() => {});
      });
      setIsLiveConnected(false);
    };
  }, [authReady, isAuthed, coupleId, load]);

  // ------------------------------------------------------------------ derived
  const stats = useMemo(() => computeStats(data), [data]);

  /** Simpan preferensi aplikasi (tautan Drive, status prewedding, dsb.). */
  const saveSettings = useCallback(
    async (patch) => {
      if (!coupleId) return null;
      const payload = { couple: coupleId, owner_key: "default", ...patch };

      try {
        const localKey = `wedding_settings_extra_${coupleId}`;
        const prev = JSON.parse(localStorage.getItem(localKey) || "{}");
        localStorage.setItem(localKey, JSON.stringify({ ...prev, ...patch }));
      } catch (_) {}

      try {
        let existing = null;
        try {
          existing = await pb.collection("app_settings").getFirstListItem(`couple="${coupleId}"`);
        } catch (_) {
          try {
            existing = await pb.collection("app_settings").getFirstListItem('owner_key="default"');
          } catch (_) {}
        }

        if (existing) {
          const updated = await pb.collection("app_settings").update(existing.id, payload);
          await load();
          return updated;
        } else {
          const created = await pb.collection("app_settings").create(payload);
          await load();
          return created;
        }
      } catch (err) {
        console.warn("Sinkronisasi server pengaturan parsial:", err?.message || err);
        await load();
        return { ...payload, id: "local-mirror" };
      }
    },
    [coupleId, load]
  );

  const addLog = useCallback(
    async (description, actionType = "info", amount = 0) => {
      if (!coupleId) return;
      try {
        const actorName = user?.name || user?.username || "Pengguna";
        const actorRole =
          user?.app_role === "panitia"
            ? "Panitia"
            : user?.app_role === "wo"
            ? "WO"
            : user?.partner_role || "Owner";

        await pb.collection("activity_logs").create({
          couple: coupleId,
          actor_user: user?.id || null,
          actor_name: actorName,
          actor_role: actorRole,
          action_description: description,
          action_type: ["info", "payment", "task", "guest", "document", "create", "delete", "warning"].includes(actionType)
            ? actionType
            : "info",
          amount: Number(amount) || 0,
        });
        await load(true);
      } catch (err) {
        console.error("Gagal menambah log:", err);
      }
    },
    [coupleId, user, load]
  );

  const saveCouple = useCallback(
    async (patch) => {
      let result;
      if (!coupleId) {
        const payload = {
          wedding_date: "2028-02-17",
          cpp_nickname: "CPP",
          cpw_nickname: "CPW",
          venue: "Gedung Pernikahan",
          target_budget: 0,
          ...patch,
        };
        result = await pb.collection("couples").create(payload);
      } else {
        result = await pb.collection("couples").update(coupleId, patch);
      }
      await load();
      return result;
    },
    [coupleId, load]
  );

  /**
   * Pindahkan item ke Tempat Sampah (Soft Delete).
   * Data dipindahkan dari koleksi asal ke `recycle_bin` agar bisa dipulihkan kapan saja.
   */
  const moveToTrash = useCallback(
    async (collectionName, itemOrTitle, optionalItemOrTitle) => {
      let item = itemOrTitle;
      let itemTitle = optionalItemOrTitle;
      if (typeof itemOrTitle === "string" && typeof optionalItemOrTitle === "object" && optionalItemOrTitle?.id) {
        item = optionalItemOrTitle;
        itemTitle = itemOrTitle;
      }
      if (!item || !item.id) return;
      const title =
        (typeof itemTitle === "string" && itemTitle) ||
        item.name ||
        item.title ||
        item.detail ||
        item.activity_name ||
        item.description ||
        "Item";
      const userIdentifier =
        pb.authStore.record?.username ||
        pb.authStore.record?.name ||
        pb.authStore.record?.email ||
        pb.authStore.model?.username ||
        "Pengguna";

      // 1. Simpan salinan ke recycle_bin (pertahankan pemetaan couple agar
      //    data tetap terisolasi per-akun saat dipulihkan)
      await pb.collection("recycle_bin").create({
        collection_name: collectionName,
        item_title: title,
        item_data: item,
        deleted_by: userIdentifier,
        couple: item.couple || coupleId || null,
      });

      // 2. Hapus dari koleksi asli
      await pb.collection(collectionName).delete(item.id);

      // 3. Catat di riwayat aktivitas
      await addLog(`"${title}" dipindahkan ke Tempat Sampah`, "delete");

      // 4. Muat ulang data
      await load(true);
    },
    [addLog, load, coupleId]
  );

  /**
   * Pulihkan item dari Tempat Sampah kembali ke koleksi asalnya.
   */
  const restoreFromTrash = useCallback(
    async (trashRecord) => {
      if (!trashRecord || !trashRecord.collection_name || !trashRecord.item_data) return;

      const raw = { ...trashRecord.item_data };
      // Bersihkan atribut internal sistem PocketBase yang tidak boleh diisi saat create baru
      delete raw.id;
      delete raw.created;
      delete raw.updated;
      delete raw.collectionId;
      delete raw.collectionName;
      delete raw.expand;

      // 1. Buat ulang record di koleksi asal
      await pb.collection(trashRecord.collection_name).create(raw);

      // 2. Hapus dari recycle_bin
      await pb.collection("recycle_bin").delete(trashRecord.id);

      // 3. Catat ke riwayat
      await addLog(`"${trashRecord.item_title}" dipulihkan dari Tempat Sampah`, "create");

      // 4. Muat ulang data
      await load(true);
    },
    [addLog, load]
  );

  /**
   * Hapus permanen satu item dari Tempat Sampah.
   */
  const permanentDeleteFromTrash = useCallback(
    async (trashId, itemTitle) => {
      if (!trashId) return;
      await pb.collection("recycle_bin").delete(trashId);
      if (itemTitle) {
        await addLog(`"${itemTitle}" dihapus permanen dari Tempat Sampah`, "delete");
      }
      await load(true);
    },
    [addLog, load]
  );

  /**
   * Kosongkan seluruh Tempat Sampah (Hapus Permanen Semua).
   * Dibatasi hanya untuk pemilik akun (Owner / CPP / CPW), bukan panitia.
   */
  const emptyTrash = useCallback(async () => {
    if (user?.app_role === "panitia" || user?.app_role === "wo") {
      throw new Error("Hanya pemilik akun (CPP/CPW) yang berhak mengosongkan Tempat Sampah.");
    }
    const items = data.trashItems || [];
    if (items.length === 0) return;
    await Promise.all(items.map((it) => pb.collection("recycle_bin").delete(it.id).catch(() => {})));
    await addLog(`Mengosongkan Tempat Sampah (${items.length} item dihapus permanen)`, "delete");
    await load(true);
  }, [data.trashItems, addLog, load, user]);

  const toggleRundown = useCallback(
    async (eventId, isCompleted) => {
      // 1. Optimistic update: 0ms respon sentuhan di layar
      setData((prev) => ({
        ...prev,
        rundowns: (prev.rundowns || []).map((r) =>
          r.id === eventId ? { ...r, is_completed: isCompleted } : r
        ),
      }));

      // 2. Sinkronisasi PocketBase di background
      try {
        await pb.collection("rundown_events").update(eventId, { is_completed: isCompleted });
      } catch (err) {
        // Rollback jika jaringan gagal
        setData((prev) => ({
          ...prev,
          rundowns: (prev.rundowns || []).map((r) =>
            r.id === eventId ? { ...r, is_completed: !isCompleted } : r
          ),
        }));
        console.error("Gagal memperbarui status rundown:", err);
        throw err;
      }
    },
    []
  );

  const addRundownEvent = useCallback(
    async (eventData) => {
      if (!coupleId) return null;
      const created = await pb.collection("rundown_events").create({
        couple: coupleId,
        ...eventData,
      });
      await addLog(`Menambahkan agenda: "${eventData.title}"`, "task");
      await load(true);
      return created;
    },
    [coupleId, addLog, load]
  );

  const updateRundownEvent = useCallback(
    async (eventId, eventData) => {
      const updated = await pb.collection("rundown_events").update(eventId, eventData);
      await load(true);
      return updated;
    },
    [load]
  );

  const deleteRundownEvent = useCallback(
    async (eventRecord) => {
      await moveToTrash("rundown_events", eventRecord, eventRecord.title || "Agenda Rundown");
    },
    [moveToTrash]
  );

  const checkInGuest = useCallback(
    async (guestId, options = {}) => {
      const now = new Date().toISOString();
      const actualPax = options.actual_pax;
      const souvenirGiven = options.souvenir_given;

      // 1. Optimistic update: antrean tamu bergerak instan 0ms
      setData((prev) => ({
        ...prev,
        guests: (prev.guests || []).map((g) =>
          g.id === guestId
            ? {
                ...g,
                checked_in: true,
                checked_in_at: now,
                status: "Hadir",
                ...(actualPax !== undefined ? { actual_pax: actualPax } : {}),
                ...(souvenirGiven !== undefined ? { souvenir_given: souvenirGiven } : {}),
              }
            : g
        ),
      }));

      // 2. Eksekusi ke database PocketBase di background
      try {
        const payload = {
          checked_in: true,
          checked_in_at: now,
          status: "Hadir",
        };
        if (actualPax !== undefined) payload.actual_pax = actualPax;
        if (souvenirGiven !== undefined) payload.souvenir_given = souvenirGiven;

        const updated = await pb.collection("wedding_guests").update(guestId, payload);
        addLog(`Check-in tamu resepsi: "${options.guestName || "Tamu"}"`, "guest").catch(() => {});
        return updated;
      } catch (err) {
        // Rollback jika terjadi kesalahan jaringan
        await load(true);
        console.error("Gagal check-in tamu:", err);
        throw err;
      }
    },
    [addLog, load]
  );

  const undoCheckInGuest = useCallback(
    async (guestId) => {
      // 1. Optimistic update: batalkan centang tamu 0ms
      setData((prev) => ({
        ...prev,
        guests: (prev.guests || []).map((g) =>
          g.id === guestId
            ? { ...g, checked_in: false, checked_in_at: "", souvenir_given: false }
            : g
        ),
      }));

      try {
        await pb.collection("wedding_guests").update(guestId, {
          checked_in: false,
          checked_in_at: "",
          souvenir_given: false,
        });
      } catch (err) {
        await load(true);
        console.error("Gagal membatalkan check-in:", err);
        throw err;
      }
    },
    [load]
  );

  const addGift = useCallback(
    async (giftData) => {
      if (!coupleId) return null;
      const created = await pb.collection("wedding_gifts").create({
        couple: coupleId,
        ...giftData,
      });
      await addLog(
        `Mencatat kado/angpao dari: "${giftData.guest_name}"`,
        "payment",
        giftData.amount || 0
      );
      await load(true);
      return created;
    },
    [coupleId, addLog, load]
  );

  const updateGift = useCallback(
    async (giftId, giftData) => {
      const updated = await pb.collection("wedding_gifts").update(giftId, giftData);
      await load(true);
      return updated;
    },
    [load]
  );

  const deleteGift = useCallback(
    async (giftRecord) => {
      await moveToTrash("wedding_gifts", giftRecord, `Hadiah dari ${giftRecord.guest_name}`);
    },
    [moveToTrash]
  );

  // ------------------------------------------------------------------ GUESTS CRUD
  const addGuest = useCallback(
    async (guestData) => {
      if (!coupleId) return null;
      const payload = {
        couple: coupleId,
        status: "Belum",
        type: "Digital",
        pax: 1,
        checklist: false,
        invitation_sent: false,
        ...guestData,
      };
      const created = await pb.collection("wedding_guests").create(payload);
      addLog(`Menambahkan tamu: "${created.name}"`, "guest").catch(() => {});
      setData((prev) => {
        const next = { ...prev, guests: [...(prev.guests || []), created] };
        saveCachedData(next);
        return next;
      });
      return created;
    },
    [coupleId, addLog]
  );

  const updateGuest = useCallback(async (guestId, patch) => {
    setData((prev) => ({
      ...prev,
      guests: (prev.guests || []).map((g) => (g.id === guestId ? { ...g, ...patch } : g)),
    }));
    const updated = await pb.collection("wedding_guests").update(guestId, patch);
    return updated;
  }, []);

  const deleteGuest = useCallback(
    async (guestRecord) => {
      await moveToTrash("wedding_guests", guestRecord, guestRecord.name);
    },
    [moveToTrash]
  );

  const batchUpdateGuests = useCallback(
    async (ids, patch) => {
      setData((prev) => ({
        ...prev,
        guests: (prev.guests || []).map((g) => (ids.includes(g.id) ? { ...g, ...patch } : g)),
      }));
      await Promise.all(ids.map((id) => pb.collection("wedding_guests").update(id, patch)));
      addLog(`Memperbarui ${ids.length} tamu`, "guest").catch(() => {});
      load(true);
    },
    [addLog, load]
  );

  const batchAddGuests = useCallback(
    async (guestsList) => {
      if (!coupleId) return [];
      const results = [];
      for (const g of guestsList) {
        const created = await pb.collection("wedding_guests").create({
          couple: coupleId,
          status: "Belum",
          type: "Digital",
          pax: 1,
          ...g,
        });
        results.push(created);
      }
      addLog(`Mengimpor ${results.length} tamu`, "guest").catch(() => {});
      load(true);
      return results;
    },
    [coupleId, addLog, load]
  );

  // ------------------------------------------------------------------ VENDORS CRUD & ATTACHMENTS
  const addVendor = useCallback(
    async (vendorData) => {
      if (!coupleId) return null;
      let created;
      if (vendorData instanceof FormData) {
        if (!vendorData.has("couple")) {
          vendorData.append("couple", coupleId);
        }
        created = await pb.collection("vendor_checklists").create(vendorData);
      } else {
        created = await pb.collection("vendor_checklists").create({
          couple: coupleId,
          ...vendorData,
        });
      }
      const name = created.activity_name || "Vendor";
      addLog(`Menambahkan tugas vendor: "${name}"`, "task").catch(() => {});
      setData((prev) => {
        const next = { ...prev, vendors: [...(prev.vendors || []), created] };
        saveCachedData(next);
        return next;
      });
      return created;
    },
    [coupleId, addLog]
  );

  const updateVendor = useCallback(async (vendorId, patchOrFormData) => {
    if (!(patchOrFormData instanceof FormData)) {
      setData((prev) => ({
        ...prev,
        vendors: (prev.vendors || []).map((v) => (v.id === vendorId ? { ...v, ...patchOrFormData } : v)),
      }));
    }
    const updated = await pb.collection("vendor_checklists").update(vendorId, patchOrFormData);
    setData((prev) => {
      const next = {
        ...prev,
        vendors: (prev.vendors || []).map((v) => (v.id === vendorId ? updated : v)),
      };
      saveCachedData(next);
      return next;
    });
    return updated;
  }, []);

  const deleteVendor = useCallback(
    async (vendorRecord) => {
      await moveToTrash("vendor_checklists", vendorRecord, vendorRecord.activity_name);
    },
    [moveToTrash]
  );

  const toggleVendorStatus = useCallback(
    async (vendorRecord) => {
      const nextVal = !vendorRecord.is_completed;
      addLog(
        `"${vendorRecord.activity_name}" ditandai ${nextVal ? "selesai" : "belum selesai"}`,
        "task"
      ).catch(() => {});
      return updateVendor(vendorRecord.id, { is_completed: nextVal });
    },
    [updateVendor, addLog]
  );

  const toggleVendorDp = useCallback(
    async (vendorRecord) => {
      const nextVal = !vendorRecord.dp_paid;
      addLog(
        `DP vendor "${vendorRecord.activity_name}" ditandai ${nextVal ? "sudah dibayar" : "belum dibayar"}`,
        "task"
      ).catch(() => {});
      return updateVendor(vendorRecord.id, { dp_paid: nextVal });
    },
    [updateVendor, addLog]
  );

  const toggleVendorSettlement = useCallback(
    async (vendorRecord) => {
      const nextVal = !vendorRecord.settlement_paid;
      addLog(
        `Pelunasan vendor "${vendorRecord.activity_name}" ditandai ${nextVal ? "sudah lunas" : "belum lunas"}`,
        "task"
      ).catch(() => {});
      return updateVendor(vendorRecord.id, { settlement_paid: nextVal });
    },
    [updateVendor, addLog]
  );

  // ------------------------------------------------------------------ ADMINISTRATIONS CRUD & ATTACHMENTS
  const addAdministration = useCallback(
    async (adminData) => {
      if (!coupleId) return null;
      let created;
      if (adminData instanceof FormData) {
        if (!adminData.has("couple")) {
          adminData.append("couple", coupleId);
        }
        created = await pb.collection("administrations").create(adminData);
      } else {
        created = await pb.collection("administrations").create({
          couple: coupleId,
          ...adminData,
        });
      }
      addLog(`Menambahkan berkas administrasi: "${created.item}"`, "document").catch(() => {});
      setData((prev) => {
        const next = { ...prev, administrations: [...(prev.administrations || []), created] };
        saveCachedData(next);
        return next;
      });
      return created;
    },
    [coupleId, addLog]
  );

  const updateAdministration = useCallback(async (adminId, patchOrFormData) => {
    if (!(patchOrFormData instanceof FormData)) {
      setData((prev) => ({
        ...prev,
        administrations: (prev.administrations || []).map((a) => (a.id === adminId ? { ...a, ...patchOrFormData } : a)),
      }));
    }
    const updated = await pb.collection("administrations").update(adminId, patchOrFormData);
    setData((prev) => {
      const next = {
        ...prev,
        administrations: (prev.administrations || []).map((a) => (a.id === adminId ? updated : a)),
      };
      saveCachedData(next);
      return next;
    });
    return updated;
  }, []);

  const deleteAdministration = useCallback(
    async (adminRecord) => {
      await moveToTrash("administrations", adminRecord, adminRecord.item);
    },
    [moveToTrash]
  );

  const toggleAdminDoc = useCallback(
    async (adminRecord, side) => {
      const field = side === "CPP" ? "cpp_complete" : "cpw_complete";
      const nextVal = !adminRecord[field];
      addLog(
        `Dokumen "${adminRecord.item}" (${side}) ditandai ${nextVal ? "selesai" : "belum"}`,
        "document"
      ).catch(() => {});
      return updateAdministration(adminRecord.id, { [field]: nextVal });
    },
    [updateAdministration, addLog]
  );

  const toggleAdminProgress = useCallback(
    async (adminRecord) => {
      const next = adminRecord.progress === "Sudah" ? "Belum" : "Sudah";
      addLog(`"${adminRecord.item}" ditandai ${next}`, "document").catch(() => {});
      return updateAdministration(adminRecord.id, { progress: next });
    },
    [updateAdministration, addLog]
  );

  // ------------------------------------------------------------------ SESERAHAN CRUD
  const addSeserahan = useCallback(
    async (itemData) => {
      if (!coupleId) return null;
      const created = await pb.collection("seserahan_items").create({
        couple: coupleId,
        ...itemData,
      });
      addLog(`Menambahkan barang seserahan: "${created.detail}"`, "task").catch(() => {});
      setData((prev) => {
        const next = { ...prev, seserahan: [...(prev.seserahan || []), created] };
        saveCachedData(next);
        return next;
      });
      return created;
    },
    [coupleId, addLog]
  );

  const updateSeserahan = useCallback(async (itemId, patch) => {
    setData((prev) => ({
      ...prev,
      seserahan: (prev.seserahan || []).map((s) => (s.id === itemId ? { ...s, ...patch } : s)),
    }));
    const updated = await pb.collection("seserahan_items").update(itemId, patch);
    return updated;
  }, []);

  const deleteSeserahan = useCallback(
    async (itemRecord) => {
      await moveToTrash("seserahan_items", itemRecord, itemRecord.detail);
    },
    [moveToTrash]
  );

  const toggleSeserahanChecklist = useCallback(
    async (itemRecord) => {
      return updateSeserahan(itemRecord.id, { checklist: !itemRecord.checklist });
    },
    [updateSeserahan]
  );

  // ------------------------------------------------------------------ BUDGET & CASHFLOW CRUD
  const addBudget = useCallback(
    async (budgetData) => {
      if (!coupleId) return null;
      const created = await pb.collection("budgets").create({
        couple: coupleId,
        ...budgetData,
      });
      addLog(`Menambahkan pos anggaran: "${created.detail}"`, "payment", created.total_biaya || 0).catch(() => {});
      setData((prev) => {
        const next = { ...prev, budgets: [...(prev.budgets || []), created] };
        saveCachedData(next);
        return next;
      });
      return created;
    },
    [coupleId, addLog]
  );

  const updateBudget = useCallback(async (budgetId, patch) => {
    setData((prev) => ({
      ...prev,
      budgets: (prev.budgets || []).map((b) => (b.id === budgetId ? { ...b, ...patch } : b)),
    }));
    const updated = await pb.collection("budgets").update(budgetId, patch);
    return updated;
  }, []);

  const deleteBudget = useCallback(
    async (budgetRecord) => {
      await moveToTrash("budgets", budgetRecord, budgetRecord.detail);
    },
    [moveToTrash]
  );

  const addCashflow = useCallback(
    async (cashflowData) => {
      if (!coupleId) return null;
      const created = await pb.collection("cashflow_entries").create({
        couple: coupleId,
        ...cashflowData,
      });
      addLog(
        `Arus kas ${cashflowData.kind === "income" ? "masuk" : "keluar"}: "${cashflowData.description}"`,
        "payment",
        cashflowData.amount || 0
      ).catch(() => {});
      setData((prev) => {
        const next = { ...prev, cashflow: [...(prev.cashflow || []), created] };
        saveCachedData(next);
        return next;
      });
      return created;
    },
    [coupleId, addLog]
  );

  const deleteCashflow = useCallback(
    async (cashflowRecord) => {
      await moveToTrash(
        "cashflow_entries",
        cashflowRecord,
        cashflowRecord.description || cashflowRecord.detail || "Arus Kas"
      );
    },
    [moveToTrash]
  );

  const value = useMemo(
    () => ({
      ...data,
      ...stats,
      loading,
      error,
      reload: load,
      addLog,
      saveSettings,
      saveCouple,
      moveToTrash,
      restoreFromTrash,
      permanentDeleteFromTrash,
      emptyTrash,
      toggleRundown,
      addRundownEvent,
      updateRundownEvent,
      deleteRundownEvent,
      checkInGuest,
      undoCheckInGuest,
      addGift,
      updateGift,
      deleteGift,
      // Guests
      addGuest,
      updateGuest,
      deleteGuest,
      batchUpdateGuests,
      batchAddGuests,
      // Vendors
      addVendor,
      updateVendor,
      deleteVendor,
      toggleVendorStatus,
      toggleVendorDp,
      toggleVendorSettlement,
      // Administrations
      addAdministration,
      updateAdministration,
      deleteAdministration,
      toggleAdminDoc,
      toggleAdminProgress,
      // Seserahan
      addSeserahan,
      updateSeserahan,
      deleteSeserahan,
      toggleSeserahanChecklist,
      // Budgets & Cashflow
      addBudget,
      updateBudget,
      deleteBudget,
      addCashflow,
      deleteCashflow,
      isLiveConnected,
      lastLiveUpdate,
    }),
    [
      data,
      stats,
      loading,
      error,
      load,
      addLog,
      saveSettings,
      saveCouple,
      moveToTrash,
      restoreFromTrash,
      permanentDeleteFromTrash,
      emptyTrash,
      toggleRundown,
      addRundownEvent,
      updateRundownEvent,
      deleteRundownEvent,
      checkInGuest,
      undoCheckInGuest,
      addGift,
      updateGift,
      deleteGift,
      addGuest,
      updateGuest,
      deleteGuest,
      batchUpdateGuests,
      batchAddGuests,
      addVendor,
      updateVendor,
      deleteVendor,
      toggleVendorStatus,
      toggleVendorDp,
      toggleVendorSettlement,
      addAdministration,
      updateAdministration,
      deleteAdministration,
      toggleAdminDoc,
      toggleAdminProgress,
      addSeserahan,
      updateSeserahan,
      deleteSeserahan,
      toggleSeserahanChecklist,
      addBudget,
      updateBudget,
      deleteBudget,
      addCashflow,
      deleteCashflow,
      isLiveConnected,
      lastLiveUpdate,
    ]
  );

  return <WeddingContext.Provider value={value}>{children}</WeddingContext.Provider>;
}

/** Semua perhitungan turunan (uang & tamu) terpusat di sini. */
export function computeStats(data) {
  const {
    couple,
    budgets,
    administrations,
    seserahan,
    vendors,
    guests,
    cashflow,
    photos = [],
    settings,
  } = data;

  // ---------------- CASHFLOW (Single-pass O(N)) ----------------
  let income = 0, expense = 0, incomeCpp = 0, incomeCpw = 0, expenseCpp = 0, expenseCpw = 0;
  for (const e of cashflow) {
    const amt = Number(e.amount || 0);
    if (e.kind === "income") {
      income += amt;
      if (e.owner === "CPP") incomeCpp += amt;
      else if (e.owner === "CPW") incomeCpw += amt;
    } else if (e.kind === "expense") {
      expense += amt;
      if (e.owner === "CPP") expenseCpp += amt;
      else if (e.owner === "CPW") expenseCpw += amt;
    }
  }

  const targetBudget = Number(couple?.target_budget || 85_000_000);
  const balance = income - expense;
  const remainingTarget = Math.max(targetBudget - balance, 0);

  // ---------------- BUDGET ----------------
  const budgetTotal = budgets.reduce((s, b) => s + Number(b.total_biaya || 0), 0);
  const budgetPaid = budgets.reduce((s, b) => s + getBudgetPaid(b), 0);
  const budgetOutstanding = Math.max(budgetTotal - budgetPaid, 0);

  // ---------------- ADMINISTRASI (Single-pass) ----------------
  let docsDone = 0, docItemsCount = 0, progressDone = 0, progressItemsCount = 0;
  for (const a of administrations) {
    if (a.is_document) {
      docItemsCount++;
      if (a.cpp_complete && a.cpw_complete) docsDone++;
    } else {
      progressItemsCount++;
      if (a.progress === "Sudah") progressDone++;
    }
  }

  // ---------------- VENDOR / TUGAS ----------------
  const vendorDone = vendors.filter((v) => v.is_completed).length;

  // ---------------- TAMU & CHECK-IN (Single-pass O(N)) ----------------
  let totalPax = 0, paxHadir = 0, paxTidakHadir = 0, paxBelum = 0;
  let hadirCount = 0, tidakHadirCount = 0, belumCount = 0, sentCount = 0;
  let digital = 0, fisik = 0, cppCount = 0, cpwCount = 0;
  let checkedInCount = 0, checkedInPax = 0, souvenirGivenCount = 0;

  for (const g of guests) {
    const p = Number(g.pax || 0);
    totalPax += p;

    if (g.status === "Hadir") {
      hadirCount++;
      paxHadir += p;
    } else if (g.status === "Tidak Hadir") {
      tidakHadirCount++;
      paxTidakHadir += p;
    } else {
      belumCount++;
      paxBelum += p;
    }

    if (g.invitation_sent) sentCount++;
    if (g.type === "Digital") digital++;
    else if (g.type === "Fisik") fisik++;

    if (g.side === "CPP") cppCount++;
    else if (g.side === "CPW") cpwCount++;

    if (g.checked_in) {
      checkedInCount++;
      checkedInPax += Number(g.actual_pax || g.pax || 1);
    }
    if (g.souvenir_given) souvenirGivenCount++;
  }

  const byGroup = countBy(guests, "group_name");
  const byPriority = countBy(guests, "priority");
  const byOrigin = countBy(guests, "origin");

  // ---------------- SESERAHAN ----------------
  const seserahanBudget = seserahan.reduce((s, i) => s + Number(i.budget || 0), 0);
  const seserahanActual = seserahan.reduce((s, i) => s + Number(i.actually_harga || 0), 0);
  const seserahanDone = seserahan.filter((i) => i.checklist).length;

  // ---------------- PREWEDDING & GALERI ----------------
  const preweddingDone =
    Boolean(settings?.prewedding_done) || photos.length > 0;
  const cover = photos.find((p) => p.is_cover) || photos[0] || null;

  // ---------------- RUNDOWN HARI-H ----------------
  const rundowns = data.rundowns || [];
  const rundownDone = rundowns.filter((r) => r.is_completed).length;
  const nextRundown = rundowns.find((r) => !r.is_completed) || null;
  const byPhase = countBy(rundowns, "phase");

  // ---------------- KADO & ANGPAO (Single-pass O(N)) ----------------
  const gifts = data.gifts || [];
  let totalCash = 0, totalTransfer = 0, totalPhysical = 0, totalGold = 0, thankYouPending = 0;
  for (const g of gifts) {
    const amt = Number(g.amount || 0);
    if (g.gift_type === "Amplop Tunai") totalCash += amt;
    else if (g.gift_type === "Transfer Bank / QRIS") totalTransfer += amt;
    else if (g.gift_type === "Kado Fisik") totalPhysical++;
    else if (g.gift_type === "Logam Mulia") totalGold++;

    if (!g.thank_you_sent) thankYouPending++;
  }
  const totalGiftAmount = totalCash + totalTransfer;

  return {
    finance: {
      income,
      expense,
      incomeCpp,
      incomeCpw,
      expenseCpp,
      expenseCpw,
      balance,
      targetBudget,
      remainingTarget,
    },
    budgetSummary: { total: budgetTotal, paid: budgetPaid, outstanding: budgetOutstanding },
    adminSummary: {
      total: administrations.length,
      done: docsDone + progressDone,
      docsTotal: docItemsCount,
      docsDone,
      progressTotal: progressItemsCount,
      progressDone,
    },
    vendorSummary: { total: vendors.length, done: vendorDone, remaining: vendors.length - vendorDone },
    guestSummary: {
      total: guests.length,
      totalPax,
      hadir: hadirCount,
      tidakHadir: tidakHadirCount,
      belum: belumCount,
      sentCount,
      paxHadir,
      paxTidakHadir,
      paxBelum,
      digital,
      fisik,
      cppCount,
      cpwCount,
      byGroup,
      byPriority,
      byOrigin,
      checkedInCount,
      checkedInPax,
      souvenirGivenCount,
      invitationBaseUrl: settings?.invitation_base_url || "",
      waTemplate: settings?.wa_invitation_template || "",
    },
    rundownSummary: {
      total: rundowns.length,
      done: rundownDone,
      remaining: rundowns.length - rundownDone,
      nextRundown,
      byPhase,
    },
    giftSummary: {
      total: gifts.length,
      totalCash,
      totalTransfer,
      totalGiftAmount,
      totalPhysical,
      totalGold,
      thankYouPending,
    },
    seserahanSummary: {
      total: seserahan.length,
      done: seserahanDone,
      budget: seserahanBudget,
      actual: seserahanActual,
    },
    gallerySummary: {
      total: photos.length,
      preweddingDone,
      driveLink: settings?.prewed_drive_link || couple?.prewed_drive_link || "",
      title: settings?.gallery_title || "",
      note: settings?.gallery_note || "",
      showOnDashboard: settings?.show_gallery_on_dashboard ?? true,
      cover,
    },
  };
}


export function countBy(arr, key) {
  const map = new Map();
  for (const item of arr) {
    const k = item[key] || "Lainnya";
    map.set(k, (map.get(k) || 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export { WeddingContext };
