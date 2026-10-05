import { useState } from "react";
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
} from "../components/ui";
import { useWedding } from "../lib/weddingData";
import pb from "../lib/pocketbase";
import {
  formatRupiah,
  formatDateShort,
  pct,
  formatCompact,
} from "../lib/format";

const TABS = [
  { id: "cashflow", label: "Cashflow" },
  { id: "sangjit", label: "Engagement / Sangjit" },
  { id: "wedding", label: "Wedding Budget" },
];

export default function Budget() {
  const {
    budgets,
    cashflow,
    finance,
    loading,
    error,
    couple,
    addLog,
    reload,
  } = useWedding();
  const [tab, setTab] = useState("cashflow");

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  const sangjit = budgets.filter((b) => b.budget_type === "sangjit");
  const wedding = budgets.filter((b) => b.budget_type === "wedding");

  return (
    <Page>
      <PageHeader
        title="Sangjit & Wedding Budget"
        subtitle="Rincian biaya pertunangan, pernikahan, dan arus kas persiapan."
        icon={Wallet}
      />

      {/* Ringkasan cashflow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Pemasukan"
          value={formatRupiah(finance.income)}
          sub={`CPP ${formatCompact(finance.incomeCpp)} • CPW ${formatCompact(finance.incomeCpw)}`}
          icon={TrendingUp}
          tone="green"
        />
        <StatCard
          label="Total Pengeluaran"
          value={formatRupiah(finance.expense)}
          sub={`CPP ${formatCompact(finance.expenseCpp)} • CPW ${formatCompact(finance.expenseCpw)}`}
          icon={TrendingDown}
          tone="red"
        />
        <StatCard
          label="Saldo Akhir Kas"
          value={formatRupiah(finance.balance)}
          sub="pemasukan − pengeluaran"
          icon={CircleDollarSign}
          tone="blue"
        />
        <StatCard
          label="Sisa Target Tabungan"
          value={formatRupiah(finance.remainingTarget)}
          sub={`target ${formatCompact(finance.targetBudget)}`}
          icon={Wallet}
          tone="amber"
        />
      </div>

      {/* Progress target */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Landmark size={18} className="text-primary" /> Target Tabungan Pernikahan
          </h3>
          <Badge tone="purple">{pct(finance.balance, finance.targetBudget).toFixed(1)}% tercapai</Badge>
        </div>
        <ProgressBar value={pct(finance.balance, finance.targetBudget)} tone="bg-emerald-500" height="h-3" />
        <div className="flex flex-wrap justify-between gap-3 mt-3 text-sm">
          <span className="text-gray-500">
            Terkumpul <b className="text-gray-900 dark:text-white">{formatRupiah(finance.balance)}</b>
          </span>
          <span className="text-gray-500">
            Target <b className="text-gray-900 dark:text-white">{formatRupiah(finance.targetBudget)}</b>
          </span>
          <span className="text-gray-500">
            Kurang <b className="text-primary">{formatRupiah(finance.remainingTarget)}</b>
          </span>
        </div>
      </Card>

      {/* Tab */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.id
                ? "bg-primary text-white"
                : "bg-white dark:bg-darksurface text-gray-500 border border-gray-100 dark:border-gray-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "cashflow" && (
        <CashflowSection
          entries={cashflow}
          coupleId={couple?.id}
          onChanged={reload}
          addLog={addLog}
        />
      )}
      {tab === "sangjit" && (
        <BudgetTable
          title="Engagement Budget (Sangjit)"
          items={sangjit}
          coupleId={couple?.id}
          type="sangjit"
          onChanged={reload}
          addLog={addLog}
        />
      )}
      {tab === "wedding" && (
        <BudgetTable
          title="Wedding Budget"
          items={wedding}
          coupleId={couple?.id}
          type="wedding"
          onChanged={reload}
          addLog={addLog}
        />
      )}
    </Page>
  );
}

