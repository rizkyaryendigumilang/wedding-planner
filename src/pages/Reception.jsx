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
  Download,
  Share2,
  Maximize2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";
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
import { getCppNickname, getCpwNickname } from "../lib/couple";
import { getCrewKioskUrl, generateCrewWhatsAppShareMessage } from "../lib/kiosk";
import pb from "../lib/pocketbase";
import { exportToCsv } from "../lib/export";
import { triggerHaptic } from "../lib/haptic";
import { toast } from "sonner";
import { modalBackdropVariants, modalDialogVariants } from "../lib/motion";
import { useModalA11y } from "../lib/useModalA11y";

const EASE = [0.22, 1, 0.36, 1];

export default function Reception() {
  const reduce = useReducedMotion();
  const {
    couple,
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
  const [crewModal, setCrewModal] = useState(false);

  // Aksesibilitas modal walk-in & crew link (Body Scroll Lock & Escape untuk menutup)
  useModalA11y(walkInModal, () => setWalkInModal(false));
  useModalA11y(crewModal, () => setCrewModal(false));

  const kioskUrl = useMemo(() => {
    return getCrewKioskUrl(couple?.id || guests[0]?.couple);
  }, [couple, guests]);

  const coupleName = useMemo(() => {
    return `${getCppNickname(couple)} & ${getCpwNickname(couple)}`;
  }, [couple]);
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

  // Progressive rendering (40 tamu per batch) agar DOM tetap ringan dan cepat di HP saat hari-H
  const PAGE_SIZE = 40;
  const filterKey = `${statusFilter}|${sideFilter}|${debouncedQuery}`;
  const [pageState, setPageState] = useState({ key: filterKey, count: PAGE_SIZE });
  const visibleCount = pageState.key === filterKey ? pageState.count : PAGE_SIZE;

  const displayedGuests = useMemo(() => {
    return filteredGuests.slice(0, visibleCount);
  }, [filteredGuests, visibleCount]);

  const handleUndo = useCallback(
    async (guest) => {
      try {
        await undoCheckInGuest(guest.id);
        toast.info(`Check-in ${guest.name} dibatalkan`);
      } catch (err) {
        toast.error("Gagal membatalkan check-in: " + (err?.message || ""));
      }
    },
    [undoCheckInGuest]
  );

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
        triggerHaptic("success");
        toast.success(`Check-in berhasil: ${guest.name} (${pax} pax)`, {
          action: {
            label: "Batalkan",
            onClick: () => handleUndo(guest),
          },
          duration: 5000,
        });
      } catch (err) {
        toast.error("Gagal melakukan check-in: " + (err?.message || ""));
      }
    },
    [checkInGuest, handleUndo]
  );

  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    if (!walkInForm.name.trim()) return;

    setWalkInBusy(true);
    try {
      const coupleId = couple?.id || guests[0]?.couple;
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
      triggerHaptic("success");
      toast.success(`Tamu walk-in "${walkInForm.name.trim()}" berhasil ditambahkan & check-in!`);
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
      toast.error("Gagal menambahkan tamu: " + (err?.message || ""));
    } finally {
      setWalkInBusy(false);
    }
  };

  const checkedInCount = guestSummary.checkedInCount || 0;
  const checkedInPax = guestSummary.checkedInPax || 0;
  const totalGuests = guestSummary.total || 0;
  const pendingCount = Math.max(totalGuests - checkedInCount, 0);
  const souvenirCount = guestSummary.souvenirGivenCount || 0;

  const handleExportCsv = () => {
    if (guests.length === 0) return;
    const data = guests.map((g, idx) => ({
      No: idx + 1,
      "Nama Tamu": g.name,
      Pihak: g.side || "-",
      "Nomor Meja": g.table_number || "-",
      "Grup / Kategori": g.group_name || "-",
      "Kota Asal": g.origin || "-",
      "Status Kehadiran": g.checked_in ? "Hadir" : "Belum Hadir",
      "Jumlah Pax Riil": g.checked_in ? (g.actual_pax || g.pax || 1) : 0,
      "Estimasi Pax Undangan": g.pax || 1,
      "Souvenir Diberikan": g.souvenir_given ? "Sudah" : "Belum",
      "Nomor Telepon": g.phone || "-",
      Catatan: g.notes || "-",
    }));
    exportToCsv("rekap-kehadiran-buku-tamu.csv", data);
  };

  return (
    <Page>
      <PageHeader
        title="Meja Penerima Tamu"
        subtitle="Pencatatan kehadiran langsung di lokasi resepsi secara cepat dan real-time."
        action={
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
            {guests.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                icon={Download}
                onClick={handleExportCsv}
                className="hidden md:inline-flex"
              >
                Rekap CSV
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              icon={Share2}
              onClick={() => setCrewModal(true)}
              title="Bagikan Tautan Meja Resepsi untuk Panitia Tanpa Login"
            >
              Tautan Kru
            </Button>
            <Link to="/kiosk">
              <Button
                variant="neutral"
                size="sm"
                icon={Maximize2}
                title="Buka Mode Kios Layar Penuh untuk Meja Resepsi"
              >
                Mode Kios
              </Button>
            </Link>
            <Button size="sm" icon={Plus} onClick={() => setWalkInModal(true)}>
              Tamu Walk-in
            </Button>
          </div>
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
          {displayedGuests.map((guest, index) => {
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
                  className={`p-4 transition-[border-color,background-color,box-shadow] duration-150 border ${
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
                        className="flex flex-col items-center justify-center gap-1 px-4 py-3 min-w-[76px] min-h-[52px] rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold text-xs shadow-glow active:scale-[0.96] transition shrink-0 touch-manipulation select-none"
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

          {filteredGuests.length > visibleCount && (
            <div className="col-span-full pt-4 pb-2 flex flex-col items-center gap-2">
              <p className="text-xs text-ink-muted">
                Menampilkan {displayedGuests.length} dari {filteredGuests.length} tamu
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageState({ key: filterKey, count: visibleCount + PAGE_SIZE })}
              >
                Muat 40 Tamu Berikutnya
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modal Tambah Tamu Walk-In */}
      <AnimatePresence>
        {walkInModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              variants={modalBackdropVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={() => setWalkInModal(false)}
              className="absolute inset-0 bg-ink/50 dark:bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              variants={modalDialogVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="relative w-full max-w-md rounded-3xl bg-canvas-card dark:bg-night-card border border-line dark:border-night-line p-6 shadow-lift z-10 glass-specular"
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
                  <label className="block text-[13px] font-medium text-ink-muted dark:text-stone-300 mb-1">
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
                    <label className="block text-[13px] font-medium text-ink-muted dark:text-stone-300 mb-1">
                      Pihak Pengantin
                    </label>
                    <select
                      value={walkInForm.side}
                      onChange={(e) => setWalkInForm({ ...walkInForm, side: e.target.value })}
                      className="field"
                    >
                      <option value="CPP">CPP ({getCppNickname(couple)})</option>
                      <option value="CPW">CPW ({getCpwNickname(couple)})</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-ink-muted dark:text-stone-300 mb-1">
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
                    <label className="block text-[13px] font-medium text-ink-muted dark:text-stone-300 mb-1">
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
                    <label className="block text-[13px] font-medium text-ink-muted dark:text-stone-300 mb-1">
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

      {/* Modal Tautan Kru Meja Resepsi (Tanpa Login) */}
      <AnimatePresence>
        {crewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              variants={modalBackdropVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="absolute inset-0 bg-ink/50 dark:bg-black/70 backdrop-blur-sm"
              onClick={() => setCrewModal(false)}
            />
            <motion.div
              variants={modalDialogVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="relative w-full max-w-lg bg-canvas-card dark:bg-night-card rounded-3xl border border-line dark:border-night-line shadow-lift p-6 space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-line dark:border-night-line">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <Share2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg text-ink dark:text-stone-50">
                      Tautan Kru Meja Resepsi
                    </h3>
                    <p className="text-xs text-ink-muted">Akses instan panitia tanpa perlu login akun atau password</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCrewModal(false)}
                  className="p-1.5 rounded-xl text-ink-faint hover:text-ink transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-canvas-sunken/70 dark:bg-night-sunken/70 border border-line/60 dark:border-night-line/60 text-xs text-ink-muted space-y-2 leading-relaxed">
                <p>
                  🛡️ <strong>Keamanan Data Terjamin:</strong> Tautan ini hanya dapat membuka halaman pencarian dan check-in kehadiran tamu. Panitia <em>tidak dapat melihat data anggaran keuangan, vendor, atau pengaturan sensitif lainnya</em>.
                </p>
                <p>
                  📱 <strong>Siap Digunakan di Tablet &amp; HP:</strong> Panitia cukup mengklik tautan di WhatsApp untuk langsung membuka mode kios resepsi.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-faint">
                  URL Meja Resepsi Kru
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={kioskUrl}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-line dark:border-night-line bg-canvas dark:bg-night font-mono text-xs text-ink dark:text-stone-300 outline-none select-all"
                  />
                  <Button
                    variant="neutral"
                    size="sm"
                    icon={Copy}
                    onClick={() => {
                      navigator.clipboard.writeText(kioskUrl);
                      triggerHaptic("success");
                      toast.success("Tautan kru berhasil disalin ke papan klip!");
                    }}
                  >
                    Salin
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    generateCrewWhatsAppShareMessage({ coupleName, kioskUrl })
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:flex-1"
                >
                  <Button variant="primary" className="w-full !bg-emerald-600 hover:!bg-emerald-700">
                    Bagikan via WhatsApp
                  </Button>
                </a>
                <Link to="/kiosk" className="w-full sm:w-auto">
                  <Button variant="outline" icon={ExternalLink} className="w-full sm:w-auto">
                    Uji Tampilan Kios
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Page>
  );
}
