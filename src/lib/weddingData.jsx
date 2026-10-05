import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import pb from "./pocketbase";
import { useAuth } from "./auth";

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
};

/** Beri tahu PocketBase bahwa koleksi berubah -> semua modul refresh. */
export function useWedding() {
  const ctx = useContext(WeddingContext);
  if (!ctx) throw new Error("useWedding harus dipakai di dalam <WeddingProvider>");
  return ctx;
}

export function WeddingProvider({ children }) {
  const { isAuthed, ready: authReady } = useAuth();
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    // Koleksi data butuh login; jangan memanggil API saat belum masuk.
    if (!pb.authStore.isValid) {
      setData(EMPTY);
      setError("");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const couples = await pb.collection("couples").getFullList({ sort: "-created" });
      const couple = couples[0] || null;
      const coupleId = couple?.id;

      if (!coupleId) {
        setData(EMPTY);
        return;
      }

      const [budgets, administrations, seserahan, vendors, guests, cashflow, logs] =
        await Promise.all([
          pb.collection("budgets").getFullList({ filter: `couple="${coupleId}"`, sort: "budget_type,category" }),
          pb.collection("administrations").getFullList({ filter: `couple="${coupleId}"`, sort: "sort_order" }),
          pb.collection("seserahan_items").getFullList({ filter: `couple="${coupleId}"`, sort: "category" }),
          pb.collection("vendor_checklists").getFullList({ filter: `couple="${coupleId}"`, sort: "sort_order" }),
          pb.collection("wedding_guests").getFullList({ filter: `couple="${coupleId}"`, sort: "name" }),
          pb.collection("cashflow_entries").getFullList({ filter: `couple="${coupleId}"`, sort: "sort_order" }),
          pb.collection("activity_logs").getFullList({ filter: `couple="${coupleId}"`, sort: "-created" }),
        ]);

      setData({ couple, budgets, administrations, seserahan, vendors, guests, cashflow, logs });
    } catch (err) {
      console.error("Gagal memuat data:", err);
      setError(err?.message || "Gagal memuat data dari PocketBase");
    } finally {
      setLoading(false);
    }
  }, []);

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

  // ------------------------------------------------------------------ derived
  const stats = useMemo(() => computeStats(data), [data]);

  const coupleId = data.couple?.id;

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

  const value = useMemo(
    () => ({ ...data, ...stats, loading, error, reload: load, addLog }),
    [data, stats, loading, error, load, addLog]
  );

  return <WeddingContext.Provider value={value}>{children}</WeddingContext.Provider>;
}

/** Semua perhitungan turunan (uang & tamu) terpusat di sini. */
function computeStats(data) {
  const { couple, budgets, administrations, seserahan, vendors, guests, cashflow } = data;

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
  const paxHadir = hadir.reduce((s, g) => s + Number(g.pax || 0), 0);
  const paxTidakHadir = tidakHadir.reduce((s, g) => s + Number(g.pax || 0), 0);
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
      paxHadir,
      paxTidakHadir,
      digital,
      fisik,
      cppCount,
      cpwCount,
      byGroup,
      byPriority,
      byOrigin,
    },
    seserahanSummary: {
      total: seserahan.length,
      done: seserahanDone,
      budget: seserahanBudget,
      actual: seserahanActual,
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