/* ============================ CASHFLOW ============================ */
function CashflowSection({ entries, coupleId, onChanged, addLog }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    description: "",
    kind: "income",
    owner: "CPP",
    amount: "",
    entry_date: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.description || !form.amount) return;
    setSaving(true);
    try {
      await pb.collection("cashflow_entries").create({
        couple: coupleId,
        description: form.description,
        kind: form.kind,
        owner: form.owner,
        amount: Number(form.amount),
        entry_date: form.entry_date ? `${form.entry_date} 00:00:00.000Z` : undefined,
        sort_order: entries.length + 1,
      });
      await addLog(
        `${form.kind === "income" ? "Pemasukan" : "Pengeluaran"} "${form.description}" dicatat ${formatRupiah(form.amount)} (${form.owner})`,
        form.kind === "income" ? "info" : "payment",
        Number(form.amount)
      );
      setForm({ ...form, description: "", amount: "" });
      setShowForm(false);
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id, desc) => {
    if (!confirm(`Hapus catatan "${desc}"?`)) return;
    await pb.collection("cashflow_entries").delete(id);
    onChanged();
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Wedding Cashflow</h3>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-primary text-white text-sm font-medium hover:opacity-90"
        >
          <Plus size={16} /> Tambah
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={submit}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50"
        >
          <input
            placeholder="Keterangan (cth: DP Gedung)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="lg:col-span-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-darksurface text-sm"
            required
          />
          <select
            value={form.kind}
            onChange={(e) => setForm({ ...form, kind: e.target.value })}
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-darksurface text-sm"
          >
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
          </select>
          <select
            value={form.owner}
            onChange={(e) => setForm({ ...form, owner: e.target.value })}
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-darksurface text-sm"
          >
            <option value="CPP">CPP</option>
            <option value="CPW">CPW</option>
            <option value="Bersama">Bersama</option>
          </select>
          <input
            type="number"
            placeholder="Nominal (Rp)"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-darksurface text-sm"
            required
          />
          <input
            type="date"
            value={form.entry_date}
            onChange={(e) => setForm({ ...form, entry_date: e.target.value })}
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-darksurface text-sm"
          />
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-60"
          >
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
        </form>
      )}

      {entries.length === 0 ? (
        <EmptyState message="Belum ada catatan arus kas." icon={CircleDollarSign} />
      ) : (
        <Table head={["Tanggal", "Keterangan", "Pihak", "Pemasukan", "Pengeluaran", ""]}>
          {entries.map((e) => (
            <tr key={e.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
              <td className="py-3 px-3 first:pl-0 text-gray-500 whitespace-nowrap">
                {formatDateShort(e.entry_date)}
              </td>
              <td className="py-3 px-3 font-medium">{e.description}</td>
              <td className="py-3 px-3">
                <Badge tone={e.owner === "CPP" ? "blue" : e.owner === "CPW" ? "purple" : "gray"}>
                  {e.owner}
                </Badge>
              </td>
              <td className="py-3 px-3 font-medium text-emerald-600">
                {e.kind === "income" ? formatRupiah(e.amount) : "—"}
              </td>
              <td className="py-3 px-3 font-medium text-rose-500">
                {e.kind === "expense" ? formatRupiah(e.amount) : "—"}
              </td>
              <td className="py-3 px-3 text-right">
                <button
                  onClick={() => remove(e.id, e.description)}
                  className="p-2 rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                >
                  <Trash2 size={15} />
                </button>
              </td>
            </tr>
          ))}
          <tr className="font-bold bg-gray-50/70 dark:bg-gray-800/40">
            <td className="py-3 px-3 first:pl-0" colSpan={3}>TOTAL</td>
            <td className="py-3 px-3 text-emerald-600">
              {formatRupiah(entries.filter((e) => e.kind === "income").reduce((s, e) => s + Number(e.amount), 0))}
            </td>
            <td className="py-3 px-3 text-rose-500">
              {formatRupiah(entries.filter((e) => e.kind === "expense").reduce((s, e) => s + Number(e.amount), 0))}
            </td>
            <td />
          </tr>
        </Table>
      )}
    </Card>
  );
}

