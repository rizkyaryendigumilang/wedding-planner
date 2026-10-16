import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import pb from "./pocketbase";
import { useAuth } from "./auth";
import { toDirectImageUrl, toDriveOpenUrl, guessAltFromUrl } from "./photos";

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

const CACHE_KEY = "wedding_planner_cache_v2";

function loadCachedData() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.couple) {
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
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        couple: freshData.couple,
        budgets: freshData.budgets,
        administrations: freshData.administrations,
        seserahan: freshData.seserahan,
        vendors: freshData.vendors,
        guests: freshData.guests,
        cashflow: freshData.cashflow,
        logs: (freshData.logs || []).slice(0, 30),
        settings: freshData.settings,
        photos: freshData.photos,
        trashItems: freshData.trashItems || [],
        rundowns: freshData.rundowns || [],
        gifts: freshData.gifts || [],
        cachedAt: Date.now(),
      })
    );
  } catch (err) {
    console.warn("Gagal menyimpan cache lokal:", err);
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
    // SWR Instant launch: gunakan cache lokal jika tersedia
    const cached = loadCachedData();
    return cached || EMPTY;
  });
  // Jika cache lokal sudah ada, jangan kunci layar dengan spinner (0ms render!)
  const [loading, setLoading] = useState(() => !loadCachedData());
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
    const hasLocalData = Boolean(loadCachedData()?.couple?.id);
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
      if (!couple) {
        const couples = await pb.collection("couples").getFullList({ sort: "-created" });
        couple = couples[0] || null;
      }
      const coupleId = couple?.id;

      if (!coupleId) {
        setData(EMPTY);
        return;
      }

      const [
        budgets,
        administrations,
        seserahan,
        vendors,
        guests,
        cashflow,
        logs,
        photosRaw,
        settings,
        trashItems,
        rundowns,
        gifts,
      ] = await Promise.all([
        pb.collection("budgets").getFullList({ filter: `couple="${coupleId}"`, sort: "budget_type,category" }),
        pb.collection("administrations").getFullList({ filter: `couple="${coupleId}"`, sort: "sort_order" }),
        pb.collection("seserahan_items").getFullList({ filter: `couple="${coupleId}"`, sort: "category" }),
        pb.collection("vendor_checklists").getFullList({ filter: `couple="${coupleId}"`, sort: "sort_order" }),
        pb.collection("wedding_guests").getFullList({ filter: `couple="${coupleId}"`, sort: "name" }),
        pb.collection("cashflow_entries").getFullList({ filter: `couple="${coupleId}"`, sort: "sort_order" }),
        pb.collection("activity_logs").getFullList({ filter: `couple="${coupleId}"`, sort: "-created" }),
        // Koleksi tambahan: boleh kosong, jangan sampai menggagalkan seluruh muatan.
        pb
          .collection("gallery_photos")
          .getFullList({ filter: `couple="${coupleId}"`, sort: "sort_order,-created" })
          .catch(() => []),
        pb
          .collection("app_settings")
          .getFirstListItem(`owner_key="default"`)
          .catch(() => null),
        pb
          .collection("recycle_bin")
          .getFullList({ sort: "-created" })
          .catch(() => []),
        pb
          .collection("rundown_events")
          .getFullList({ filter: `couple="${coupleId}"`, sort: "time_start,sort_order" })
          .catch(() => []),
        pb
          .collection("wedding_gifts")
          .getFullList({ filter: `couple="${coupleId}"`, sort: "-created" })
          .catch(() => []),
      ]);

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
        settings,
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
        load();
        setLastLiveUpdate(Date.now());
      }, 300);
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
        .subscribe("*", () => {
          triggerReload();
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
        const existing = await pb
          .collection("app_settings")
          .getFirstListItem('owner_key="default"');
        const updated = await pb.collection("app_settings").update(existing.id, payload);
        await load();
        return updated;
      } catch (err) {
        // Hanya "belum ada baris pengaturan" (404) yang boleh berujung pada
        // pembuatan baris baru. Kesalahan lain (mis. jaringan) diteruskan agar
        // tidak menghasilkan baris ganda.
        if (err?.status !== 404) throw err;
        const created = await pb.collection("app_settings").create(payload);
        await load();
        return created;
      }
    },
    [coupleId, load]
  );

  const addLog = useCallback(
    async (description, actionType = "info", amount = 0) => {
      if (!coupleId) return;
      try {
        await pb.collection("activity_logs").create({
          couple: coupleId,
          action_description: description,
          action_type: actionType,
          amount,
        });
        await load();
      } catch (err) {
        console.error("Gagal menambah log:", err);
      }
    },
    [coupleId, load]
  );

  const saveCouple = useCallback(
    async (patch) => {
      if (!coupleId) return null;
      const updated = await pb.collection("couples").update(coupleId, patch);
      await load();
      return updated;
    },
    [coupleId, load]
  );

  /**
   * Pindahkan item ke Tempat Sampah (Soft Delete).
   * Data dipindahkan dari koleksi asal ke `recycle_bin` agar bisa dipulihkan kapan saja.
   */
  const moveToTrash = useCallback(
    async (collectionName, item, itemTitle) => {
      if (!item || !item.id) return;
      const title =
        itemTitle ||
        item.name ||
        item.detail ||
        item.activity_name ||
        item.description ||
        "Item";
      const userIdentifier =
        pb.authStore.model?.username ||
        pb.authStore.model?.name ||
        pb.authStore.model?.email ||
        "Pengguna";

      // 1. Simpan salinan ke recycle_bin
      await pb.collection("recycle_bin").create({
        collection_name: collectionName,
        item_title: title,
        item_data: item,
        deleted_by: userIdentifier,
      });

      // 2. Hapus dari koleksi asli
      await pb.collection(collectionName).delete(item.id);

      // 3. Catat di riwayat aktivitas
      await addLog(`"${title}" dipindahkan ke Tempat Sampah`, "delete");

      // 4. Muat ulang data
      await load(true);
    },
    [addLog, load]
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
   */
  const emptyTrash = useCallback(async () => {
    const items = data.trashItems || [];
    if (items.length === 0) return;
    for (const it of items) {
      await pb.collection("recycle_bin").delete(it.id).catch(() => {});
    }
    await addLog(`Mengosongkan Tempat Sampah (${items.length} item dihapus permanen)`, "delete");
    await load(true);
  }, [data.trashItems, addLog, load]);

  const toggleRundown = useCallback(
    async (eventId, isCompleted) => {
      await pb.collection("rundown_events").update(eventId, { is_completed: isCompleted });
      await load(true);
    },
    [load]
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
      await moveToTrash("rundown_events", eventRecord.title || "Agenda Rundown", eventRecord);
    },
    [moveToTrash]
  );

  const checkInGuest = useCallback(
    async (guestId, options = {}) => {
      const payload = {
        checked_in: true,
        checked_in_at: new Date().toISOString(),
        status: "Hadir",
      };
      if (options.actual_pax !== undefined) payload.actual_pax = options.actual_pax;
      if (options.souvenir_given !== undefined) payload.souvenir_given = options.souvenir_given;
      const updated = await pb.collection("wedding_guests").update(guestId, payload);
      await addLog(`Check-in tamu resepsi: "${options.guestName || "Tamu"}"`, "guest");
      await load(true);
      return updated;
    },
    [addLog, load]
  );

  const undoCheckInGuest = useCallback(
    async (guestId) => {
      await pb.collection("wedding_guests").update(guestId, {
        checked_in: false,
        checked_in_at: "",
        souvenir_given: false,
      });
      await load(true);
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
      await moveToTrash("wedding_gifts", `Hadiah dari ${giftRecord.guest_name}`, giftRecord);
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
      isLiveConnected,
      lastLiveUpdate,
    ]
  );

  return <WeddingContext.Provider value={value}>{children}</WeddingContext.Provider>;
}

