import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  Wallet,
  Users,
  TrendingDown,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  CircleDollarSign,
  PiggyBank,
  CheckCircle2,
  Clock3,
  Bell,
  AlertTriangle,
  ArrowRight,
  X,
} from "lucide-react";
import { useState } from "react";
import Countdown from "../components/Countdown";
import { PWAInstallBanner } from "../components/PWAInstallPrompt";
import {
  Page,
  Card,
  StatCard,
  ProgressBar,
  Loading,
  ErrorState,
  Badge,
  SectionTitle,
  EmptyState,
} from "../components/ui";
import { useWedding } from "../lib/weddingData";
import { useAuth } from "../lib/auth";
import { MODULE_ICONS, LOGO_URL } from "../lib/icons";
import {
  formatRupiah,
  formatDateId,
  formatCompact,
  pct,
  timeAgo,
  monthlySavingNeeded,
} from "../lib/format";

const EASE = [0.22, 1, 0.36, 1];

export default function Dashboard() {
  const { isPanitia } = useAuth();
  const {
    couple,
    photos,
    loading,
    error,
    reload,
    logs,
    finance,
    guestSummary,
    vendorSummary,
    adminSummary,
    budgetSummary,
    seserahanSummary,
    gallerySummary,
    rundownSummary = {},
    vendors,
    budgets,
    guests,
    settings,
  } = useWedding();

  const [alertsDismissed, setAlertsDismissed] = useState(false);
  const reduce = useReducedMotion();

  if (loading) return <Loading label="Menyiapkan dasbor…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!couple) {
    return (
      <Card className="text-center py-16">
        <p className="text-ink-muted">
          Belum ada data pasangan. Jalankan <code className="font-mono">npm run seed</code>.
        </p>
      </Card>
    );
  }

  const weddingDate = couple.wedding_date || "2028-02-17";
  const coupleName = `${couple.cpp_nickname || "CPP"} & ${couple.cpw_nickname || "CPW"}`;
  const savedPct = pct(finance.balance, finance.targetBudget);
  const perMonth = monthlySavingNeeded(finance.remainingTarget, weddingDate);
  const spendPct = pct(finance.expense, finance.income || 1);

  // Foto hanya muncul setelah sesi prewedding selesai, ada minimal satu foto,
  // dan pemilik tidak mematikannya lewat pengaturan.
  const showGallery =
    gallerySummary.preweddingDone && photos.length > 0 && gallerySummary.showOnDashboard;

  // Hitung Peringatan & Alerts Cerdas Berdasarkan Settings
  const daysUntilVendor = (d) => {
    if (!d) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(d);
    target.setHours(0, 0, 0, 0);
    return Math.round((target - now) / 86400000);
  };

  const vendorAlertDays = settings?.alert_vendor_days || 7;
  const overdueVendors = (vendors || []).filter(
    (v) => !v.is_completed && v.deadline_date && daysUntilVendor(v.deadline_date) < 0
  );
  const urgentVendors = (vendors || []).filter(
    (v) =>
      !v.is_completed &&
      v.deadline_date &&
      daysUntilVendor(v.deadline_date) >= 0 &&
      daysUntilVendor(v.deadline_date) <= vendorAlertDays
  );

  const budgetOverruns = (budgets || []).filter(
    (b) => (b.actual || 0) > (b.allocated || 0) && (b.allocated || 0) > 0
  );

  const pendingPriorityGuests = (guests || []).filter(
    (g) => g.priority === "A - Must Invite" && (!g.status || g.status === "Belum")
  );

  const hasAlerts =
    (settings?.alert_vendor_deadline !== false && (overdueVendors.length > 0 || urgentVendors.length > 0)) ||
    (settings?.alert_budget_overrun !== false && budgetOverruns.length > 0) ||
    (settings?.alert_rsvp_reminder !== false && pendingPriorityGuests.length > 0);

  const totalAlertCount =
    (settings?.alert_vendor_deadline !== false ? overdueVendors.length + urgentVendors.length : 0) +
    (settings?.alert_budget_overrun !== false ? budgetOverruns.length : 0) +
    (settings?.alert_rsvp_reminder !== false && pendingPriorityGuests.length > 0 ? 1 : 0);

  return (
    <Page>
      {/* ============================ HERO ============================ */}
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="relative overflow-hidden rounded-4xl bg-ink dark:bg-night-card px-5 py-7 sm:px-8 sm:py-9"
      >
        {/* Cahaya bergerak sangat lambat: GPU offloaded ke CSS compositor thread */}
        <div
          aria-hidden
          className={`absolute -top-28 -right-16 w-[26rem] h-[26rem] rounded-full bg-rose-600/30 blur-3xl gpu-layer ${
            reduce ? "" : "animate-ambient-1"
          }`}
        />
        <div
          aria-hidden
          className={`absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-brass-400/20 blur-3xl gpu-layer ${
            reduce ? "" : "animate-ambient-2"
          }`}
        />
        <div aria-hidden className="absolute inset-0 grain opacity-30" />

        <div className="relative flex flex-col lg:flex-row lg:items-end gap-7">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-4">
              <Badge className="!bg-white/10 !text-white/80 backdrop-blur-sm">
                <Sparkles size={11} />
                {Math.round(savedPct)}% target tabungan tercapai
              </Badge>
            </div>

            <div className="flex items-center gap-3.5 mb-2">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-rose-600/90 to-rose-700/90 p-1.5 shadow-glow grid place-items-center shrink-0 border border-white/20 backdrop-blur-sm">
                <img
                  src={LOGO_URL}
                  alt="Wedding Logo"
                  className="w-full h-full object-contain filter drop-shadow"
                />
              </div>
              <h1 className="font-display text-[28px] leading-[1.08] sm:text-4xl lg:text-[40px] font-semibold tracking-tight text-white">
                {coupleName}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-3 text-white/60 text-sm">
              <span>{formatDateId(weddingDate)}</span>
              {couple.venue && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/30" />
                  <span>{couple.venue}</span>
                </>
              )}
            </div>

            <div className="mt-6">
              <Countdown target={weddingDate} />
            </div>
          </div>

          {/* Ringkasan status di dalam hero */}
          <div className="lg:w-72 shrink-0">
            {isPanitia ? (
              <div className="rounded-3xl bg-white/[0.07] border border-white/10 backdrop-blur-sm p-4">
                <div className="flex items-center gap-2 text-white/60 text-[11px] font-semibold uppercase tracking-[0.12em]">
                  <Clock3 size={13} /> Agenda Berikutnya
                </div>
                <p className="font-display text-lg font-semibold text-white mt-2 truncate">
                  {rundownSummary?.nextRundown?.title || "Semua agenda selesai"}
                </p>
                <p className="text-xs text-rose-300 mt-1 truncate">
                  {rundownSummary?.nextRundown?.time_start
                    ? `Pukul ${rundownSummary.nextRundown.time_start} • ${rundownSummary.nextRundown.location || "Lokasi utama"}`
                    : "Jadwal acara hari-H"}
                </p>
                <div className="mt-3">
                  <ProgressBar
                    value={rundownSummary?.total ? (rundownSummary.done / rundownSummary.total) * 100 : 0}
                    tone="bg-brass-300"
                    height="h-1.5"
                    trackClassName="!bg-white/15"
                  />
                </div>
                <p className="text-[11px] text-white/55 mt-2">
                  {rundownSummary?.done || 0} dari {rundownSummary?.total || 0} agenda selesai
                </p>
              </div>
            ) : (
              <div className="rounded-3xl bg-white/[0.07] border border-white/10 backdrop-blur-sm p-4">
                <div className="flex items-center gap-2 text-white/60 text-[11px] font-semibold uppercase tracking-[0.12em]">
                  <PiggyBank size={13} /> Dana terkumpul
                </div>
                <p className="font-display text-2xl font-semibold text-white mt-2 tabular-nums">
                  {formatRupiah(finance.balance)}
                </p>
                <div className="mt-3">
                  <ProgressBar
                    value={savedPct}
                    tone="bg-brass-300"
                    height="h-1.5"
                    trackClassName="!bg-white/15"
                  />
                </div>
                <p className="text-[11px] text-white/55 mt-2">
                  Target {formatCompact(finance.targetBudget)} • kurang{" "}
                  {formatCompact(finance.remainingTarget)}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* Ajakan Pasang ke Layar Utama (PWA) */}
      <PWAInstallBanner />

      {/* ===================== SMART WEDDING ALERTS WIDGET ===================== */}
      {hasAlerts && !alertsDismissed && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-amber-500/10 p-4 sm:p-5 shadow-sm"
        >
          <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300">
                <Bell size={16} />
              </span>
              <div>
                <h3 className="font-display font-semibold text-sm text-ink dark:text-stone-100 flex items-center gap-2">
                  Pusat Peringatan &amp; Pengingat
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-200">
                    {totalAlertCount} Perlu Perhatian
                  </span>
                </h3>
                <p className="text-xs text-ink-muted">Berdasarkan setelan peringatan pernikahan Anda</p>
              </div>
            </div>
            <button
              onClick={() => setAlertsDismissed(true)}
              className="p-1.5 rounded-xl text-ink-faint hover:text-ink hover:bg-canvas-sunken dark:hover:bg-night-sunken transition"
              title="Tutup sementara"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            {/* 1. Vendor overdue / urgent */}
            {(overdueVendors.length > 0 || urgentVendors.length > 0) && (
              <div className="p-3 rounded-2xl bg-canvas-card/85 dark:bg-night-card/85 border border-rose-500/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold text-xs mb-1">
                    <AlertTriangle size={14} />
                    <span>Tenggat Vendor Mendesak</span>
                  </div>
                  <p className="text-xs text-ink dark:text-stone-200">
                    {overdueVendors.length > 0 ? (
                      <span><strong>{overdueVendors.length} tugas</strong> lewat tenggat!</span>
                    ) : (
                      <span><strong>{urgentVendors.length} tugas</strong> jatuh tempo minggu ini.</span>
                    )}
                  </p>
                  <p className="text-[11px] text-ink-faint mt-0.5 line-clamp-1">
                    {overdueVendors[0]?.activity_name || urgentVendors[0]?.activity_name}
                  </p>
                </div>
                <Link
                  to="/vendors"
                  className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                >
                  <span>Buka Checklist Vendor</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            )}

            {/* 2. Budget overrun */}
            {budgetOverruns.length > 0 && (
              <div className="p-3 rounded-2xl bg-canvas-card/85 dark:bg-night-card/85 border border-amber-500/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold text-xs mb-1">
                    <AlertTriangle size={14} />
                    <span>Anggaran Melebihi Target</span>
                  </div>
                  <p className="text-xs text-ink dark:text-stone-200">
                    <strong>{budgetOverruns.length} pos</strong> melebihi alokasi awal.
                  </p>
                  <p className="text-[11px] text-ink-faint mt-0.5 line-clamp-1">
                    {budgetOverruns[0]?.item} (lebih {formatRupiah((budgetOverruns[0]?.actual || 0) - (budgetOverruns[0]?.allocated || 0))})
                  </p>
                </div>
                <Link
                  to="/budget"
                  className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  <span>Periksa Anggaran</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            )}

            {/* 3. Priority A guests */}
            {pendingPriorityGuests.length > 0 && (
              <div className="p-3 rounded-2xl bg-canvas-card/85 dark:bg-night-card/85 border border-sky-500/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-semibold text-xs mb-1">
                    <Users size={14} />
                    <span>Follow-up Tamu Prioritas A</span>
                  </div>
                  <p className="text-xs text-ink dark:text-stone-200">
                    <strong>{pendingPriorityGuests.length} tamu penting</strong> belum RSVP.
                  </p>
                  <p className="text-[11px] text-ink-faint mt-0.5 line-clamp-1">
                    Siap dikirimi pesan pengingat WhatsApp.
                  </p>
                </div>
                <Link
                  to="/guests"
                  className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  <span>Kirim WA Tamu</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ========================= KARTU STATISTIK ========================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isPanitia ? (
          <StatCard
            label="Itinerary Hari-H"
            value={`${rundownSummary?.done || 0}/${rundownSummary?.total || 0}`}
            sub="agenda terselesaikan"
            icon={Clock3}
            tone="rose"
            delay={0}
          />
        ) : (
          <StatCard
            label="Perlu ditabung"
            value={formatRupiah(finance.remainingTarget)}
            sub={
              perMonth > 0
                ? `≈ ${formatRupiah(perMonth)}/bulan hingga hari H`
                : "target sudah tercapai"
            }
            icon={Wallet}
            tone="rose"
            delay={0}
          />
        )}
        <StatCard
          label="Tamu undangan"
          value={guestSummary.total}
          sub={`${guestSummary.totalPax} pax • ${guestSummary.hadir} sudah konfirmasi`}
          icon={Users}
          tone="sky"
          delay={0.05}
        />
        <StatCard
          label="Progres persiapan"
          value={`${adminSummary.done + vendorSummary.done + seserahanSummary.done}/${adminSummary.total + vendorSummary.total + seserahanSummary.total}`}
          sub="administrasi, vendor & seserahan"
          icon={CheckCircle2}
          tone="sage"
          delay={0.1}
        />
        <StatCard
          label="Tenggat terdekat"
          value={`${vendorSummary.remaining}`}
          sub={vendorSummary.remaining === 0 ? "semua tugas beres" : "tugas belum selesai"}
          icon={CalendarCheckIcon}
          tone="amber"
          delay={0.15}
        />
      </section>

      {/* ========================= GALERI (kondisional) ========================= */}
      {/* Foto hanya muncul setelah ditandai "sudah prewedding". Sebelum itu
          tidak ada satu pun elemen foto di dasbor. */}
      {showGallery && (
        <motion.section
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE, delay: 0.1 }}
        >
          <Card>
            <SectionTitle
              count={`${photos.length} foto`}
              action={
                <Link
                  to="/gallery"
                  className="text-xs font-semibold text-rose-600 dark:text-rose-300 flex items-center gap-1 hover:gap-1.5 transition-all"
                >
                  Lihat semua <ArrowUpRight size={13} />
                </Link>
              }
            >
              {gallerySummary.title || "Momen prewedding"}
            </SectionTitle>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
              {photos.slice(0, 8).map((photo, index) => (
                <PhotoTile key={photo.id} photo={photo} index={index} />
              ))}
            </div>
          </Card>
        </motion.section>
      )}

      {/* ========================= PROGRES & RINGKASAN ========================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
        {/* Arus kas / Operasional Hari-H */}
        {isPanitia ? (
          <Card className="lg:col-span-2">
            <SectionTitle
              action={
                <Link
                  to="/reception"
                  className="text-xs font-semibold text-rose-600 dark:text-rose-300 flex items-center gap-1"
                >
                  Buka Meja Tamu <ArrowUpRight size={13} />
                </Link>
              }
            >
              Meja Penerima Tamu Resepsi
            </SectionTitle>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
              <MoneyBlock
                icon={Users}
                tone="text-sage-600 dark:text-sage-300"
                label="Hadir di Lokasi"
                value={`${guestSummary.checkedInCount || 0} tamu`}
              />
              <MoneyBlock
                icon={CheckCircle2}
                tone="text-sky-600 dark:text-sky-300"
                label="Total Pax Masuk"
                value={`${guestSummary.checkedInPax || 0} porsi`}
              />
              <MoneyBlock
                icon={Clock3}
                tone="text-amber-600 dark:text-amber-300"
                label="Belum Hadir"
                value={`${Math.max((guestSummary.total || 0) - (guestSummary.checkedInCount || 0), 0)} tamu`}
              />
            </div>

            <div className="mt-6 pt-5 border-t border-line dark:border-night-line">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-ink-muted">Souvenir Diberikan</span>
                <span className="font-semibold tabular-nums">
                  {guestSummary.souvenirGivenCount || 0} paket souvenir
                </span>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <Link to="/reception" className="flex-1">
                  <button className="w-full py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition shadow-glow active:scale-[0.97]">
                    Buka Meja Check-in Tamu
                  </button>
                </Link>
                <Link to="/rundown" className="flex-1">
                  <button className="w-full py-2.5 rounded-2xl bg-canvas-sunken dark:bg-night-sunken text-ink dark:text-stone-100 font-semibold text-xs border border-line dark:border-night-line hover:bg-canvas-card transition active:scale-[0.97]">
                    Lihat Rundown Hari-H
                  </button>
                </Link>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="lg:col-span-2">
            <SectionTitle
              action={
                <Link
                  to="/budget"
                  className="text-xs font-semibold text-rose-600 dark:text-rose-300 flex items-center gap-1"
                >
                  Kelola <ArrowUpRight size={13} />
                </Link>
              }
            >
              Keuangan pernikahan
            </SectionTitle>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
              <MoneyBlock
                icon={TrendingUp}
                tone="text-sage-600 dark:text-sage-300"
                label="Pemasukan"
                value={finance.income}
              />
              <MoneyBlock
                icon={TrendingDown}
                tone="text-rose-600 dark:text-rose-300"
                label="Pengeluaran"
                value={finance.expense}
              />
              <MoneyBlock
                icon={CircleDollarSign}
                tone="text-ink dark:text-stone-100"
                label="Saldo kas"
                value={finance.balance}
              />
            </div>

            <div className="mt-6 space-y-4 pt-5 border-t border-line dark:border-night-line">
              <div>
                <div className="flex items-center justify-between text-[13px] mb-2">
                  <span className="text-ink-muted">Target tabungan</span>
                  <span className="font-semibold tabular-nums">
                    {formatRupiah(finance.balance)}
                    <span className="text-ink-faint font-normal">
                      {" "}
                      / {formatRupiah(finance.targetBudget)}
                    </span>
                  </span>
                </div>
                <ProgressBar value={savedPct} tone="bg-sage-500" />
              </div>

              <div>
                <div className="flex items-center justify-between text-[13px] mb-2">
                  <span className="text-ink-muted">Dana terpakai</span>
                  <span className="font-semibold tabular-nums">{spendPct.toFixed(1)}%</span>
                </div>
                <ProgressBar value={spendPct} tone="bg-rose-400" />
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1">
                <MiniStat label="Pemasukan CPP" value={finance.incomeCpp} />
                <MiniStat label="Pemasukan CPW" value={finance.incomeCpw} />
                <MiniStat label="Masih kurang" value={finance.remainingTarget} tone="text-rose-600 dark:text-rose-300" />
              </div>
            </div>
          </Card>
        )}

        {/* Progres modul */}
        <Card>
          <SectionTitle>Ringkasan modul</SectionTitle>
          <div className="space-y-4 mt-5">
            <ModuleRow
              to="/rundown"
              module="rundown"
              label="Itinerary Hari-H"
              value={`${rundownSummary?.done || 0}/${rundownSummary?.total || 0} agenda`}
              progress={pct(rundownSummary?.done || 0, rundownSummary?.total || 1)}
              tone="bg-rose-500"
            />
            <ModuleRow
              to="/reception"
              module="reception"
              label="Buku Tamu Resepsi"
              value={`${guestSummary.checkedInCount || 0} hadir`}
              progress={pct(guestSummary.checkedInCount || 0, guestSummary.total || 1)}
              tone="bg-emerald-500"
            />
            {!isPanitia && (
              <ModuleRow
                to="/budget"
                module="budget"
                label="Anggaran & termin"
                value={`${formatCompact(budgetSummary.paid)} / ${formatCompact(budgetSummary.total)}`}
                progress={pct(budgetSummary.paid, budgetSummary.total)}
                tone="bg-rose-500"
              />
            )}
            <ModuleRow
              to="/vendors"
              module="vendors"
              label="Vendor & jadwal"
              value={`${vendorSummary.done}/${vendorSummary.total} selesai`}
              progress={pct(vendorSummary.done, vendorSummary.total)}
              tone="bg-brass-400"
            />
            <ModuleRow
              to="/administration"
              module="administration"
              label="Administrasi KUA"
              value={`${adminSummary.done}/${adminSummary.total} selesai`}
              progress={pct(adminSummary.done, adminSummary.total)}
              tone="bg-sky-500"
            />
            <ModuleRow
              to="/seserahan"
              module="seserahan"
              label="Seserahan"
              value={`${seserahanSummary.done}/${seserahanSummary.total} item`}
              progress={pct(seserahanSummary.done, seserahanSummary.total)}
              tone="bg-violet-500"
            />
            <ModuleRow
              to="/guests"
              module="guests"
              label="Tamu dikonfirmasi"
              value={`${guestSummary.hadir}/${guestSummary.total} tamu`}
              progress={pct(guestSummary.hadir, guestSummary.total)}
              tone="bg-sage-500"
            />
          </div>
        </Card>
      </div>

      {/* ========================= AKTIVITAS ========================= */}
      <Card>
        <SectionTitle count={logs.length ? `${logs.length} catatan` : null}>
          Aktivitas terbaru
        </SectionTitle>

        {logs.length === 0 ? (
          <EmptyState
            icon={Clock3}
            message="Belum ada aktivitas yang tercatat."
            hint="Setiap perubahan pada anggaran, tamu, atau checklist akan muncul di sini."
          />
        ) : (
          <ul className="mt-4 space-y-0.5">
            {logs.slice(0, 7).map((log, index) => (
              <motion.li
                key={log.id}
                initial={reduce ? false : { opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03, duration: 0.25, ease: EASE }}
                className="group flex items-start gap-3.5 py-2.5 px-2 -mx-2 rounded-2xl hover:bg-canvas-sunken/60 dark:hover:bg-night-sunken/60 transition-colors"
              >
                <ActivityDot type={log.action_type} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] leading-snug text-ink dark:text-stone-200">
                    {log.action_description}
                  </p>
                  <p className="text-[11px] text-ink-faint mt-0.5">
                    {timeAgo(log.created)}
                    {Number(log.amount) > 0 && ` • ${formatRupiah(log.amount)}`}
                  </p>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </Card>
    </Page>
  );
}

/* ========================================================================== */
/*  Komponen pendukung                                                        */
/* ========================================================================== */

// Ikon kalender diambil dari peta modul supaya tidak ada impor ganda.
function CalendarCheckIcon(props) {
  const Icon = MODULE_ICONS.vendors;
  return <Icon {...props} />;
}

function PhotoTile({ photo, index }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: EASE }}
      className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-canvas-sunken dark:bg-night-sunken group contain-paint"
    >
      <img
        src={photo.src}
        alt={photo.alt}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-glide group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      {photo.section && (
        <span className="absolute bottom-2 left-2 text-[10px] font-semibold text-white/90 opacity-0 group-hover:opacity-100 transition-opacity">
          {photo.section}
        </span>
      )}
    </motion.div>
  );
}

