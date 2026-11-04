import { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Wallet,
  Plus,
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  Pencil,
  Check,
  X,
  Trash2,
  Landmark,
  PiggyBank,
  Download,
  Printer,
} from "lucide-react";
import {
  Page,
  PageHeader,
  Card,
  StatCard,
  ProgressBar,
  Loading,
  ErrorState,
  Badge,
  Table,
  EmptyState,
  SectionTitle,
  Button,
  Field,
  Input,
  Select,
  MoneyInput,
} from "../components/ui";
import { DatePicker } from "../components/DatePicker";
import { useWedding } from "../lib/weddingData";
import pb from "../lib/pocketbase";
import { formatRupiah, formatDateShort, pct, formatCompact } from "../lib/format";
import { exportToCsv, printReport } from "../lib/export";
import { toast } from "sonner";
import { DEFAULT_BUDGET_CATEGORIES } from "../lib/masterData";

const EASE = [0.22, 1, 0.36, 1];

const TABS = [
  { id: "cashflow", label: "Arus kas" },
  { id: "sangjit", label: "Sangjit" },
  { id: "wedding", label: "Pernikahan" },
];

export default function Budget() {
  const { budgets, cashflow, finance, loading, error, couple, settings, addLog, reload, moveToTrash } =
    useWedding();
  const [tab, setTab] = useState("cashflow");
  const reduce = useReducedMotion();

  const budgetCategories = useMemo(() => {
    return settings?.custom_budget_categories?.length
      ? settings.custom_budget_categories
      : DEFAULT_BUDGET_CATEGORIES;
  }, [settings?.custom_budget_categories]);

  if (loading) return <Loading label="Memuat anggaran…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const sangjit = budgets.filter((b) => b.budget_type === "sangjit");
  const wedding = budgets.filter((b) => b.budget_type === "wedding");
  const savedPct = pct(finance.balance, finance.targetBudget);

  const handleExportCsv = () => {
    if (tab === "cashflow") {
      if (cashflow.length === 0) return;
      const data = cashflow.map((e, idx) => ({
        No: idx + 1,
        Tanggal: e.entry_date || "-",
        Keterangan: e.description,
        Pihak: e.owner || "Bersama",
        Jenis: e.kind === "income" ? "Pemasukan" : "Pengeluaran",
        "Nominal (Rp)": Number(e.amount) || 0,
      }));
      exportToCsv("rekap-arus-kas-pernikahan.csv", data);
    } else {
      const targetItems = tab === "sangjit" ? sangjit : wedding;
      if (targetItems.length === 0) return;
      const data = targetItems.map((b, idx) => {
        const paid = Number(b.termin1 || 0) + Number(b.termin2 || 0) + Number(b.termin3 || 0) + Number(b.termin4 || 0);
        return {
          No: idx + 1,
          Tipe: b.budget_type,
          Kategori: b.category,
          "Pos Pengeluaran": b.detail,
          Vendor: b.vendor || "-",
          "Total Biaya (Rp)": Number(b.total_biaya) || 0,
          "Termin 1 (Rp)": Number(b.termin1) || 0,
          "Termin 2 (Rp)": Number(b.termin2) || 0,
          "Termin 3 (Rp)": Number(b.termin3) || 0,
          "Termin 4 (Rp)": Number(b.termin4) || 0,
          "Total Terbayar (Rp)": paid,
          "Sisa Tagihan (Rp)": Math.max(0, (Number(b.total_biaya) || 0) - paid),
          Status: b.status || (paid >= (Number(b.total_biaya) || 0) ? "Lunas" : "Belum"),
        };
      });
      exportToCsv(`rekap-anggaran-${tab}.csv`, data);
    }
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Keuangan"
        title="Anggaran & arus kas"
        subtitle="Rincian biaya pertunangan, pernikahan, dan arus kas persiapan."
        icon={Wallet}
        action={
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              icon={Download}
              onClick={handleExportCsv}
              className="hidden sm:inline-flex"
            >
              Unduh CSV
            </Button>
            <Button
              variant="outline"
              icon={Printer}
              onClick={printReport}
              className="hidden sm:inline-flex"
            >
              Cetak PDF
            </Button>
          </div>
        }
      />

      {/* Ringkasan arus kas */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total pemasukan"
          value={formatRupiah(finance.income)}
          sub={`CPP ${formatCompact(finance.incomeCpp)} • CPW ${formatCompact(finance.incomeCpw)}`}
          icon={TrendingUp}
          tone="sage"
          delay={0}
        />
        <StatCard
          label="Total pengeluaran"
          value={formatRupiah(finance.expense)}
          sub={`CPP ${formatCompact(finance.expenseCpp)} • CPW ${formatCompact(finance.expenseCpw)}`}
          icon={TrendingDown}
          tone="rose"
          delay={0.05}
        />
        <StatCard
          label="Saldo kas"
          value={formatRupiah(finance.balance)}
          sub="pemasukan − pengeluaran"
          icon={CircleDollarSign}
          tone="sky"
          delay={0.1}
        />
        <StatCard
          label="Sisa target tabungan"
          value={formatRupiah(finance.remainingTarget)}
          sub={`target ${formatCompact(finance.targetBudget)}`}
          icon={PiggyBank}
          tone="amber"
          delay={0.15}
        />
      </section>

      {/* Progres target */}
      <Card>
        <SectionTitle
          action={<Badge tone="sage">{savedPct.toFixed(1)}% tercapai</Badge>}
        >
          <span className="inline-flex items-center gap-2">
            <Landmark size={16} className="text-ink-faint" />
            Target tabungan pernikahan
          </span>
        </SectionTitle>

        <div className="mt-4">
          <ProgressBar value={savedPct} tone="bg-sage-500" height="h-2.5" />
        </div>

        <div className="flex flex-wrap justify-between gap-4 mt-4">
          <TargetStat label="Terkumpul" value={formatRupiah(finance.balance)} />
          <TargetStat label="Target" value={formatRupiah(finance.targetBudget)} />
          <TargetStat
            label="Kurang"
            value={formatRupiah(finance.remainingTarget)}
            tone="text-rose-600 dark:text-rose-300"
          />
        </div>
      </Card>

      {/* Tab Navigasi dengan Indikator Gerak Meluncur (Sorvo Motion Architecture) */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-0.5">
        {TABS.map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative shrink-0 px-4 py-2 rounded-2xl text-[13px] font-medium transition-colors duration-200 focus-ring ${
                isActive
                  ? "text-rose-700 dark:text-rose-300 font-semibold"
                  : "text-ink-muted hover:text-ink dark:hover:text-stone-100 hover:bg-canvas-sunken/60 dark:hover:bg-night-sunken/60"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="budget-tab-active"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/25 pointer-events-none"
                />
              )}
              <span className="relative z-10">{t.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? false : { opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: EASE }}
          className="space-y-6"
        >
          {tab === "cashflow" && (
            <CashflowSection
              entries={cashflow}
              coupleId={couple?.id}
              onChanged={reload}
              addLog={addLog}
              moveToTrash={moveToTrash}
            />
          )}
          {tab === "sangjit" && (
            <BudgetTable
              title="Anggaran sangjit"
              items={sangjit}
              coupleId={couple?.id}
              type="sangjit"
              onChanged={reload}
              addLog={addLog}
              moveToTrash={moveToTrash}
              categories={budgetCategories}
            />
          )}
          {tab === "wedding" && (
            <BudgetTable
              title="Anggaran pernikahan"
              items={wedding}
              coupleId={couple?.id}
              type="wedding"
              onChanged={reload}
              addLog={addLog}
              moveToTrash={moveToTrash}
              categories={budgetCategories}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </Page>
  );
}

/* ========================================================================== */

function TargetStat({ label, value, tone = "" }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">{label}</p>
      <p className={`text-sm font-semibold mt-1 tabular-nums ${tone || "text-ink dark:text-stone-100"}`}>
        {value}
      </p>
    </div>
  );
}

/* ============================== ARUS KAS ============================== */

function CashflowSection({ entries, coupleId, onChanged, addLog, moveToTrash }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    description: "",
    kind: "expense",
    owner: "Bersama",
    amount: 0,
    entry_date: new Date().toISOString().slice(0, 10),
  });

  const reduce = useReducedMotion();

  const totals = useMemo(
    () => ({
      income: entries
        .filter((e) => e.kind === "income")
        .reduce((s, e) => s + Number(e.amount || 0), 0),
      expense: entries
        .filter((e) => e.kind === "expense")
        .reduce((s, e) => s + Number(e.amount || 0), 0),
    }),
    [entries]
  );

  const reset = () =>
    setForm((f) => ({ ...f, description: "", amount: 0, entry_date: new Date().toISOString().slice(0, 10) }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.description.trim() || !form.amount) return;
    setSaving(true);
    try {
      await pb.collection("cashflow_entries").create({
        couple: coupleId,
        description: form.description.trim(),
        kind: form.kind,
        owner: form.owner,
        amount: Number(form.amount),
        entry_date: `${form.entry_date} 00:00:00.000Z`,
        sort_order: entries.length + 1,
      });
      await addLog(
        `${form.kind === "income" ? "Pemasukan" : "Pengeluaran"} "${form.description.trim()}" ${formatRupiah(form.amount)} (${form.owner})`,
        form.kind === "income" ? "info" : "payment",
        Number(form.amount)
      );
      toast.success(`Catatan arus kas "${form.description.trim()}" berhasil disimpan`);
      reset();
      setShowForm(false);
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (entry) => {
    if (!confirm(`Pindahkan catatan "${entry.description}" ke Tempat Sampah? Anda dapat memulihkannya kembali dari menu Pengaturan.`)) return;
    if (moveToTrash) {
      await moveToTrash("cashflow_entries", entry, entry.description);
    } else {
      await pb.collection("cashflow_entries").delete(entry.id);
      await addLog(`Catatan arus kas "${entry.description}" dihapus`, "info");
      onChanged();
    }
    toast.info(`"${entry.description}" dipindahkan ke Tempat Sampah`);
  };

  return (
    <Card>
      <SectionTitle
        count={`${entries.length} catatan`}
        action={
          <Button size="sm" icon={Plus} onClick={() => setShowForm((s) => !s)}>
            Tambah
          </Button>
        }
      >
        Arus kas
      </SectionTitle>

      <AnimatePresence initial={false}>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            onSubmit={submit}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5 p-4 rounded-3xl bg-canvas-sunken/60 dark:bg-night-sunken/60">
              <Field label="Keterangan" className="sm:col-span-2">
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="DP Gedung PINDAD"
                  required
                />
              </Field>

              <Field label="Jenis">
                <Select
                  value={form.kind}
                  onChange={(e) => setForm({ ...form, kind: e.target.value })}
                  options={[
                    ["income", "Pemasukan"],
                    ["expense", "Pengeluaran"],
                  ]}
                />
              </Field>

              <Field label="Pihak">
                <Select
                  value={form.owner}
                  onChange={(e) => setForm({ ...form, owner: e.target.value })}
                  options={[
                    ["CPP", "CPP"],
                    ["CPW", "CPW"],
                    ["Bersama", "Bersama"],
                  ]}
                />
              </Field>

              <Field label="Nominal (Rp)">
                <MoneyInput
                  value={form.amount}
                  onValueChange={(v) => setForm({ ...form, amount: v })}
                />
              </Field>

              <Field label="Tanggal">
                <DatePicker
                  value={form.entry_date}
                  onChange={(v) => setForm({ ...form, entry_date: v })}
                />
              </Field>

              <div className="sm:col-span-2 flex items-end gap-2">
                <Button type="submit" loading={saving} icon={Check}>
                  Simpan
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Batal
                </Button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {entries.length === 0 ? (
        <EmptyState
          icon={CircleDollarSign}
          message="Belum ada catatan arus kas."
          hint="Catat pemasukan dan pengeluaran agar saldo kas terhitung otomatis."
        />
      ) : (
        <div className="mt-5">
          {/* Tampilan Desktop: Tabel Lengkap */}
          <div className="hidden sm:block">
            <Table head={["Tanggal", "Keterangan", "Pihak", "Pemasukan", "Pengeluaran", ""]}>
              {entries.map((e, i) => (
                <motion.tr
                  key={e.id}
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.025, 0.3), duration: 0.25, ease: EASE }}
                  className="group hover:bg-canvas-sunken/50 dark:hover:bg-night-sunken/50 transition-colors"
                >
                  <td className="py-3 px-3 first:pl-0 text-ink-muted whitespace-nowrap tabular-nums">
                    {formatDateShort(e.entry_date)}
                  </td>
                  <td className="py-3 px-3 font-medium">{e.description}</td>
                  <td className="py-3 px-3">
                    <Badge tone={e.owner === "CPP" ? "sky" : e.owner === "CPW" ? "plum" : "gray"}>
                      {e.owner}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 font-medium text-sage-600 dark:text-sage-300 tabular-nums">
                    {e.kind === "income" ? formatRupiah(e.amount) : <span className="text-ink-faint">—</span>}
                  </td>
                  <td className="py-3 px-3 font-medium text-rose-600 dark:text-rose-300 tabular-nums">
                    {e.kind === "expense" ? formatRupiah(e.amount) : <span className="text-ink-faint">—</span>}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => remove(e)}
                      aria-label={`Hapus ${e.description}`}
                      className="p-2 rounded-xl text-ink-faint opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </motion.tr>
              ))}

              <tr className="font-semibold">
                <td className="py-3.5 px-3 first:pl-0" colSpan={3}>
                  Total
                </td>
                <td className="py-3.5 px-3 text-sage-600 dark:text-sage-300 tabular-nums">
                  {formatRupiah(totals.income)}
                </td>
                <td className="py-3.5 px-3 text-rose-600 dark:text-rose-300 tabular-nums">
                  {formatRupiah(totals.expense)}
                </td>
                <td />
              </tr>
            </Table>
          </div>

          {/* Tampilan Mobile: Stacked Cards Ramah Layar Sentuh */}
          <div className="sm:hidden space-y-3">
            {entries.map((e, i) => (
              <motion.div
                key={e.id}
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.25), duration: 0.2, ease: EASE }}
                className="p-3.5 rounded-2xl border border-line dark:border-night-line bg-canvas-card dark:bg-night-card shadow-xs"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ink-faint font-mono tabular-nums">
                      {formatDateShort(e.entry_date)}
                    </span>
                    <Badge tone={e.owner === "CPP" ? "sky" : e.owner === "CPW" ? "plum" : "gray"}>
                      {e.owner}
                    </Badge>
                  </div>
                  <button
                    onClick={() => remove(e)}
                    aria-label={`Hapus ${e.description}`}
                    className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-ink-faint hover:text-rose-600 hover:bg-rose-500/10 transition-colors focus-ring"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="flex items-end justify-between gap-2 mt-2">
                  <p className="font-medium text-sm text-ink dark:text-stone-100 leading-snug">
                    {e.description}
                  </p>
                  <p
                    className={`font-semibold text-sm tabular-nums whitespace-nowrap ${
                      e.kind === "income"
                        ? "text-sage-600 dark:text-sage-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {e.kind === "income" ? `+${formatRupiah(e.amount)}` : `-${formatRupiah(e.amount)}`}
                  </p>
                </div>
              </motion.div>
            ))}

            {/* Mobile Summary Card */}
            <div className="p-3.5 rounded-2xl bg-canvas-sunken/60 dark:bg-night-sunken/60 border border-line/60 dark:border-night-line/60 text-xs space-y-1.5">
              <div className="flex justify-between items-center text-ink-muted">
                <span>Total Pemasukan</span>
                <span className="font-semibold text-sage-600 dark:text-sage-400 tabular-nums">
                  {formatRupiah(totals.income)}
                </span>
              </div>
              <div className="flex justify-between items-center text-ink-muted">
                <span>Total Pengeluaran</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                  {formatRupiah(totals.expense)}
                </span>
              </div>
              <div className="pt-1.5 border-t border-line/80 dark:border-night-line/80 flex justify-between items-center font-bold text-ink dark:text-stone-100">
                <span>Saldo Bersih</span>
                <span className={`tabular-nums ${totals.income >= totals.expense ? "text-sage-600 dark:text-sage-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {formatRupiah(totals.income - totals.expense)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ============================== ANGGARAN ============================== */

function BudgetTable({
  title,
  items,
  coupleId,
  type,
  onChanged,
  addLog,
  moveToTrash,
  categories = DEFAULT_BUDGET_CATEGORIES,
}) {
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({});
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({
    category: "VENUE",
    detail: "",
    vendor: "",
    total_biaya: 0,
  });

  const reduce = useReducedMotion();

  const totalSum = items.reduce((s, b) => s + Number(b.total_biaya || 0), 0);
  const paidSum = items.reduce(
    (s, b) => s + Number(b.termin1 || 0) + Number(b.termin2 || 0) + Number(b.termin3 || 0) + Number(b.termin4 || 0),
    0
  );

  // Kelompokkan per kategori, urutkan agar urutannya stabil antar-render.
  const groups = useMemo(() => {
    const map = new Map();
    for (const it of items) {
      const key = it.category || "LAIN-LAIN";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(it);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  const saveTermin = async (item) => {
    const payload = {
      termin1: Number(draft.termin1) || 0,
      termin2: Number(draft.termin2) || 0,
      termin3: Number(draft.termin3) || 0,
      termin4: Number(draft.termin4) || 0,
      vendor: draft.vendor || "",
      status: draft.status || item.status,
    };
    const newPaid = payload.termin1 + payload.termin2 + payload.termin3 + payload.termin4;
    await pb.collection("budgets").update(item.id, payload);
    await addLog(`Pembayaran "${item.detail}" diperbarui (${formatRupiah(newPaid)})`, "payment", newPaid);
    toast.success(`Pembayaran "${item.detail}" berhasil diperbarui (${formatRupiah(newPaid)})`);
    setEditing(null);
    onChanged();
  };

  const removeItem = async (item) => {
    if (!confirm(`Pindahkan "${item.detail}" ke Tempat Sampah? Anda dapat memulihkannya kembali dari menu Pengaturan.`)) return;
    if (moveToTrash) {
      await moveToTrash("budgets", item, item.detail);
    } else {
      await pb.collection("budgets").delete(item.id);
      onChanged();
    }
    toast.info(`"${item.detail}" dipindahkan ke Tempat Sampah`);
  };

  const startEdit = (item) => {
    setEditing(item.id);
    setDraft({
      vendor: item.vendor,
      status: item.status,
      termin1: item.termin1,
      termin2: item.termin2,
      termin3: item.termin3,
      termin4: item.termin4,
    });
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!newItem.detail.trim()) return;
    await pb.collection("budgets").create({
      couple: coupleId,
      budget_type: type,
      category: newItem.category.trim() || "LAIN-LAIN",
      detail: newItem.detail.trim(),
      vendor: newItem.vendor.trim(),
      status: "Choose Vendor",
      total_biaya: Number(newItem.total_biaya) || 0,
    });
    await addLog(`Item anggaran baru: "${newItem.detail.trim()}"`, "info", Number(newItem.total_biaya) || 0);
    toast.success(`Item "${newItem.detail.trim()}" berhasil ditambahkan ke anggaran`);
    setNewItem({ category: newItem.category, detail: "", vendor: "", total_biaya: 0 });
    setAdding(false);
    onChanged();
  };

  return (
    <Card>
      <SectionTitle
        count={`${items.length} item`}
        action={
          <Button size="sm" icon={Plus} onClick={() => setAdding((s) => !s)}>
            Item
          </Button>
        }
      >
        {title}
      </SectionTitle>

      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
        <TargetStat label="Total" value={formatRupiah(totalSum)} />
        <TargetStat
          label="Sudah dibayar"
          value={formatRupiah(paidSum)}
          tone="text-sage-600 dark:text-sage-300"
        />
        <TargetStat
          label="Sisa"
          value={formatRupiah(Math.max(totalSum - paidSum, 0))}
          tone="text-rose-600 dark:text-rose-300"
        />
      </div>

      <AnimatePresence initial={false}>
        {adding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            onSubmit={addItem}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5 p-4 rounded-3xl bg-canvas-sunken/60 dark:bg-night-sunken/60">
              <Field label="Kategori" hint="Pilih atau ketik kategori">
                <Input
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  list="budget-categories-list"
                  placeholder="VENUE & KATERING"
                />
                <datalist id="budget-categories-list">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>
              <Field label="Detail">
                <Input
                  value={newItem.detail}
                  onChange={(e) => setNewItem({ ...newItem, detail: e.target.value })}
                  placeholder="Gedung"
                  required
                />
              </Field>
              <Field label="Vendor">
                <Input
                  value={newItem.vendor}
                  onChange={(e) => setNewItem({ ...newItem, vendor: e.target.value })}
                  placeholder="Nama vendor"
                />
              </Field>
              <Field label="Total biaya">
                <MoneyInput
                  value={newItem.total_biaya}
                  onValueChange={(v) => setNewItem({ ...newItem, total_biaya: v })}
                />
              </Field>
              <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-2">
                <Button type="submit" size="sm" icon={Check}>
                  Simpan
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
                  Batal
                </Button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="mt-5 space-y-6">
        {groups.length === 0 && (
          <EmptyState icon={Wallet} message="Belum ada item anggaran di kategori ini." />
        )}

        {groups.map(([category, rows]) => (
          <div key={category}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-600 dark:text-rose-300 mb-2">
              {category}
            </p>

            {/* Tampilan Desktop: Tabel Lengkap */}
            <div className="hidden md:block">
              <Table
                head={["Detail", "Vendor", "Total", "Termin 1", "Termin 2", "Termin 3", "Termin 4", "Status", ""]}
              >
                {rows.map((item, i) => {
                  const isEdit = editing === item.id;
                  const paid =
                    Number(item.termin1 || 0) +
                    Number(item.termin2 || 0) +
                    Number(item.termin3 || 0) +
                    Number(item.termin4 || 0);
                  const lunas = item.total_biaya > 0 && paid >= item.total_biaya;

                  return (
                    <motion.tr
                      key={item.id}
                      initial={reduce ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.025, 0.25), duration: 0.25, ease: EASE }}
                      className="group hover:bg-canvas-sunken/50 dark:hover:bg-night-sunken/50 transition-colors"
                    >
                      <td className="py-3 px-3 first:pl-0 font-medium">{item.detail}</td>
                      <td className="py-3 px-3 text-ink-muted">
                        {isEdit ? (
                          <Input
                            value={draft.vendor || ""}
                            onChange={(e) => setDraft({ ...draft, vendor: e.target.value })}
                            className="!w-32 !py-1.5 !rounded-xl !text-[13px]"
                          />
                        ) : (
                          item.vendor || <span className="text-ink-faint">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap tabular-nums">
                        {item.total_biaya ? (
                          formatRupiah(item.total_biaya)
                        ) : (
                          <span className="text-ink-faint">—</span>
                        )}
                      </td>

                      {[1, 2, 3, 4].map((t) => {
                        const key = `termin${t}`;
                        return (
                          <td key={key} className="py-3 px-3 whitespace-nowrap tabular-nums">
                            {isEdit ? (
                              <input
                                type="number"
                                value={draft[key] ?? 0}
                                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                                className="w-24 px-2 py-1.5 rounded-xl border border-line dark:border-night-line bg-canvas-card dark:bg-night-card text-[13px] tabular-nums outline-none focus:border-rose-400"
                              />
                            ) : Number(item[key]) ? (
                              <span className="text-sage-600 dark:text-sage-300 font-medium">
                                {formatRupiah(item[key])}
                              </span>
                            ) : (
                              <span className="text-ink-faint">—</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="py-3 px-3">
                        {lunas ? (
                          <Badge tone="sage">Lunas</Badge>
                        ) : paid > 0 ? (
                          <Badge tone="amber">Dicicil {pct(paid, item.total_biaya).toFixed(0)}%</Badge>
                        ) : (
                          <Badge tone="gray">{item.status || "Belum"}</Badge>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {isEdit ? (
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => saveTermin(item)}
                              aria-label="Simpan"
                              className="p-2 rounded-xl text-sage-600 hover:bg-sage-500/10 transition-colors"
                            >
                              <Check size={15} />
                            </button>
                            <button
                              onClick={() => setEditing(null)}
                              aria-label="Batal"
                              className="p-2 rounded-xl text-ink-faint hover:bg-canvas-sunken dark:hover:bg-night-sunken transition-colors"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEdit(item)}
                              aria-label={`Ubah ${item.detail}`}
                              className="p-2 rounded-xl text-ink-faint hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => removeItem(item)}
                              aria-label={`Hapus ${item.detail}`}
                              className="p-2 rounded-xl text-ink-faint hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </Table>
            </div>

            {/* Tampilan Mobile: Stacked Cards Ramah Layar Sentuh */}
            <div className="md:hidden space-y-3 mb-4">
              {rows.map((item, i) => {
                const isEdit = editing === item.id;
                const paid =
                  Number(item.termin1 || 0) +
                  Number(item.termin2 || 0) +
                  Number(item.termin3 || 0) +
                  Number(item.termin4 || 0);
                const lunas = item.total_biaya > 0 && paid >= item.total_biaya;

                if (isEdit) {
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl border-2 border-rose-400 bg-canvas-card dark:bg-night-card shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm text-ink dark:text-stone-100">
                          Edit: {item.detail}
                        </p>
                        <Badge tone="gray">Edit Mode</Badge>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div>
                          <label className="text-[11px] text-ink-muted mb-1 block">Vendor</label>
                          <Input
                            value={draft.vendor || ""}
                            onChange={(e) => setDraft({ ...draft, vendor: e.target.value })}
                            placeholder="Nama vendor"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[1, 2, 3, 4].map((t) => (
                            <div key={t}>
                              <label className="text-[11px] text-ink-muted mb-1 block">Termin {t} (Rp)</label>
                              <input
                                type="number"
                                value={draft[`termin${t}`] ?? 0}
                                onChange={(e) => setDraft({ ...draft, [`termin${t}`]: e.target.value })}
                                className="w-full px-2.5 py-1.5 rounded-xl border border-line dark:border-night-line bg-canvas-sunken dark:bg-night-sunken text-xs tabular-nums outline-none focus:border-rose-400"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-line dark:border-night-line">
                        <Button size="sm" icon={Check} onClick={() => saveTermin(item)}>
                          Simpan
                        </Button>
                        <Button size="sm" variant="ghost" icon={X} onClick={() => setEditing(null)}>
                          Batal
                        </Button>
                      </div>
                    </div>
                  );
                }

                return (
                  <motion.div
                    key={item.id}
                    initial={reduce ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.25), duration: 0.2, ease: EASE }}
                    className="p-4 rounded-2xl border border-line dark:border-night-line bg-canvas-card dark:bg-night-card shadow-xs space-y-2.5"
                  >
                    {/* Baris 1: Detail & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-sm text-ink dark:text-stone-100 leading-snug">
                          {item.detail}
                        </h4>
                        <p className="text-xs text-ink-muted mt-0.5">
                          {item.vendor ? `Vendor: ${item.vendor}` : "Belum ada vendor"}
                        </p>
                      </div>
                      {lunas ? (
                        <Badge tone="sage">Lunas</Badge>
                      ) : paid > 0 ? (
                        <Badge tone="amber">Dicicil {pct(paid, item.total_biaya).toFixed(0)}%</Badge>
                      ) : (
                        <Badge tone="gray">{item.status || "Belum"}</Badge>
                      )}
                    </div>

                    {/* Baris 2: Progres & Total Biaya */}
                    <div className="pt-1">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-ink-muted">
                          Terbayar: <strong className="text-sage-600 dark:text-sage-400 tabular-nums">{formatRupiah(paid)}</strong>
                        </span>
                        <span className="font-bold text-ink dark:text-stone-100 tabular-nums">
                          {formatRupiah(item.total_biaya)}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-canvas-sunken dark:bg-night-sunken rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sage-500 rounded-full transition-[width] duration-300"
                          style={{ width: `${Math.min(100, pct(paid, item.total_biaya))}%` }}
                        />
                      </div>
                    </div>

                    {/* Baris 3: Termin Chips (4 kolom ringkas) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] pt-1">
                      {[1, 2, 3, 4].map((t) => {
                        const val = Number(item[`termin${t}`] || 0);
                        return (
                          <div
                            key={t}
                            className={`px-2 py-1 rounded-lg border flex items-center justify-between tabular-nums ${
                              val > 0
                                ? "bg-sage-500/10 border-sage-500/30 text-sage-700 dark:text-sage-300 font-medium"
                                : "bg-canvas-sunken/40 dark:bg-night-sunken/40 border-line/40 dark:border-night-line/40 text-ink-faint"
                            }`}
                          >
                            <span>T{t}:</span>
                            <span>{val > 0 ? formatCompact(val) : "—"}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Baris 4: Sisa & Aksi */}
                    <div className="pt-2 border-t border-line/60 dark:border-night-line/60 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-ink-faint text-[10px] block">Sisa Tagihan</span>
                        <span
                          className={`font-semibold tabular-nums text-xs ${
                            item.total_biaya - paid > 0
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-sage-600 dark:text-sage-400"
                          }`}
                        >
                          {formatRupiah(Math.max(0, item.total_biaya - paid))}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          aria-label={`Ubah ${item.detail}`}
                          className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] rounded-xl border border-line dark:border-night-line hover:bg-canvas-sunken dark:hover:bg-night-sunken text-ink text-xs font-medium transition active:scale-[0.97] focus-ring"
                        >
                          <Pencil size={13} className="text-ink-muted" />
                          <span>Ubah Termin</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(item)}
                          aria-label={`Hapus ${item.detail}`}
                          className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-ink-faint hover:text-rose-600 hover:bg-rose-500/10 transition-colors focus-ring"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
