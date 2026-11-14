import { useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  UserCheck,
  Search,
  CheckCircle2,
  Plus,
  X,
  Sparkles,
  ArrowLeft,
  Maximize2,
  RotateCcw,
  Users,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useWedding } from "../lib/weddingData";
import { verifyCrewToken } from "../lib/kiosk";
import pb from "../lib/pocketbase";
import { triggerHaptic } from "../lib/haptic";
import { toast } from "sonner";
import { APPLE_SPRINGS, modalBackdropVariants, modalDialogVariants } from "../lib/motion";
import { useModalA11y } from "../lib/useModalA11y";

export default function ReceptionKiosk() {
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryCoupleId = searchParams.get("c");
  const queryToken = searchParams.get("token");

  const wedding = useWedding();
  const {
    couple,
    guests = [],
    guestSummary = {},
    checkInGuest,
    undoCheckInGuest,
    reload,
  } = wedding || {};

  const coupleId = couple?.id || queryCoupleId;
  const isTokenValid = useMemo(() => {
    if (!queryToken) return true; // Direct logged in access
    return verifyCrewToken(queryCoupleId, queryToken);
  }, [queryCoupleId, queryToken]);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending"); // 'pending' default for rapid desk triage
  const [filterSide, setFilterSide] = useState("ALL");
  const [welcomeBanner, setWelcomeBanner] = useState(null);
  const [walkInModal, setWalkInModal] = useState(false);
  const searchInputRef = useRef(null);

  useModalA11y(walkInModal, () => setWalkInModal(false));

  const [walkInForm, setWalkInForm] = useState({
    name: "",
    side: "CPP",
    pax: 1,
    origin: "",
    table_number: "",
    souvenir_given: true,
  });
  const [walkInBusy, setWalkInBusy] = useState(false);

  // Local pax overrides per guest id during desk operations
  const [paxOverrides, setPaxOverrides] = useState({});

  const coupleDisplayName = useMemo(() => {
    if (couple?.cpp_nickname && couple?.cpw_nickname) {
      return `${couple.cpp_nickname} & ${couple.cpw_nickname}`;
    }
    return "Pernikahan Bahagia";
  }, [couple]);

  const filteredGuests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return guests.filter((g) => {
      if (filterStatus === "pending" && g.checked_in) return false;
      if (filterStatus === "checked-in" && !g.checked_in) return false;
      if (filterSide !== "ALL" && g.side !== filterSide) return false;
      if (q) {
        const text = `${g.name} ${g.origin || ""} ${g.group_name || ""} ${g.table_number || ""}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [guests, search, filterStatus, filterSide]);

  const handlePaxChange = (guestId, currentPax, delta) => {
    const basePax = paxOverrides[guestId] !== undefined ? paxOverrides[guestId] : Number(currentPax || 1);
    const newPax = Math.max(1, basePax + delta);
    setPaxOverrides((prev) => ({ ...prev, [guestId]: newPax }));
    triggerHaptic("selection");
  };

  const handlePerformCheckIn = useCallback(
    async (guest, souvenirGiven = true) => {
      const actualPax = paxOverrides[guest.id] !== undefined ? paxOverrides[guest.id] : Number(guest.pax || 1);
      try {
        if (checkInGuest) {
          await checkInGuest(guest.id, {
            guestName: guest.name,
            actual_pax: actualPax,
            souvenir_given: souvenirGiven,
          });
        } else {
          // Direct fallback
          await pb.collection("wedding_guests").update(guest.id, {
            checked_in: true,
            checked_in_at: new Date().toISOString(),
            actual_pax: actualPax,
            souvenir_given: souvenirGiven,
            status: "Hadir",
          });
          reload && (await reload());
        }

        triggerHaptic("success");
        setWelcomeBanner({
          name: guest.name,
          pax: actualPax,
          table: guest.table_number || "Bebas",
          guestId: guest.id,
        });

        toast.success(`Check-in berhasil: ${guest.name} (${actualPax} pax)`);
      } catch (err) {
        toast.error("Gagal check-in: " + (err?.message || ""));
      }
    },
    [checkInGuest, paxOverrides, reload]
  );

  const handleUndo = useCallback(
    async (guestId, guestName) => {
      try {
        if (undoCheckInGuest) {
          await undoCheckInGuest(guestId);
        } else {
          await pb.collection("wedding_guests").update(guestId, {
            checked_in: false,
            checked_in_at: null,
            souvenir_given: false,
          });
          reload && (await reload());
        }
        triggerHaptic("selection");
        setWelcomeBanner(null);
        toast.info(`Check-in dibatalkan untuk ${guestName}`);
      } catch (err) {
        toast.error("Gagal membatalkan: " + (err?.message || ""));
      }
    },
    [undoCheckInGuest, reload]
  );

  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    if (!walkInForm.name.trim()) return;

    setWalkInBusy(true);
    try {
      const activeCoupleId = coupleId || guests[0]?.couple;
      await pb.collection("wedding_guests").create({
        couple: activeCoupleId,
        name: walkInForm.name.trim(),
        side: walkInForm.side,
        pax: Number(walkInForm.pax || 1),
        actual_pax: Number(walkInForm.pax || 1),
        origin: walkInForm.origin.trim(),
        group_name: "Tamu Walk-in",
        table_number: walkInForm.table_number.trim(),
        status: "Hadir",
        checked_in: true,
        checked_in_at: new Date().toISOString(),
        souvenir_given: walkInForm.souvenir_given,
        type: "Fisik",
      });

      reload && (await reload());
      triggerHaptic("success");
      setWelcomeBanner({
        name: walkInForm.name.trim(),
        pax: Number(walkInForm.pax || 1),
        table: walkInForm.table_number.trim() || "Bebas",
      });
      setWalkInModal(false);
      setWalkInForm({
        name: "",
        side: "CPP",
        pax: 1,
        origin: "",
        table_number: "",
        souvenir_given: true,
      });
      toast.success("Tamu walk-in berhasil ditambahkan & check-in!");
    } catch (err) {
      toast.error("Gagal menambahkan tamu: " + (err?.message || ""));
    } finally {
      setWalkInBusy(false);
    }
  };

  const checkedInCount = guestSummary?.checkedInCount || guests.filter((g) => g.checked_in).length;
  const totalCount = guestSummary?.total || guests.length;

  if (queryToken && !isTokenValid) {
    return (
      <div className="min-h-screen bg-canvas dark:bg-night flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-canvas-card dark:bg-night-card p-8 rounded-3xl border border-line dark:border-night-line shadow-lift space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 text-rose-600 grid place-items-center">
            <X size={28} />
          </div>
          <h2 className="font-display text-xl font-semibold text-ink dark:text-stone-50">
            Tautan Kru Tidak Valid
          </h2>
          <p className="text-sm text-ink-muted">
            Token akses panitia meja tamu ini telah kedaluwarsa atau tidak sesuai. Silakan minta tautan terbaru kepada pengantin atau koordinator WO.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-2xl bg-rose-600 text-white font-medium text-sm"
          >
            Masuk ke Aplikasi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas dark:bg-night text-ink dark:text-stone-100 flex flex-col font-sans select-none">
      {/* Top Kiosk Bar */}
      <header className="sticky top-0 z-30 bg-canvas-card/90 dark:bg-night-card/90 backdrop-blur-xl border-b border-line dark:border-night-line px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate("/reception")}
            className="p-2 -ml-1 rounded-xl text-ink-muted hover:text-ink hover:bg-canvas-sunken dark:hover:bg-night-sunken transition focus-ring"
            title="Keluar dari Mode Kios"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              Mode Kios Meja Resepsi
            </span>
            <h1 className="font-display text-base sm:text-lg font-semibold truncate text-ink dark:text-stone-50">
              {coupleDisplayName}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-ink-faint uppercase font-semibold tracking-wider">Kehadiran</p>
            <p className="font-display text-base font-bold tabular-nums text-sage-600 dark:text-sage-400">
              {checkedInCount} <span className="text-xs font-normal text-ink-muted">/ {totalCount} Tamu</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setWalkInModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-rose-600 text-white font-semibold text-xs sm:text-sm hover:bg-rose-700 active:scale-95 shadow-soft transition"
          >
            <Plus size={16} strokeWidth={2.2} />
            <span>Walk-in</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
              } else {
                document.exitFullscreen().catch(() => {});
              }
            }}
            className="p-2 rounded-xl text-ink-muted hover:bg-canvas-sunken dark:hover:bg-night-sunken transition focus-ring"
            title="Layar Penuh (Fullscreen)"
          >
            <Maximize2 size={18} />
          </button>
        </div>
      </header>

      {/* Main Kiosk Workstation */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-4">
        {/* Banner Sambutan Pop-in */}
        <AnimatePresence>
          {welcomeBanner && (
            <motion.div
              initial={reduce ? false : { opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={APPLE_SPRINGS.default}
              className="p-5 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lift relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/20 grid place-items-center shrink-0">
                  <Sparkles size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
                    Selamat Datang!
                  </p>
                  <h2 className="font-display text-xl sm:text-2xl font-bold">
                    {welcomeBanner.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-white/85 mt-0.5">
                    Silakan menempati <strong className="underline text-amber-200">Meja {welcomeBanner.table}</strong> • {welcomeBanner.pax} Pax
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {welcomeBanner.guestId && (
                  <button
                    type="button"
                    onClick={() => handleUndo(welcomeBanner.guestId, welcomeBanner.name)}
                    className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-medium transition"
                  >
                    Batalkan
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setWelcomeBanner(null)}
                  className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition"
                >
                  <X size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search & Filter Bar Cepat */}
        <div className="bg-canvas-card dark:bg-night-card p-3.5 sm:p-4 rounded-3xl border border-line dark:border-night-line shadow-soft space-y-3">
          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ketik nama tamu, instansi, atau nomor meja..."
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-line dark:border-night-line bg-canvas-sunken/60 dark:bg-night-sunken/60 text-ink dark:text-stone-100 text-base placeholder:text-ink-faint outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-ink-faint hover:text-ink transition"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pt-1">
            <div className="flex items-center gap-1.5">
              {[
                { id: "pending", label: "Belum Hadir" },
                { id: "checked-in", label: "Sudah Hadir" },
                { id: "all", label: "Semua Tamu" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setFilterStatus(tab.id);
                    triggerHaptic("selection");
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    filterStatus === tab.id
                      ? "bg-rose-600 text-white shadow-soft"
                      : "bg-canvas-sunken dark:bg-night-sunken text-ink-muted hover:text-ink"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              {["ALL", "CPP", "CPW"].map((side) => (
                <button
                  key={side}
                  type="button"
                  onClick={() => {
                    setFilterSide(side);
                    triggerHaptic("selection");
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold uppercase transition ${
                    filterSide === side
                      ? "bg-ink text-canvas dark:bg-stone-100 dark:text-night"
                      : "text-ink-faint hover:text-ink"
                  }`}
                >
                  {side}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Daftar Kartu Tamu Responsif Kiosk */}
        <div className="space-y-2.5">
          {filteredGuests.length === 0 ? (
            <div className="py-16 text-center bg-canvas-card dark:bg-night-card rounded-3xl border border-dashed border-line dark:border-night-line">
              <Users size={32} className="mx-auto text-ink-faint mb-2" />
              <p className="font-semibold text-sm text-ink dark:text-stone-200">
                Tidak ada data tamu yang cocok
              </p>
              <p className="text-xs text-ink-muted mt-1 max-w-xs mx-auto">
                Coba ubah kata kunci atau gunakan tombol "Walk-in" bila tamu belum terdaftar di undangan.
              </p>
            </div>
          ) : (
            filteredGuests.map((guest) => {
              const currentPax = paxOverrides[guest.id] !== undefined ? paxOverrides[guest.id] : Number(guest.pax || 1);
              const isCheckedIn = Boolean(guest.checked_in);

              return (
                <motion.div
                  key={guest.id}
                  layout="position"
                  transition={{ duration: 0.15 }}
                  className={`p-4 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                    isCheckedIn
                      ? "bg-emerald-500/5 dark:bg-emerald-950/15 border-emerald-500/30"
                      : "bg-canvas-card dark:bg-night-card border-line dark:border-night-line shadow-soft"
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl grid place-items-center font-bold text-sm shrink-0 ${
                        isCheckedIn
                          ? "bg-emerald-500 text-white shadow-soft"
                          : "bg-canvas-sunken dark:bg-night-sunken text-ink-muted border border-line dark:border-night-line"
                      }`}
                    >
                      {isCheckedIn ? <CheckCircle2 size={22} /> : (guest.side || "T")}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display font-semibold text-base sm:text-lg text-ink dark:text-stone-100 truncate">
                          {guest.name}
                        </h3>
                        {guest.table_number && (
                          <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                            Meja {guest.table_number}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-canvas-sunken dark:bg-night-sunken text-ink-muted">
                          {guest.group_name || "Tamu"}
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted mt-0.5">
                        {guest.origin ? `${guest.origin} • ` : ""}Undangan: {guest.pax || 1} pax
                        {guest.souvenir_given && " • 🎁 Souvenir Diberikan"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-line/60 dark:border-night-line/60">
                    {/* Stepper Pax */}
                    <div className="flex items-center gap-1.5 bg-canvas-sunken/80 dark:bg-night-sunken/80 p-1 rounded-2xl border border-line/70 dark:border-night-line/70">
                      <button
                        type="button"
                        disabled={isCheckedIn || currentPax <= 1}
                        onClick={() => handlePaxChange(guest.id, currentPax, -1)}
                        className="w-8 h-8 rounded-xl bg-canvas-card dark:bg-night-card font-bold text-sm text-ink disabled:opacity-30 transition"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-bold tabular-nums text-ink dark:text-stone-200">
                        {currentPax} pax
                      </span>
                      <button
                        type="button"
                        disabled={isCheckedIn}
                        onClick={() => handlePaxChange(guest.id, currentPax, 1)}
                        className="w-8 h-8 rounded-xl bg-canvas-card dark:bg-night-card font-bold text-sm text-ink disabled:opacity-30 transition"
                      >
                        +
                      </button>
                    </div>

                    {/* Tombol Check-In / Undo */}
                    {isCheckedIn ? (
                      <button
                        type="button"
                        onClick={() => handleUndo(guest.id, guest.name)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-canvas-sunken dark:bg-night-sunken text-ink-muted hover:text-rose-600 text-xs font-semibold transition"
                      >
                        <RotateCcw size={14} />
                        <span>Batalkan</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handlePerformCheckIn(guest, true)}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-sm shadow-soft transition"
                      >
                        <UserCheck size={18} strokeWidth={2.2} />
                        <span>Check-In</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </main>

      {/* Modal Tamu Walk-In */}
      <AnimatePresence>
        {walkInModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              variants={modalBackdropVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="absolute inset-0 bg-ink/50 dark:bg-black/70 backdrop-blur-sm"
              onClick={() => setWalkInModal(false)}
            />
            <motion.div
              variants={modalDialogVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="relative w-full max-w-md bg-canvas-card dark:bg-night-card rounded-3xl border border-line dark:border-night-line shadow-lift p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-lg text-ink dark:text-stone-50">
                  Tambah Tamu Walk-in
                </h3>
                <button
                  type="button"
                  onClick={() => setWalkInModal(false)}
                  className="p-1.5 rounded-xl text-ink-faint hover:text-ink transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleWalkInSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">
                    Nama Lengkap Tamu
                  </label>
                  <input
                    type="text"
                    required
                    value={walkInForm.name}
                    onChange={(e) => setWalkInForm({ ...walkInForm, name: e.target.value })}
                    placeholder="Contoh: Bpk. Rahmat Widodo"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-line dark:border-night-line bg-canvas-sunken/60 dark:bg-night-sunken/60 text-sm outline-none focus:border-rose-500"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">
                      Pihak Mempelai
                    </label>
                    <select
                      value={walkInForm.side}
                      onChange={(e) => setWalkInForm({ ...walkInForm, side: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-2xl border border-line dark:border-night-line bg-canvas-sunken/60 dark:bg-night-sunken/60 text-sm outline-none"
                    >
                      <option value="CPP">CPP (Pria)</option>
                      <option value="CPW">CPW (Wanita)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">
                      Jumlah Pax
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={walkInForm.pax}
                      onChange={(e) => setWalkInForm({ ...walkInForm, pax: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-2xl border border-line dark:border-night-line bg-canvas-sunken/60 dark:bg-night-sunken/60 text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">
                      Nomor Meja
                    </label>
                    <input
                      type="text"
                      value={walkInForm.table_number}
                      onChange={(e) => setWalkInForm({ ...walkInForm, table_number: e.target.value })}
                      placeholder="Contoh: Meja 5"
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-line dark:border-night-line bg-canvas-sunken/60 dark:bg-night-sunken/60 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">
                      Kota / Asal
                    </label>
                    <input
                      type="text"
                      value={walkInForm.origin}
                      onChange={(e) => setWalkInForm({ ...walkInForm, origin: e.target.value })}
                      placeholder="Contoh: Bandung"
                      className="w-full px-3.5 py-2.5 rounded-2xl border border-line dark:border-night-line bg-canvas-sunken/60 dark:bg-night-sunken/60 text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-medium text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={walkInForm.souvenir_given}
                      onChange={(e) => setWalkInForm({ ...walkInForm, souvenir_given: e.target.checked })}
                      className="w-4 h-4 rounded text-rose-600"
                    />
                    <span>Berikan Souvenir Langsung</span>
                  </label>
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setWalkInModal(false)}
                    className="flex-1 py-2.5 rounded-2xl bg-canvas-sunken text-ink-muted text-sm font-semibold hover:text-ink transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={walkInBusy}
                    className="flex-1 py-2.5 rounded-2xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition disabled:opacity-50"
                  >
                    {walkInBusy ? "Menyimpan..." : "Simpan & Check-In"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