function MoneyBlock({ icon: Icon, tone, label, value }) {
  return (
    <div className="rounded-2xl bg-canvas-sunken/60 dark:bg-night-sunken/60 p-3.5">
      <div className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] ${tone}`}>
        <Icon size={13} />
        {label}
      </div>
      <p className="font-display text-lg sm:text-xl font-semibold mt-1.5 tabular-nums text-ink dark:text-stone-50">
        {typeof value === "number" ? formatRupiah(value) : value}
      </p>
    </div>
  );
}

function MiniStat({ label, value, tone = "" }) {
  return (
    <div>
      <p className="text-[11px] text-ink-faint">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 tabular-nums ${tone || "text-ink dark:text-stone-100"}`}>
        {formatCompact(value)}
      </p>
    </div>
  );
}

function ModuleRow({ to, module, label, value, progress, tone }) {
  const Icon = MODULE_ICONS[module];
  return (
    <Link to={to} className="block group focus-ring rounded-2xl">
      <div className="flex items-center gap-2.5 mb-1.5">
        <Icon size={15} className="text-ink-faint shrink-0" strokeWidth={2} />
        <span className="text-[13px] flex-1 truncate text-ink-muted group-hover:text-ink dark:group-hover:text-stone-100 transition-colors">
          {label}
        </span>
        <ArrowUpRight
          size={13}
          className="text-ink-faint opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-glide shrink-0"
        />
      </div>
      <ProgressBar value={progress} tone={tone} height="h-1.5" />
      <p className="text-[11px] text-ink-faint mt-1.5 tabular-nums">{value}</p>
    </Link>
  );
}

function ActivityDot({ type }) {
  const tones = {
    payment: "bg-rose-500",
    guest: "bg-sky-500",
    task: "bg-brass-400",
    document: "bg-sage-500",
    info: "bg-violet-500",
  };
  return (
    <span className="mt-1.5 shrink-0 relative flex h-2 w-2">
      <span className={`absolute inset-0 rounded-full ${tones[type] || tones.info} opacity-40`} />
      <span className={`relative h-2 w-2 rounded-full ${tones[type] || tones.info}`} />
    </span>
  );
}