/* ========================= BUDGET TABLE ========================= */
function BudgetTable({ title, items, coupleId, type, onChanged, addLog }) {
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({});
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({
    category: "VENUE",
    detail: "",
    vendor: "",
    total_biaya: "",
  });

  const totalSum = items.reduce((s, b) => s + Number(b.total_biaya || 0), 0);
  const paidSum = items.reduce(
    (s, b) =>
      s + b.termin1 + b.termin2 + b.termin3 + b.termin4,
    0
  );

  // group by category
  const groups = items.reduce((acc, it) => {
    const key = it.category || "LAIN-LAIN";
    (acc[key] = acc[key] || []).push(it);
    return acc;
  }, {});

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
    await addLog(
      `Pembayaran "${item.detail}" diperbarui (${formatRupiah(newPaid)})`,
      "payment",
      newPaid
    );
    setEditing(null);
    onChanged();
  };

  const removeItem = async (item) => {
    if (!confirm(`Hapus "${item.detail}"?`)) return;
    await pb.collection("budgets").delete(item.id);
    onChanged();
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!newItem.detail) return;
    await pb.collection("budgets").create({
      couple: coupleId,
      budget_type: type,
      category: newItem.category,
      detail: newItem.detail,
      vendor: newItem.vendor,
      status: "Choose Vendor",
      total_biaya: Number(newItem.total_biaya) || 0,
    });
    await addLog(`Item budget baru: "${newItem.detail}"`, "info", Number(newItem.total_biaya) || 0);
    setNewItem({ category: newItem.category, detail: "", vendor: "", total_biaya: "" });
    setAdding(false);
    onChanged();
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-gray-400">
            Total {formatRupiah(totalSum)} • Sudah dibayar {formatRupiah(paidSum)} • Sisa{" "}
            {formatRupiah(Math.max(totalSum - paidSum, 0))}
          </p>
        </div>
        <button
          onClick={() => setAdding((s) => !s)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-primary text-white text-sm font-medium hover:opacity-90"
        >
          <Plus size={16} /> Item
        </button>
      </div>

      {adding && (
        <form
          onSubmit={addItem}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50"
        >
          <input
            placeholder="Kategori (cth: VENUE)"
            value={newItem.category}
            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-darksurface text-sm"
          />
          <input
            placeholder="Detail (cth: Gedung)"
            value={newItem.detail}
            onChange={(e) => setNewItem({ ...newItem, detail: e.target.value })}
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-darksurface text-sm"
            required
          />
          <input
            placeholder="Vendor"
            value={newItem.vendor}
            onChange={(e) => setNewItem({ ...newItem, vendor: e.target.value })}
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-darksurface text-sm"
          />
          <input
            type="number"
            placeholder="Total biaya"
            value={newItem.total_biaya}
            onChange={(e) => setNewItem({ ...newItem, total_biaya: e.target.value })}
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-darksurface text-sm"
          />
          <button className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium">
            Simpan
          </button>
        </form>
      )}

      <div className="space-y-6">
        {Object.entries(groups).map(([category, rows]) => (
          <div key={category}>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">{category}</p>
            <Table
              head={["Detail", "Vendor", "Total", "Termin 1", "Termin 2", "Termin 3", "Termin 4", "Status", ""]}
            >
              {rows.map((item) => {
                const isEdit = editing === item.id;
                const paid =
                  item.termin1 + item.termin2 + item.termin3 + item.termin4;
                const lunas = item.total_biaya > 0 && paid >= item.total_biaya;
                return (
                  <tr key={item.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                    <td className="py-3 px-3 first:pl-0 font-medium">{item.detail}</td>
                    <td className="py-3 px-3 text-gray-500">
                      {isEdit ? (
                        <input
                          value={draft.vendor}
                          onChange={(e) => setDraft({ ...draft, vendor: e.target.value })}
                          className="w-28 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-darksurface text-sm"
                        />
                      ) : (
                        item.vendor || <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {item.total_biaya ? formatRupiah(item.total_biaya) : <span className="text-gray-300">—</span>}
                    </td>
                    {[1, 2, 3, 4].map((t) => {
                      const key = `termin${t}`;
                      return (
                        <td key={key} className="py-3 px-3 whitespace-nowrap">
                          {isEdit ? (
                            <input
                              type="number"
                              value={draft[key]}
                              onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                              className="w-24 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-darksurface text-sm"
                            />
                          ) : item[key] ? (
                            <span className="text-emerald-600 font-medium">{formatRupiah(item[key])}</span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-3 px-3">
                      {lunas ? (
                        <Badge tone="green">Lunas</Badge>
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
                            className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50"
                          >
                            <Check size={15} />
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => {
                              setEditing(item.id);
                              setDraft({
                                vendor: item.vendor,
                                status: item.status,
                                termin1: item.termin1,
                                termin2: item.termin2,
                                termin3: item.termin3,
                                termin4: item.termin4,
                              });
                            }}
                            className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => removeItem(item)}
                            className="p-2 rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </Table>
          </div>
        ))}
      </div>
    </Card>
  );
}
