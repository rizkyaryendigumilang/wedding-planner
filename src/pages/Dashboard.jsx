import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  Heart,
  Users,
  Wallet,
  CalendarClock,
  CheckCircle2,
  ArrowUpRight,
  Wallet2,
  Gift,
  FileCheck2,
  TrendingDown,
  CircleDollarSign,
} from "lucide-react";
import Countdown from "../components/Countdown";
import {
  Page,
  Card,
  StatCard,
  ProgressBar,
  Loading,
  ErrorState,
  Badge,
} from "../components/ui";
import { useWedding } from "../lib/weddingData";
import { formatRupiah, formatDateId, pct, formatCompact } from "../lib/format";

export default function Dashboard() {
  const {
    couple,
    loading,
    error,
    logs,
    finance,
    guestSummary,
    vendorSummary,
    adminSummary,
    budgetSummary,
    seserahanSummary,
  } = useWedding();

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;
  if (!couple) {
    return (
      <Card className="text-center py-16">
        <p className="text-gray-500">Belum ada data pasangan. Jalankan <code>node seed.js</code>.</p>
      </Card>
    );
  }

  const weddingDate = couple.wedding_date || "2028-02-17";
  const coupleName = `${couple.cpp_nickname || "CPP"} & ${couple.cpw_nickname || "CPW"}`;
  const savedPct = pct(finance.balance, finance.targetBudget);
  const spendPct = pct(finance.expense, finance.income || 1);

  return (
    <Page>
      {/* Hero: sapaan + countdown */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-primary via-violet-500 to-fuchsia-500 text-white shadow-lg shadow-primary/20"
      >
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute -right-4 top-24 w-24 h-24 rounded-full bg-white/10" />
        <div className="relative space-y-5">
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <Heart size={15} /> Undangan pernikahan
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{coupleName}</h1>
            <p className="text-white/80 mt-1">
              {formatDateId(weddingDate)}
              {couple.venue ? ` • ${couple.venue}` : ""}
            </p>
          </div>
          <Countdown target={weddingDate} />
        </div>
      </motion.div>

      {/* Kartu ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Kesehatan Anggaran"
          value={formatRupiah(finance.remainingTarget)}
          sub={`sisa dari target ${formatCompact(finance.targetBudget)}`}
          icon={Wallet}
          tone="primary"
          delay={0}
        />
        <StatCard
          label="Saldo Kas Saat Ini"
          value={formatRupiah(finance.balance)}
          sub={`dari pemasukan ${formatCompact(finance.income)}`}
          icon={CircleDollarSign}
          tone="green"
          delay={0.05}
        />
        <StatCard
          label="Total Tamu Undangan"
          value={guestSummary.total}
          sub={`${guestSummary.totalPax} pax • ${guestSummary.digital} digital`}
          icon={Users}
          tone="blue"
          delay={0.1}
        />
        <StatCard
          label="Tugas Hari H"
          value={`${vendorSummary.done}/${vendorSummary.total}`}
          sub={`${vendorSummary.remaining} item belum selesai`}
          icon={CalendarClock}
          tone="amber"
          delay={0.15}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Kesehatan target tabungan */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Wallet size={18} className="text-primary" /> Progres Target Tabungan
            </h3>
            <Badge tone={savedPct >= 100 ? "green" : "purple"}>{savedPct.toFixed(1)}%</Badge>
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Terkumpul dari target</span>
                <span className="font-semibold">{formatRupiah(finance.balance)}</span>
              </div>
              <ProgressBar value={savedPct} tone="bg-emerald-500" height="h-3" />
              <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                <span>Rp 0</span>
                <span>Target {formatRupiah(finance.targetBudget)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <div>
                <p className="text-xs text-gray-400">Masih harus ditabung</p>
                <p className="font-bold text-lg text-primary">{formatRupiah(finance.remainingTarget)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Pemasukan CPP</p>
                <p className="font-bold text-lg">{formatRupiah(finance.incomeCpp)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Pemasukan CPW</p>
                <p className="font-bold text-lg">{formatRupiah(finance.incomeCpw)}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-500 flex items-center gap-1.5">
                  <TrendingDown size={14} /> Pengeluaran persiapan
                </span>
                <span className="font-semibold text-rose-500">{formatRupiah(finance.expense)}</span>
              </div>
              <ProgressBar value={spendPct} tone="bg-rose-400" />
            </div>
          </div>
        </Card>

        {/* Ringkasan status modul */}
        <Card>
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Activity size={18} className="text-primary" /> Ringkasan Persiapan
          </h3>
          <div className="space-y-4">
            <ModuleRow
              to="/budget"
              icon={Wallet2}
              label="Budget & Termin"
              value={`${formatRupiah(budgetSummary.paid)} / ${formatCompact(budgetSummary.total)}`}
              progress={pct(budgetSummary.paid, budgetSummary.total)}
            />
            <ModuleRow
              to="/administration"
              icon={FileCheck2}
              label="Administrasi & Dokumen"
              value={`${adminSummary.done}/${adminSummary.total} selesai`}
              progress={pct(adminSummary.done, adminSummary.total)}
              tone="bg-sky-500"
            />
            <ModuleRow
              to="/vendors"
              icon={CheckCircle2}
              label="Vendor & Checklist"
              value={`${vendorSummary.done}/${vendorSummary.total} selesai`}
              progress={pct(vendorSummary.done, vendorSummary.total)}
              tone="bg-amber-500"
            />
            <ModuleRow
              to="/seserahan"
              icon={Gift}
              label="Seserahan"
              value={`${seserahanSummary.done}/${seserahanSummary.total} item`}
              progress={pct(seserahanSummary.done, seserahanSummary.total)}
              tone="bg-fuchsia-500"
            />
          </div>
        </Card>
      </div>

      {/* Audit aktivitas */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Activity size={18} className="text-primary" /> Audit Aktivitas
          </h3>
          <span className="text-xs text-gray-400">{logs.length} aktivitas</span>
        </div>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">Belum ada aktivitas tercatat.</p>
        ) : (
          <ul className="space-y-1">
            {logs.slice(0, 8).map((log) => (
              <li key={log.id} className="flex gap-4 items-start py-2.5">
                <div
                  className={`w-2 h-2 mt-2 rounded-full shrink-0 ${
                    log.action_type === "payment"
                      ? "bg-rose-400"
                      : log.action_type === "guest"
                      ? "bg-sky-400"
                      : "bg-primary"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{log.action_description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(log.created).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                    {Number(log.amount) > 0 && ` • ${formatRupiah(log.amount)}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Page>
  );
}

function ModuleRow({ to, icon: Icon, label, value, progress, tone = "bg-primary" }) {
  return (
    <Link to={to} className="block group">
      <div className="flex items-center gap-3 mb-1.5">
        <Icon size={16} className="text-gray-400" />
        <span className="text-sm flex-1 group-hover:text-primary transition-colors">{label}</span>
        <ArrowUpRight size={14} className="text-gray-300 group-hover:text-primary" />
      </div>
      <ProgressBar value={progress} tone={tone} height="h-1.5" />
      <p className="text-xs text-gray-400 mt-1">{value}</p>
    </Link>
  );
}
