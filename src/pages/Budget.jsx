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
  Chip,
  Field,
  Input,
  Select,
  MoneyInput,
} from "../components/ui";
import { DatePicker } from "../components/DatePicker";
import { useWedding } from "../lib/weddingData";
import pb from "../lib/pocketbase";
import { formatRupiah, formatDateShort, pct, formatCompact } from "../lib/format";

const EASE = [0.22, 1, 0.36, 1];

const TABS = [
  { id: "cashflow", label: "Arus kas" },
  { id: "sangjit", label: "Sangjit" },
  { id: "wedding", label: "Pernikahan" },
];

export default function Budget() {
  const { budgets, cashflow, finance, loading, error, couple, addLog, reload, moveToTrash } =
    useWedding();
  const [tab, setTab] = useState("cashflow");

  if (loading) return <Loading label="Memuat anggaran…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const sangjit = budgets.filter((b) => b.budget_type === "sangjit");
  const wedding = budgets.filter((b) => b.budget_type === "wedding");
  const savedPct = pct(finance.balance, finance.targetBudget);

  return (
    <Page>
      <PageHeader
        eyebrow="Keuangan"
        title="Anggaran & arus kas"
        subtitle="Rincian biaya pertunangan, pernikahan, dan arus kas persiapan."
        icon={Wallet}
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

      {/* Tab */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-0.5">
        {TABS.map((t) => (
          <Chip key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </Chip>
        ))}
      </div>

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
        />
      )}
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

              <Field label="Nominal">
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
                    className="p-2 rounded-xl text-ink-faint opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-rose-600 hover:bg-rose-500/10 transition-all"
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
      )}
    </Card>
  );
}

/* ============================== ANGGARAN ============================== */

function BudgetTable({ title, items, coupleId, type, onChanged, addLog, moveToTrash }) {
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
              <Field label="Kategori">
                <Input
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  placeholder="VENUE"
                />
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
        ))}
      </div>
    </Card>
  );
}
