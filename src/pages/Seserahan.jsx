import { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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
  Check,
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
  SectionTitle,
  Button,
  Field,
  Input,
  Select,
  MoneyInput,
} from "../components/ui";
import { useWedding } from "../lib/weddingData";
import pb from "../lib/pocketbase";
import { formatRupiah, pct } from "../lib/format";

const EASE = [0.22, 1, 0.36, 1];

const CATEGORIES = [
  "ALAT SHOLAT",
  "PAKAIAN",
  "ACCESSORIES",
  "HAIR CARE",
  "BODY CARE & TOILETRIES",
  "SKINCARE",
  "MAKEUP",
];

export default function Seserahan() {
  const { seserahan, seserahanSummary, couple, loading, error, reload, addLog, moveToTrash } =
    useWedding();
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    category: CATEGORIES[0],
    detail: "",
    brand: "",
    qty: 1,
    link: "",
    budget: 0,
  });
  const reduce = useReducedMotion();

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
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const toggle = async (item) => {
    await pb.collection("seserahan_items").update(item.id, { checklist: !item.checklist });
    await addLog(
      `Seserahan "${item.detail}" ditandai ${!item.checklist ? "sudah dibeli" : "belum"}`,
      "task"
    );
    reload();
  };

  const remove = async (item) => {
    if (!confirm(`Pindahkan "${item.detail}" ke Tempat Sampah? Anda dapat memulihkannya kembali dari menu Pengaturan.`)) return;
    if (moveToTrash) {
      await moveToTrash("seserahan_items", item, item.detail);
    } else {
      await pb.collection("seserahan_items").delete(item.id);
      await addLog(`Item seserahan "${item.detail}" dihapus`, "task");
      reload();
    }
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!form.detail.trim()) return;
    await pb.collection("seserahan_items").create({
      couple: couple?.id,
      category: form.category,
      detail: form.detail.trim(),
      brand: form.brand.trim(),
      qty: Number(form.qty) || 1,
      link: form.link.trim(),
      budget: Number(form.budget) || 0,
      checklist: false,
    });
    await addLog(`Item seserahan baru: "${form.detail.trim()}"`, "task");
    setForm({ ...form, detail: "", brand: "", link: "", budget: 0 });
    setShowForm(false);
    reload();
  };

  if (loading) return <Loading label="Memuat seserahan…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const categories = [...new Set(seserahan.map((i) => i.category))];
  const donePct = pct(seserahanSummary.done, seserahanSummary.total || 1);
  const overBudget = seserahanSummary.actual > seserahanSummary.budget;

  return (
    <Page>
      <PageHeader
        eyebrow="Prewedding"
        title="Seserahan"
        subtitle="Daftar barang seserahan dengan tautan Shopee, estimasi anggaran, dan harga aktual."
        icon={Gift}
        action={
          <Button size="sm" icon={Plus} onClick={() => setShowForm((s) => !s)}>
            Item
          </Button>
        }
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total item"
          value={seserahanSummary.total}
          sub={`${categories.length} kategori`}
          icon={Gift}
          tone="neutral"
          delay={0}
        />
        <StatCard
          label="Sudah dibeli"
          value={seserahanSummary.done}
          sub={`${donePct.toFixed(0)}% selesai`}
          icon={CheckCircle2}
          tone="sage"
          delay={0.05}
        />
        <StatCard
          label="Estimasi anggaran"
          value={formatRupiah(seserahanSummary.budget)}
          sub="perkiraan pengeluaran"
          icon={Wallet}
          tone="amber"
          delay={0.1}
          compactValue
        />
        <StatCard
          label="Harga aktual"
          value={formatRupiah(seserahanSummary.actual)}
          sub={overBudget ? "melebihi anggaran" : "sudah terealisasi"}
          icon={ShoppingCart}
          tone={overBudget ? "rose" : "sky"}
          delay={0.15}
          compactValue
        />
      </section>

      <Card>
        <SectionTitle
          action={<Badge tone={donePct === 100 ? "sage" : "plum"}>{donePct.toFixed(0)}%</Badge>}
        >
          Progres pembelian
        </SectionTitle>
        <div className="mt-4">
          <ProgressBar value={donePct} tone="bg-brass-400" height="h-2.5" />
        </div>
        <p className="text-xs text-ink-muted mt-3">
          {seserahanSummary.done} dari {seserahanSummary.total} item sudah dibeli.
        </p>
      </Card>

      <AnimatePresence initial={false}>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="overflow-hidden"
          >
            <Card>
              <SectionTitle>Item seserahan baru</SectionTitle>
              <form
                onSubmit={addItem}
                className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
              >
                <Field label="Kategori">
                  <Select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    options={CATEGORIES.map((c) => [c, c])}
                  />
                </Field>

                <Field label="Detail barang">
                  <Input
                    value={form.detail}
                    onChange={(e) => setForm({ ...form, detail: e.target.value })}
                    placeholder="Mukena bordir"
                    required
                  />
                </Field>

                <Field label="Brand">
                  <Input
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    placeholder="Nama brand"
                  />
                </Field>

                <Field label="Jumlah">
                  <Input
                    type="number"
                    min="1"
                    value={form.qty}
                    onChange={(e) => setForm({ ...form, qty: e.target.value })}
                  />
                </Field>

                <Field label="Anggaran">
                  <MoneyInput
                    value={form.budget}
                    onValueChange={(v) => setForm({ ...form, budget: v })}
                  />
                </Field>

                <Field label="Tautan Shopee">
                  <Input
                    type="url"
                    value={form.link}
                    onChange={(e) => setForm({ ...form, link: e.target.value })}
                    placeholder="https://shopee.co.id/…"
                  />
                </Field>

                <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-2">
                  <Button type="submit" size="sm" icon={Check}>
                    Simpan
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                    Batal
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        <Search
          size={17}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari item, brand, atau kategori…"
          className="!pl-11"
          aria-label="Cari seserahan"
        />
      </div>

      {sections.length === 0 ? (
        <Card>
          <EmptyState
            icon={Gift}
            message="Tidak ada item seserahan."
            hint="Tambahkan item atau ubah kata kunci pencarian."
          />
        </Card>
      ) : (
        sections.map(([category, items], sectionIndex) => {
          const done = items.filter((i) => i.checklist).length;
          const budget = items.reduce((s, i) => s + Number(i.budget || 0), 0);
          const actual = items.reduce((s, i) => s + Number(i.actually_harga || 0), 0);

          return (
            <motion.div
              key={category}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(sectionIndex * 0.04, 0.24), duration: 0.35, ease: EASE }}
            >
              <Card>
                <SectionTitle
                  count={`${done}/${items.length} dibeli`}
                  action={
                    <div className="text-right">
                      <p className="text-[11px] text-ink-faint">Anggaran {formatRupiah(budget)}</p>
                      {actual > 0 && (
                        <p
                          className={`text-[11px] font-semibold tabular-nums ${
                            actual > budget ? "text-rose-600 dark:text-rose-300" : "text-sage-600 dark:text-sage-300"
                          }`}
                        >
                          Aktual {formatRupiah(actual)}
                        </p>
                      )}
                    </div>
                  }
                >
                  {category}
                </SectionTitle>

                <ul className="mt-4 -mx-2 divide-y divide-line/70 dark:divide-night-line/70">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className={`group flex flex-wrap items-center gap-3 px-2 py-3 rounded-2xl transition-colors ${
                        item.checklist
                          ? "bg-sage-500/[0.06]"
                          : "hover:bg-canvas-sunken/50 dark:hover:bg-night-sunken/50"
                      }`}
                    >
                      <button
                        onClick={() => toggle(item)}
                        aria-pressed={item.checklist}
                        aria-label={`Tandai "${item.detail}" ${
                          item.checklist ? "belum dibeli" : "sudah dibeli"
                        }`}
                        className="shrink-0 focus-ring rounded-full"
                      >
                        {item.checklist ? (
                          <CheckCircle2 size={21} className="text-sage-500" />
                        ) : (
                          <Circle
                            size={21}
                            className="text-ink-faint group-hover:text-ink-muted transition-colors"
                          />
                        )}
                      </button>

                      <div className="flex-1 min-w-[9rem]">
                        <p
                          className={`text-sm font-medium ${
                            item.checklist ? "line-through text-ink-faint" : ""
                          }`}
                        >
                          {item.detail}
                        </p>
                        <p className="text-xs text-ink-faint mt-0.5">
                          {item.brand || "Tanpa brand"} • qty {item.qty}
                        </p>
                      </div>

                      <div className="text-right min-w-[7rem]">
                        {Number(item.budget) > 0 && (
                          <p className="text-[11px] text-ink-faint tabular-nums">
                            Anggaran {formatRupiah(item.budget)}
                          </p>
                        )}
                        {Number(item.actually_harga) > 0 && (
                          <p className="text-sm font-semibold text-brass-700 dark:text-brass-300 tabular-nums">
                            {formatRupiah(item.actually_harga)}
                          </p>
                        )}
                      </div>

                      {item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brass-400/16 text-brass-700 dark:text-brass-300 text-xs font-semibold hover:bg-brass-400/25 transition-colors shrink-0"
                        >
                          Shopee <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-xs text-ink-faint w-[74px] text-center shrink-0">—</span>
                      )}

                      <button
                        onClick={() => remove(item)}
                        aria-label={`Hapus ${item.detail}`}
                        className="p-2 rounded-xl text-ink-faint opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-rose-600 hover:bg-rose-500/10 transition-all shrink-0"
                      >
                        <Trash2 size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          );
        })
      )}
    </Page>
  );
}
