import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Printer,
  Users,
  Wallet,
  TrendingUp,
  CheckCircle2,
  Coins,
} from "lucide-react";
import {
  Page,
  PageHeader,
  Card,
  StatCard,
  SectionTitle,
  Button,
} from "../components/ui";
import { useWedding } from "../lib/weddingData";
import { formatRupiah, formatNumber } from "../lib/format";
import { exportToCsv } from "../lib/export";
import { printMasterGuidebook } from "../lib/weddingMasterGuidebook";
import { toast } from "sonner";
import { triggerHaptic } from "../lib/haptic";

export default function Analytics() {
  const {
    couple,
    guests = [],
    budgets = [],
    vendors = [],
    gifts = [],
    rundowns = [],
  } = useWedding();

  const [activeReportTab, setActiveReportTab] = useState("overview"); // 'overview', 'rsvp', 'budget', 'exports'

  // 1. Perhitungan RSVP Funnel
  const totalGuests = guests.length;
  const sentCount = guests.filter((g) => g.invitation_sent).length;
  const attendingCount = guests.filter((g) => g.rsvp_status === "Hadir").length;
  const pendingCount = guests.filter((g) => !g.rsvp_status || g.rsvp_status === "Belum").length;
  const totalPaxAttending = guests
    .filter((g) => g.rsvp_status === "Hadir")
    .reduce((sum, g) => sum + (Number(g.pax) || 1), 0);

  const rsvpRate = totalGuests > 0 ? Math.round((attendingCount / totalGuests) * 100) : 0;
  const deliveryRate = totalGuests > 0 ? Math.round((sentCount / totalGuests) * 100) : 0;

  // 2. Perhitungan Pihak Tamu (CPP vs CPW)
  const cppGuests = guests.filter((g) => g.side === "CPP").length;
  const cpwGuests = guests.filter((g) => g.side === "CPW").length;
  const neutralGuests = totalGuests - cppGuests - cpwGuests;

  // 3. Perhitungan Anggaran & Kategori
  const targetBudget = Number(couple?.target_budget) || 0;
  const totalSpent = budgets.reduce((acc, b) => acc + (Number(b.actual_cost) || 0), 0);

  const budgetByCategory = useMemo(() => {
    const map = {};
    budgets.forEach((b) => {
      const cat = b.category || "Lain-lain";
      if (!map[cat]) {
        map[cat] = { estimated: 0, actual: 0 };
      }
      map[cat].estimated += Number(b.estimated_cost) || 0;
      map[cat].actual += Number(b.actual_cost) || 0;
    });

    return Object.entries(map).map(([name, data]) => ({
      name,
      ...data,
      percent: targetBudget > 0 ? (data.actual / targetBudget) * 100 : 0,
    }));
  }, [budgets, targetBudget]);

  // 4. Perhitungan Kado & Angpao
  const totalGiftCash = gifts
    .filter((g) => g.gift_type === "Amplop Tunai")
    .reduce((acc, g) => acc + (Number(g.amount) || 0), 0);
  const totalGiftDigital = gifts
    .filter((g) => g.gift_type === "Transfer Bank / QRIS")
    .reduce((acc, g) => acc + (Number(g.amount) || 0), 0);
  const totalGiftAll = totalGiftCash + totalGiftDigital;

  // 5. Perhitungan Vendor
  const totalVendorCost = vendors.reduce(
    (acc, v) => acc + (Number(v.actual_cost || v.estimated_cost) || 0),
    0
  );
  const totalVendorPaid = vendors.reduce((acc, v) => acc + (Number(v.paid_amount) || 0), 0);
  const vendorPaidPercent = totalVendorCost > 0 ? Math.round((totalVendorPaid / totalVendorCost) * 100) : 0;

  // Handlers Ekspor
  const handleExportGuests = () => {
    if (guests.length === 0) {
      toast.error("Belum ada data tamu untuk diekspor.");
      return;
    }
    const rows = guests.map((g) => ({
      Nama: g.name,
      Pihak: g.side || "-",
      Kategori: g.group_name || "-",
      RSVP: g.rsvp_status || "Belum",
      Jumlah_Pax: g.pax || 1,
      No_Meja: g.table_number || "-",
      Undangan_Terkirim: g.invitation_sent ? "Ya" : "Belum",
      Check_in: g.checked_in ? "Hadir" : "Belum",
      Waktu_Checkin: g.checked_in_at || "-",
    }));
    exportToCsv("rekap_tamu_undangan.csv", rows);
    toast.success("Daftar tamu berhasil diunduh (CSV)");
  };

  const handleExportBudget = () => {
    if (budgets.length === 0) {
      toast.error("Belum ada data anggaran untuk diekspor.");
      return;
    }
    const rows = budgets.map((b) => ({
      Kategori: b.category,
      Item: b.item_name || b.name,
      Estimasi: b.estimated_cost || 0,
      Realisasi: b.actual_cost || 0,
      Status_Bayar: b.status || "-",
      Catatan: b.notes || "-",
    }));
    exportToCsv("rekap_anggaran_pernikahan.csv", rows);
    toast.success("Data anggaran berhasil diunduh (CSV)");
  };

  const handleDownloadMasterGuidebook = () => {
    printMasterGuidebook({
      couple,
      guests,
      budgets,
      vendors,
      rundowns,
    });
  };

  return (
    <Page>
      <PageHeader
        title="Analitik, Laporan & Wawasan"
        subtitle="Visualisasi data kehadiran tamu, performa anggaran, ringkasan vendor, serta ekspor dokumen resmi"
        icon={BarChart3}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="neutral"
              size="sm"
              icon={Printer}
              onClick={() => window.print()}
            >
              Cetak Laporan
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Download}
              onClick={handleDownloadMasterGuidebook}
            >
              Unduh Buku Panduan
            </Button>
          </div>
        }
      />

      {/* Ringkasan KPI Utama */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Tamu Undangan"
          value={formatNumber(totalGuests)}
          sub={`${attendingCount} hadir (${rsvpRate}%)`}
          icon={Users}
          tone="rose"
        />
        <StatCard
          label="Estimasi Pax Hadir"
          value={formatNumber(totalPaxAttending)}
          sub="Berdasarkan konfirmasi RSVP"
          icon={CheckCircle2}
          tone="sage"
        />
        <StatCard
          label="Realisasi Pengeluaran"
          value={formatRupiah(totalSpent)}
          sub={
            targetBudget > 0
              ? `${Math.round((totalSpent / targetBudget) * 100)}% dari target ${formatRupiah(targetBudget)}`
              : "Belum menetapkan target"
          }
          icon={Wallet}
          tone={totalSpent > targetBudget ? "rose" : "amber"}
        />
        <StatCard
          label="Total Kado & Angpao"
          value={formatRupiah(totalGiftAll)}
          sub={`${formatRupiah(totalGiftDigital)} via QRIS digital`}
          icon={Coins}
          tone="sky"
        />
      </div>

      {/* Tab Filter Navigasi */}
      <div className="flex items-center gap-1.5 border-b border-line dark:border-night-line pb-px overflow-x-auto no-scrollbar">
        {[
          { id: "overview", label: "Ringkasan Eksekutif", icon: TrendingUp },
          { id: "rsvp", label: "Funnel Kehadiran Tamu", icon: Users },
          { id: "budget", label: "Alokasi Anggaran", icon: Wallet },
          { id: "exports", label: "Pusat Laporan & Ekspor", icon: FileSpreadsheet },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeReportTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setActiveReportTab(t.id);
              }}
              className={`relative pb-3 px-3.5 text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-2 focus-ring rounded-lg ${
                isActive
                  ? "text-rose-600 dark:text-rose-300"
                  : "text-ink-muted hover:text-ink dark:hover:text-stone-300"
              }`}
            >
              <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{t.label}</span>
              {isActive && (
                <motion.span
                  layoutId="analytics-active-tab"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-rose-600 dark:bg-rose-400 rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ======================= TAB 1: OVERVIEW ======================= */}
      {activeReportTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visualisasi Funnel Ringkas */}
            <Card className="space-y-4">
              <SectionTitle
                title="Funnel Undangan & RSVP"
                subtitle="Status konfirmasi kehadiran tamu undangan"
              />

              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-ink dark:text-stone-200">Undangan Terkirim</span>
                    <span className="text-ink-muted">{sentCount} / {totalGuests} ({deliveryRate}%)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-canvas-sunken dark:bg-night-sunken overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${deliveryRate}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-emerald-700 dark:text-emerald-400">Konfirmasi Hadir</span>
                    <span className="text-ink-muted">{attendingCount} Tamu ({rsvpRate}%)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-canvas-sunken dark:bg-night-sunken overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${rsvpRate}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-amber-700 dark:text-amber-400">Belum Respon / Pending</span>
                    <span className="text-ink-muted">
                      {pendingCount} Tamu ({totalGuests > 0 ? Math.round((pendingCount / totalGuests) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-canvas-sunken dark:bg-night-sunken overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{
                        width: `${totalGuests > 0 ? (pendingCount / totalGuests) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-line dark:border-night-line flex justify-between text-xs">
                <span className="text-ink-muted">Rasio Pihak Mempelai:</span>
                <span className="font-semibold text-ink dark:text-stone-100">
                  CPP: {cppGuests} • CPW: {cpwGuests} {neutralGuests > 0 ? `• Bersama: ${neutralGuests}` : ""}
                </span>
              </div>
            </Card>

            {/* Visualisasi Vendor Progress */}
            <Card className="space-y-4">
              <SectionTitle
                title="Progres Pembayaran Vendor"
                subtitle="Status pelunasan kontrak kerja vendor pernikahan"
              />

              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-ink dark:text-stone-200">Realisasi Pelunasan Vendor</span>
                    <span className="text-ink-muted">{vendorPaidPercent}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-canvas-sunken dark:bg-night-sunken overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all duration-500"
                      style={{ width: `${vendorPaidPercent}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-canvas-sunken dark:bg-night-sunken text-xs">
                    <p className="text-ink-muted">Sudah Dibayar</p>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">
                      {formatRupiah(totalVendorPaid)}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-canvas-sunken dark:bg-night-sunken text-xs">
                    <p className="text-ink-muted">Sisa Tagihan</p>
                    <p className="font-semibold text-rose-600 dark:text-rose-400 text-sm mt-0.5">
                      {formatRupiah(Math.max(0, totalVendorCost - totalVendorPaid))}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-line dark:border-night-line flex justify-between text-xs">
                <span className="text-ink-muted">Total Vendor Terdaftar:</span>
                <span className="font-semibold text-ink dark:text-stone-100">
                  {vendors.length} Vendor ({formatRupiah(totalVendorCost)})
                </span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ======================= TAB 2: RSVP FUNNEL ======================= */}
      {activeReportTab === "rsvp" && (
        <Card className="space-y-5">
          <SectionTitle
            title="Analisis Mendalam Kehadiran Tamu"
            subtitle="Rincian distribusi tamu, asal pihak mempelai, serta status kehadiran"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
              <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">Tamu Pihak CPP</p>
              <p className="font-display font-semibold text-2xl text-rose-700 dark:text-rose-300 mt-1">
                {cppGuests}
              </p>
              <p className="text-[11px] text-ink-muted mt-0.5">
                {totalGuests > 0 ? Math.round((cppGuests / totalGuests) * 100) : 0}% dari total
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-center">
              <p className="text-xs text-sky-700 dark:text-sky-300 font-medium">Tamu Pihak CPW</p>
              <p className="font-display font-semibold text-2xl text-sky-700 dark:text-sky-300 mt-1">
                {cpwGuests}
              </p>
              <p className="text-[11px] text-ink-muted mt-0.5">
                {totalGuests > 0 ? Math.round((cpwGuests / totalGuests) * 100) : 0}% dari total
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-sage-500/10 border border-sage-500/20 text-center">
              <p className="text-xs text-sage-700 dark:text-sage-300 font-medium">Estimasi Konsumsi (Pax)</p>
              <p className="font-display font-semibold text-2xl text-sage-700 dark:text-sage-300 mt-1">
                {totalPaxAttending}
              </p>
              <p className="text-[11px] text-ink-muted mt-0.5">Porsi Katering Dikonfirmasi</p>
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="neutral"
              size="sm"
              icon={FileSpreadsheet}
              onClick={handleExportGuests}
            >
              Ekspor Daftar Tamu (CSV)
            </Button>
          </div>
        </Card>
      )}

      {/* ======================= TAB 3: BUDGET BREAKDOWN ======================= */}
      {activeReportTab === "budget" && (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionTitle
              title="Rincian Alokasi Per Pos Anggaran"
              subtitle="Perbandingan alokasi rencana vs realisasi pengeluaran riil"
            />
            <Button
              variant="neutral"
              size="sm"
              icon={FileSpreadsheet}
              onClick={handleExportBudget}
            >
              Ekspor Anggaran (CSV)
            </Button>
          </div>

          <div className="space-y-3 pt-2">
            {budgetByCategory.map((cat, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-canvas-sunken dark:bg-night-sunken border border-line dark:border-night-line space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink dark:text-stone-100">{cat.name}</span>
                  <span className="font-semibold text-ink dark:text-stone-200">
                    {formatRupiah(cat.actual)} / {formatRupiah(cat.estimated)}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-line dark:bg-night-line overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      cat.actual > cat.estimated ? "bg-rose-500" : "bg-emerald-500"
                    }`}
                    style={{
                      width: `${Math.min(100, cat.estimated > 0 ? (cat.actual / cat.estimated) * 100 : 0)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ======================= TAB 4: PUSAT LAPORAN & EKSPOR ======================= */}
      {activeReportTab === "exports" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 grid place-items-center">
              <Printer size={20} />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base text-ink dark:text-stone-100">
                Buku Panduan Pernikahan (Master Guidebook)
              </h3>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                Kompilasi lengkap seluruh jadwal acara (rundown), daftar penanggung jawab (PIC), kontak vendor utama, dan pedoman keluarga dalam format siap cetak.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={Download}
              onClick={handleDownloadMasterGuidebook}
            >
              Unduh Buku Panduan (.md / Print)
            </Button>
          </Card>

          <Card className="space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 grid place-items-center">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base text-ink dark:text-stone-100">
                Lembar Kerja Tamu Undangan (CSV)
              </h3>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                Daftar seluruh tamu undangan lengkap dengan nomor meja, asal pihak mempelai, konfirmasi RSVP, dan log pencatatan check-in pada hari-H.
              </p>
            </div>
            <Button
              variant="neutral"
              size="sm"
              icon={Download}
              onClick={handleExportGuests}
            >
              Unduh CSV Tamu
            </Button>
          </Card>
        </div>
      )}
    </Page>
  );
}