/** Semua perhitungan turunan (uang & tamu) terpusat di sini. */
function computeStats(data) {
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

  // ---------------- CASHFLOW ----------------
  const income = cashflow
    .filter((e) => e.kind === "income")
    .reduce((s, e) => s + Number(e.amount || 0), 0);
  const expense = cashflow
    .filter((e) => e.kind === "expense")
    .reduce((s, e) => s + Number(e.amount || 0), 0);
  const incomeCpp = cashflow
    .filter((e) => e.kind === "income" && e.owner === "CPP")
    .reduce((s, e) => s + Number(e.amount || 0), 0);
  const incomeCpw = cashflow
    .filter((e) => e.kind === "income" && e.owner === "CPW")
    .reduce((s, e) => s + Number(e.amount || 0), 0);
  const expenseCpp = cashflow
    .filter((e) => e.kind === "expense" && e.owner === "CPP")
    .reduce((s, e) => s + Number(e.amount || 0), 0);
  const expenseCpw = cashflow
    .filter((e) => e.kind === "expense" && e.owner === "CPW")
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const targetBudget = Number(couple?.target_budget || 85_000_000);
  const balance = income - expense;
  const remainingTarget = Math.max(targetBudget - balance, 0);

  // ---------------- BUDGET ----------------
  const paid = (b) =>
    Number(b.termin1 || 0) + Number(b.termin2 || 0) + Number(b.termin3 || 0) + Number(b.termin4 || 0);
  const budgetTotal = budgets.reduce((s, b) => s + Number(b.total_biaya || 0), 0);
  const budgetPaid = budgets.reduce((s, b) => s + paid(b), 0);
  const budgetOutstanding = Math.max(budgetTotal - budgetPaid, 0);

  // ---------------- ADMINISTRASI ----------------
  const docItems = administrations.filter((a) => a.is_document);
  const docsDone = docItems.filter((a) => a.cpp_complete && a.cpw_complete).length;
  const progressItems = administrations.filter((a) => !a.is_document);
  const progressDone = progressItems.filter((a) => a.progress === "Sudah").length;

  // ---------------- VENDOR / TUGAS ----------------
  const vendorDone = vendors.filter((v) => v.is_completed).length;

  // ---------------- TAMU ----------------
  const totalPax = guests.reduce((s, g) => s + Number(g.pax || 0), 0);
  const hadir = guests.filter((g) => g.status === "Hadir");
  const tidakHadir = guests.filter((g) => g.status === "Tidak Hadir");
  const belum = guests.filter((g) => !g.status || g.status === "Belum" || g.status === "Tanpa Keterangan");
  const sent = guests.filter((g) => g.invitation_sent);
  const paxHadir = hadir.reduce((s, g) => s + Number(g.pax || 0), 0);
  const paxTidakHadir = tidakHadir.reduce((s, g) => s + Number(g.pax || 0), 0);
  const paxBelum = belum.reduce((s, g) => s + Number(g.pax || 0), 0);
  const digital = guests.filter((g) => g.type === "Digital").length;
  const fisik = guests.filter((g) => g.type === "Fisik").length;
  const cppCount = guests.filter((g) => g.side === "CPP").length;
  const cpwCount = guests.filter((g) => g.side === "CPW").length;

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

  // ---------------- KADO & ANGPAO ----------------
  const gifts = data.gifts || [];
  const cashGifts = gifts.filter((g) => g.gift_type === "Amplop Tunai");
  const transferGifts = gifts.filter((g) => g.gift_type === "Transfer Bank / QRIS");
  const physicalGifts = gifts.filter((g) => g.gift_type === "Kado Fisik");
  const goldGifts = gifts.filter((g) => g.gift_type === "Logam Mulia");
  const totalCash = cashGifts.reduce((s, g) => s + Number(g.amount || 0), 0);
  const totalTransfer = transferGifts.reduce((s, g) => s + Number(g.amount || 0), 0);
  const totalGiftAmount = totalCash + totalTransfer;
  const thankYouPending = gifts.filter((g) => !g.thank_you_sent).length;

  // ---------------- RECEPTION CHECK-IN ----------------
  const checkedInGuests = guests.filter((g) => g.checked_in);
  const checkedInPax = checkedInGuests.reduce(
    (s, g) => s + Number(g.actual_pax || g.pax || 1),
    0
  );
  const souvenirGivenCount = guests.filter((g) => g.souvenir_given).length;

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
      docsTotal: docItems.length,
      docsDone,
      progressTotal: progressItems.length,
      progressDone,
    },
    vendorSummary: { total: vendors.length, done: vendorDone, remaining: vendors.length - vendorDone },
    guestSummary: {
      total: guests.length,
      totalPax,
      hadir: hadir.length,
      tidakHadir: tidakHadir.length,
      belum: belum.length,
      sentCount: sent.length,
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
      checkedInCount: checkedInGuests.length,
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
      totalPhysical: physicalGifts.length,
      totalGold: goldGifts.length,
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


function countBy(arr, key) {
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
