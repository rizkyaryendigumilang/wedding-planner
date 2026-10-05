import { useMemo, useState } from "react";
import {
  Gift,
  ExternalLink,
  Plus,
  Trash2,
  Search,
  ShoppingCart,
  CheckCircle2,
  Circle,
  Wallet,
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
  EmptyState,
} from "../components/ui";
import { useWedding } from "../lib/weddingData";
import pb from "../lib/pocketbase";
import { formatRupiah, pct } from "../lib/format";

export default function Seserahan() {
  const { seserahan, seserahanSummary, couple, loading, error, reload, addLog } = useWedding();
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    category: "ALAT SHOLAT",
    detail: "",
    brand: "",
    qty: 1,
    link: "",
    budget: "",
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return seserahan;
    return seserahan.filter((i) =>
      `${i.detail} ${i.brand} ${i.category}`.toLowerCase().includes(q)
    );
  }, [seserahan, query]);

  const sections = useMemo(() => {
    const map = new Map();
    for (const i of filtered) {
      if (!map.has(i.category)) map.set(i.category, []);
      map.get(i.category).push(i);
    }
    return [...map.entries()];
  }, [filtered]);

  const toggle = async (item) => {
    await pb.collection("seserahan_items").update(item.id, { checklist: !item.checklist });
    await addLog(`Seserahan "${item.detail}" ditandai ${!item.checklist ? "sudah dibeli" : "belum"}`, "task");
    reload();
  };

  const remove = async (item) => {
    if (!confirm(`Hapus "${item.detail}"?`)) return;
    await pb.collection("seserahan_items").delete(item.id);
    reload();
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!form.detail) return;
    await pb.collection("seserahan_items").create({
      couple: couple?.id,
      category: form.category,
      detail: form.detail,
      brand: form.brand,
      qty: Number(form.qty) || 1,
      link: form.link,
      budget: Number(form.budget) || 0,
      checklist: false,
    });
    await addLog(`Item seserahan baru: "${form.detail}"`, "task");
    setForm({ ...form, detail: "", brand: "", link: "", budget: "" });
    setShowForm(false);
    reload();
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  const categories = [...new Set(seserahan.map((i) => i.category))];

  return (
    <Page>
      <PageHeader
        title="List Seserahan"
        subtitle="Daftar barang seserahan lengkap dengan link Shopee, estimasi budget, dan harga aktual."
        icon={Gift}
        action={
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-white text-sm font-medium hover:opacity-90"
          >
            <Plus size={16} /> Item
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Item" value={seserahanSummary.total} sub={`${categories.length} kategori`} icon={Gift} tone="primary" />
        <StatCard label="Sudah Dibeli" value={seserahanSummary.done} sub={`${pct(seserahanSummary.done, seserahanSummary.total || 1).toFixed(0)}% selesai`} icon={CheckCircle2} tone="green" />
        <StatCard label="Estimasi Budget" value={formatRupiah(seserahanSummary.budget)} sub="perkiraan pengeluaran" icon={Wallet} tone="amber" />
        <StatCard label="Harga Aktual" value={formatRupiah(seserahanSummary.actual)} sub="sudah terealisasi" icon={ShoppingCart} tone="blue" />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Progres Pembelian</h3>
          <Badge tone="purple">{pct(seserahanSummary.done, seserahanSummary.total || 1).toFixed(0)}%</Badge>
        </div>
        <ProgressBar value={pct(seserahanSummary.done, seserahanSummary.total || 1)} tone="bg-fuchsia-500" height="h-3" />
      </Card>

      {showForm && (
        <Card>
          <form onSubmit={addItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-darksurface text-sm">
              {["ALAT SHOLAT", "PAKAIAN", "ACCESSORIES", "HAIR CARE", "BODY CARE & TOILETRIES", "SKINCARE", "MAKEUP"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input placeholder="Detail barang" value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-darksurface text-sm" required />
            <input placeholder="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-darksurface text-sm" />
            <input type="number" placeholder="Qty" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-darksurface text-sm" />
            <input placeholder="Budget (Rp)" type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-darksurface text-sm" />
            <input placeholder="Link Shopee" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-darksurface text-sm" />
            <button className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium">Simpan Item</button>
          </form>
        </Card>
      )}

      <div className="relative">
        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari item seserahan…" className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-darksurface text-sm" />
      </div>

      {sections.length === 0 ? (
        <Card>
          <EmptyState message="Tidak ada item seserahan." icon={Gift} />
        </Card>
      ) : (
        sections.map(([category, items]) => {
          const done = items.filter((i) => i.checklist).length;
          const budget = items.reduce((s, i) => s + Number(i.budget || 0), 0);
          const actual = items.reduce((s, i) => s + Number(i.actually_harga || 0), 0);
          return (
            <Card key={category}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-semibold">{category}</h3>
                  <p className="text-xs text-gray-400">
                    {items.length} item • {done} sudah dibeli • Budget {formatRupiah(budget)} • Aktual {formatRupiah(actual)}
                  </p>
                </div>
                <Badge tone={done === items.length ? "green" : "amber"}>
                  {done}/{items.length}
                </Badge>
              </div>

              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex flex-wrap items-center gap-3 py-3 px-3 rounded-2xl transition-colors ${
                      item.checklist ? "bg-emerald-50/50 dark:bg-emerald-500/5" : "hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    }`}
                  >
                    <button onClick={() => toggle(item)} className="shrink-0">
                      {item.checklist ? (
                        <CheckCircle2 size={20} className="text-emerald-500" />
                      ) : (
                        <Circle size={20} className="text-gray-300" />
                      )}
                    </button>
                    <div className="flex-1 min-w-[180px]">
                      <p className={`text-sm font-medium ${item.checklist ? "line-through text-gray-400" : ""}`}>
                        {item.detail}
                      </p>
                      <p className="text-xs text-gray-400">
                        {item.brand || "—"} • qty {item.qty}
                      </p>
                    </div>
                    <div className="text-right min-w-[120px]">
                      {item.budget > 0 && (
                        <p className="text-xs text-gray-400">Budget {formatRupiah(item.budget)}</p>
                      )}
                      {item.actually_harga > 0 && (
                        <p className="text-sm font-semibold text-primary">{formatRupiah(item.actually_harga)}</p>
                      )}
                    </div>
                    {item.link ? (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 text-orange-600 text-xs font-medium hover:bg-orange-100 dark:bg-orange-500/10"
                      >
                        Shopee <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-xs text-gray-300 w-[74px] text-center">—</span>
                    )}
                    <button onClick={() => remove(item)} className="p-2 rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 shrink-0">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          );
        })
      )}
    </Page>
  );
}
