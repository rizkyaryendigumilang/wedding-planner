import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  UserCheck,
  Search,
  Users,
  CheckCircle2,
  Clock,
  Gift,
  Plus,
  X,
  TableProperties,
} from "lucide-react";
import {
  Page,
  PageHeader,
  Card,
  StatCard,
  Badge,
  Button,
  EmptyState,
} from "../components/ui";
import { useWedding } from "../lib/weddingData";
import pb from "../lib/pocketbase";

const EASE = [0.22, 1, 0.36, 1];

export default function Reception() {
  const reduce = useReducedMotion();
  const {
    guests = [],
    guestSummary = {},
    checkInGuest,
    undoCheckInGuest,
    reload,
  } = useWedding();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'checked-in', 'pending'
  const [sideFilter, setSideFilter] = useState("ALL"); // 'ALL', 'CPP', 'CPW'
  const [walkInModal, setWalkInModal] = useState(false);
  const [walkInForm, setWalkInForm] = useState({
    name: "",
    side: "CPP",
    pax: 1,
    origin: "",
    group_name: "Walk-in",
    table_number: "",
    souvenir_given: true,
  });
  const [walkInBusy, setWalkInBusy] = useState(false);
  const [recentlyCheckedInId, setRecentlyCheckedInId] = useState(null);

  const searchInputRef = useRef(null);

  // Debounce search query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 120);
    return () => clearTimeout(t);
  }, [query]);

  const filteredGuests = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return guests.filter((g) => {
      if (statusFilter === "checked-in" && !g.checked_in) return false;
      if (statusFilter === "pending" && g.checked_in) return false;
      if (sideFilter !== "ALL" && g.side !== sideFilter) return false;
      if (q) {
        const text = `${g.name} ${g.origin || ""} ${g.group_name || ""} ${g.table_number || ""} ${g.phone || ""}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [guests, statusFilter, sideFilter, debouncedQuery]);

  const handleCheckIn = useCallback(
    async (guest, actualPax = null, souvenirGiven = true) => {
      const pax = actualPax !== null ? actualPax : Number(guest.pax || 1);
      try {
        await checkInGuest(guest.id, {
          guestName: guest.name,
          actual_pax: pax,
          souvenir_given: souvenirGiven,
        });
        setRecentlyCheckedInId(guest.id);
        setTimeout(() => setRecentlyCheckedInId(null), 3000);
      } catch (err) {
        alert("Gagal melakukan check-in: " + (err?.message || ""));
      }
    },
    [checkInGuest]
  );

  const handleUndo = useCallback(
    async (guest) => {
      try {
        await undoCheckInGuest(guest.id);
      } catch (err) {
        alert("Gagal membatalkan check-in: " + (err?.message || ""));
      }
    },
    [undoCheckInGuest]
  );

  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    if (!walkInForm.name.trim()) return;

    setWalkInBusy(true);
    try {
      const coupleId = guests[0]?.couple;
      await pb.collection("wedding_guests").create({
        couple: coupleId,
        name: walkInForm.name.trim(),
        side: walkInForm.side,
        pax: Number(walkInForm.pax || 1),
        actual_pax: Number(walkInForm.pax || 1),
        origin: walkInForm.origin.trim(),
        group_name: walkInForm.group_name.trim() || "Walk-in",
        table_number: walkInForm.table_number.trim(),
        status: "Hadir",
        checked_in: true,
        checked_in_at: new Date().toISOString(),
        souvenir_given: walkInForm.souvenir_given,
        type: "Fisik",
        priority: "C - If Capacity Allows",
      });
      await reload();
      setWalkInModal(false);
      setWalkInForm({
        name: "",
        side: "CPP",
        pax: 1,
        origin: "",
        group_name: "Walk-in",
        table_number: "",
        souvenir_given: true,
      });
    } catch (err) {
      alert("Gagal menambahkan tamu: " + (err?.message || ""));
    } finally {
      setWalkInBusy(false);
    }
  };

  const checkedInCount = guestSummary.checkedInCount || 0;
  const checkedInPax = guestSummary.checkedInPax || 0;
  const totalGuests = guestSummary.total || 0;
  const pendingCount = Math.max(totalGuests - checkedInCount, 0);
  const souvenirCount = guestSummary.souvenirGivenCount || 0;

  return (
    <Page>
      <PageHeader
        title="Meja Penerima Tamu"
        subtitle="Pencatatan kehadiran langsung di lokasi resepsi secara cepat dan real-time."
        action={
          <Button icon={Plus} onClick={() => setWalkInModal(true)}>
            Tamu Walk-in (Tanpa Undangan)
          </Button>
        }
      />

      {/* Counter Ringkasan Meja Resepsi */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <StatCard
          label="Tamu Hadir di Lokasi"
          value={checkedInCount}
          sublabel={`${checkedInPax} total porsi (pax)`}
          icon={UserCheck}
          tone="sage"
        />
        <StatCard
          label="Souvenir Diberikan"
          value={souvenirCount}
          sublabel="Paket souvenir tersalur"
          icon={Gift}
          tone="plum"
        />
        <StatCard
          label="Belum Hadir"
          value={pendingCount}
          sublabel="Dari total undangan"
          icon={Clock}
          tone="amber"
        />
        <StatCard
          label="Total Terdaftar"
          value={totalGuests}
          sublabel="Buku tamu keseluruhan"
          icon={Users}
          tone="stone"
        />
      </div>

      {/* Kotak Pencarian Cepat & Filter */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              ref={searchInputRef}
              type="text"
              autoFocus
              placeholder="Ketik nama tamu, keluarga, nomor meja, atau kota asal…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-canvas-sunken dark:bg-night-sunken border border-line dark:border-night-line text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 text-ink dark:text-stone-100 placeholder:text-ink-faint"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-ink-faint hover:text-ink"
                aria-label="Bersihkan pencarian"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {/* Filter Status */}
            <div className="flex items-center bg-canvas-sunken dark:bg-night-sunken p-1 rounded-2xl border border-line dark:border-night-line text-xs shrink-0">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-xl font-medium transition active:scale-[0.97] ${
                  statusFilter === "all" ? "bg-canvas-card dark:bg-night-card shadow-soft text-ink dark:text-stone-100" : "text-ink-muted"
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-3 py-1.5 rounded-xl font-medium transition active:scale-[0.97] ${
                  statusFilter === "pending" ? "bg-amber-500 text-white shadow-soft" : "text-ink-muted"
                }`}
              >
                Belum ({pendingCount})
              </button>
              <button
                onClick={() => setStatusFilter("checked-in")}
                className={`px-3 py-1.5 rounded-xl font-medium transition active:scale-[0.97] ${
                  statusFilter === "checked-in" ? "bg-emerald-600 text-white shadow-soft" : "text-ink-muted"
                }`}
              >
                Sudah ({checkedInCount})
              </button>
            </div>

            {/* Filter Pihak */}
            <div className="flex items-center bg-canvas-sunken dark:bg-night-sunken p-1 rounded-2xl border border-line dark:border-night-line text-xs shrink-0">
              <button
                onClick={() => setSideFilter("ALL")}
                className={`px-2.5 py-1.5 rounded-xl font-medium transition active:scale-[0.97] ${
                  sideFilter === "ALL" ? "bg-canvas-card dark:bg-night-card shadow-soft text-ink dark:text-stone-100" : "text-ink-muted"
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setSideFilter("CPP")}
                className={`px-2.5 py-1.5 rounded-xl font-medium transition active:scale-[0.97] ${
                  sideFilter === "CPP" ? "bg-rose-600 text-white shadow-soft" : "text-ink-muted"
                }`}
              >
                CPP
              </button>
              <button
                onClick={() => setSideFilter("CPW")}
                className={`px-2.5 py-1.5 rounded-xl font-medium transition active:scale-[0.97] ${
                  sideFilter === "CPW" ? "bg-rose-600 text-white shadow-soft" : "text-ink-muted"
                }`}
              >
                CPW
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Daftar Tamu untuk Check-in Cepat */}
      {filteredGuests.length === 0 ? (
        <Card className="text-center py-12">
          <EmptyState
            icon={Search}
            title="Tamu tidak ditemukan"
            description={
              query
                ? `Tidak ada tamu dengan kata kunci "${query}". Ingin menambahkan sebagai tamu walk-in?`
                : "Belum ada daftar tamu yang cocok dengan filter saat ini."
            }
            action={
              query && (
                <Button
                  icon={Plus}
                  onClick={() => {
                    setWalkInForm((prev) => ({ ...prev, name: query }));
                    setWalkInModal(true);
                  }}
                >
                  Tambah "{query}" ke Buku Tamu
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredGuests.map((guest, index) => {
            const isCheckedIn = Boolean(guest.checked_in);
            const isJustChecked = recentlyCheckedInId === guest.id;

            return (
              <motion.div
                key={guest.id}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: Math.min(index * 0.015, 0.2), ease: EASE }}
              >
                <Card
                  className={`p-4 transition-all duration-200 border ${
                    isJustChecked
                      ? "ring-2 ring-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15"
                      : isCheckedIn
                      ? "bg-canvas-sunken/40 dark:bg-night-sunken/40 border-emerald-500/30"
                      : "hover:border-rose-500/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge tone={guest.side === "CPP" ? "rose" : "plum"}>
                          {guest.side}
                        </Badge>
                        {guest.table_number && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-canvas-sunken dark:bg-night-sunken text-ink dark:text-stone-200 border border-line dark:border-night-line">
                            <TableProperties size={11} /> Meja {guest.table_number}
                          </span>
                        )}
                        <span className="text-[11px] text-ink-faint">
                          {guest.pax || 1} Pax
                        </span>
                      </div>

                      <h3 className="font-display font-semibold text-sm text-ink dark:text-stone-50 truncate">
                        {guest.name}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-muted mt-1">
                        {guest.group_name && <span>{guest.group_name}</span>}
                        {guest.origin && (
                          <>
                            <span className="text-ink-faint">•</span>
                            <span>{guest.origin}</span>
                          </>
                        )}
                      </div>

                      {/* Detail Check-in jika sudah hadir */}
                      {isCheckedIn && (
                        <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-line/60 dark:border-night-line/60 text-[11px]">
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 size={12} /> Hadir ({guest.actual_pax || guest.pax || 1} pax)
                          </span>
                          {guest.souvenir_given && (
                            <span className="inline-flex items-center gap-1 text-plum-600 dark:text-plum-400">
                              <Gift size={11} /> Souvenir diberikan
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleUndo(guest)}
                            className="ml-auto text-ink-faint hover:text-rose-600 transition underline underline-offset-2"
                          >
                            Batal Check-in
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Tombol Check-in 1-Klik */}
                    {!isCheckedIn ? (
                      <button
                        type="button"
                        onClick={() => handleCheckIn(guest)}
                        className="flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold text-xs shadow-glow active:scale-[0.96] transition shrink-0"
                      >
                        <UserCheck size={18} />
                        <span>Check-in</span>
                      </button>
                    ) : (
                      <div className="shrink-0 p-2 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={24} />
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal Tambah Tamu Walk-In */}
      <AnimatePresence>
        {walkInModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setWalkInModal(false)}
              className="absolute inset-0 bg-ink/60 dark:bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="relative w-full max-w-md rounded-3xl bg-canvas-card dark:bg-night-card border border-line dark:border-night-line p-6 shadow-lift z-10"
            >
              <button
                onClick={() => setWalkInModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-ink-muted hover:bg-canvas-sunken dark:hover:bg-night-sunken transition"
                aria-label="Tutup"
              >
                <X size={16} />
              </button>

              <h3 className="font-display font-semibold text-base mb-1">
                Tambah Tamu Walk-in
              </h3>
              <p className="text-xs text-ink-faint mb-5">
                Mencatat tamu mendadak yang hadir langsung di lokasi tanpa konfirmasi sebelumnya.
              </p>

              <form onSubmit={handleWalkInSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-1">
                    Nama Lengkap Tamu *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Contoh: Bpk. H. Sukardi &amp; Istri"
                    value={walkInForm.name}
                    onChange={(e) => setWalkInForm({ ...walkInForm, name: e.target.value })}
                    className="field"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-1">
                      Pihak Pengantin
                    </label>
                    <select
                      value={walkInForm.side}
                      onChange={(e) => setWalkInForm({ ...walkInForm, side: e.target.value })}
                      className="field"
                    >
                      <option value="CPP">CPP (Rizky)</option>
                      <option value="CPW">CPW (Reina)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-1">
                      Jumlah Pax Hadir
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={walkInForm.pax}
                      onChange={(e) => setWalkInForm({ ...walkInForm, pax: Number(e.target.value) })}
                      className="field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-1">
                      Nomor Meja (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 05"
                      value={walkInForm.table_number}
                      onChange={(e) => setWalkInForm({ ...walkInForm, table_number: e.target.value })}
                      className="field"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-1">
                      Kota / Asal
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Bandung"
                      value={walkInForm.origin}
                      onChange={(e) => setWalkInForm({ ...walkInForm, origin: e.target.value })}
                      className="field"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-2xl bg-canvas-sunken dark:bg-night-sunken border border-line dark:border-night-line">
                  <input
                    type="checkbox"
                    id="walkInSouvenir"
                    checked={walkInForm.souvenir_given}
                    onChange={(e) => setWalkInForm({ ...walkInForm, souvenir_given: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <label htmlFor="walkInSouvenir" className="text-xs font-medium cursor-pointer">
                    Berikan souvenir kepada tamu sekarang
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line dark:border-night-line">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setWalkInModal(false)}
                    disabled={walkInBusy}
                  >
                    Batal
                  </Button>
                  <Button type="submit" variant="primary" disabled={walkInBusy}>
                    {walkInBusy ? "Menyimpan…" : "Simpan & Check-in Hadir"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Page>
  );
}
