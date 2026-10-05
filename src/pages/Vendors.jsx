import { useMemo, useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Plus,
  Trash2,
  Search,
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
import { daysUntil, formatDateShort, pct } from "../lib/format";

/**
 * Warna & label berdasarkan sisa hari menuju deadline.
 */
function deadlineMeta(date) {
  const d = daysUntil(date);
  if (d === null) return { tone: "gray", label: "Tanpa deadline", icon: Clock };
  if (d < 0) return { tone: "red", label: `Lewat ${Math.abs(d)} hari`, icon: AlertTriangle };
  if (d === 0) return { tone: "red", label: "Hari ini!", icon: AlertTriangle };
  if (d <= 7) return { tone: "amber", label: `${d} hari lagi`, icon: AlertTriangle };
  if (d <= 30) return { tone: "blue", label: `${d} hari lagi`, icon: Clock };
  return { tone: "gray", label: `${d} hari lagi`, icon: Clock };
}

export default function Vendors() {
  const { vendors, vendorSummary, couple, loading, error, reload, addLog } = useWedding();
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    category: "Booking Vendor",
    activity_name: "",
    deadline_date: "",
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? vendors.filter(
          (v) =>
            v.activity_name.toLowerCase().includes(q) ||
            v.category.toLowerCase().includes(q)
        )
      : vendors;
    // urutkan: deadline terdekat dulu, yang selesai di bawah
    return [...list].sort((a, b) => {
      if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
      if (!a.deadline_date) return 1;
      if (!b.deadline_date) return -1;
      return new Date(a.deadline_date) - new Date(b.deadline_date);
    });
  }, [vendors, query]);

  const sections = useMemo(() => {
    const map = new Map();
    for (const v of filtered) {
      if (!map.has(v.category)) map.set(v.category, []);
      map.get(v.category).push(v);
    }
    return [...map.entries()];
  }, [filtered]);

  // deadline terdekat yang belum selesai
  const nextDeadline = useMemo(() => {
    const pending = vendors.filter((v) => !v.is_completed && v.deadline_date);
    if (pending.length === 0) return null;
    return pending.sort(
      (a, b) => new Date(a.deadline_date) - new Date(b.deadline_date)
    )[0];
  }, [vendors]);

  const overdue = vendors.filter(
    (v) => !v.is_completed && v.deadline_date && daysUntil(v.deadline_date) < 0
  ).length;

  const toggle = async (item) => {
    await pb.collection("vendor_checklists").update(item.id, {
      is_completed: !item.is_completed,
    });
    await addLog(
      `"${item.activity_name}" ditandai ${!item.is_completed ? "selesai" : "belum selesai"}`,
      "task"
    );
    reload();
  };

  const remove = async (item) => {
    if (!confirm(`Hapus tugas "${item.activity_name}"?`)) return;
    await pb.collection("vendor_checklists").delete(item.id);
    reload();
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!form.activity_name) return;
    await pb.collection("vendor_checklists").create({
      couple: couple?.id,
      category: form.category,
      activity_name: form.activity_name,
      deadline_date: form.deadline_date ? `${form.deadline_date} 00:00:00.000Z` : undefined,
      is_completed: false,
      sort_order: vendors.length + 1,
    });
    await addLog(`Tugas baru: "${form.activity_name}"`, "task");
    setForm({ ...form, activity_name: "", deadline_date: "" });
    setShowForm(false);
    reload();
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  return (
    <Page>
      <PageHeader
        title="Vendor Checklist & Countdown"
        subtitle="Booking vendor, things-to-do, dan hitung mundur setiap tenggat waktu."
        icon={CalendarCheck}
        action={
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-white text-sm font-medium hover:opacity-90"
          >
            <Plus size={16} /> Tugas
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Tugas"
          value={vendorSummary.total}
          sub={`${vendorSummary.remaining} belum selesai`}
          icon={CalendarCheck}
          tone="primary"
        />
        <StatCard
          label="Selesai"
          value={`${vendorSummary.done}`}
          sub={`${pct(vendorSummary.done, vendorSummary.total || 1).toFixed(0)}% progres`}
          icon={CheckCircle2}
          tone="green"
        />
        <StatCard
          label="Deadline Terdekat"
          value={nextDeadline ? `${daysUntil(nextDeadline.deadline_date)} hari` : "—"}
          sub={nextDeadline ? nextDeadline.activity_name : "Semua beres 🎉"}
          icon={Clock}
          tone="amber"
        />
        <StatCard
          label="Lewat Deadline"
          value={overdue}
          sub="perlu perhatian segera"
          icon={AlertTriangle}
          tone="red"
        />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Progres Keseluruhan</h3>
          <Badge tone="purple">{pct(vendorSummary.done, vendorSummary.total || 1).toFixed(0)}%</Badge>
        </div>
        <ProgressBar
          value={pct(vendorSummary.done, vendorSummary.total || 1)}
          tone="bg-amber-500"
          height="h-3"
        />
      </Card>

      {showForm && (
        <Card>
          <form onSubmit={addItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-darksurface text-sm"
            >
              <option>Booking Vendor</option>
              <option>Things To Do</option>
              <option>Administrasi Pernikahan</option>
              <option>Rangkaian Acara</option>
            </select>
            <input
              placeholder="Nama tugas"
              value={form.activity_name}
              onChange={(e) => setForm({ ...form, activity_name: e.target.value })}
              className="lg:col-span-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-darksurface text-sm"
              required
            />
            <input
              type="date"
              value={form.deadline_date}
              onChange={(e) => setForm({ ...form, deadline_date: e.target.value })}
              className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-darksurface text-sm"
            />
            <button className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium">
              Simpan Tugas
            </button>
          </form>
        </Card>
      )}

      <div className="relative">
        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari tugas atau vendor…"
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-darksurface text-sm"
        />
      </div>

      {sections.length === 0 ? (
        <Card>
          <EmptyState message="Tidak ada tugas yang cocok." icon={CalendarCheck} />
        </Card>
      ) : (
        sections.map(([category, items]) => (
          <Card key={category}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{category}</h3>
              <span className="text-xs text-gray-400">
                {items.filter((i) => i.is_completed).length}/{items.length} selesai
              </span>
            </div>
            <div className="space-y-2">
              {items.map((item) => {
                const meta = deadlineMeta(item.deadline_date);
                const Icon = meta.icon;
                return (
                  <div
                    key={item.id}
                    className={`flex flex-wrap items-center gap-3 py-3 px-3 rounded-2xl transition-colors ${
                      item.is_completed
                        ? "bg-emerald-50/50 dark:bg-emerald-500/5"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    }`}
                  >
                    <button onClick={() => toggle(item)} className="shrink-0">
                      {item.is_completed ? (
                        <CheckCircle2 size={20} className="text-emerald-500" />
                      ) : (
                        <Circle size={20} className="text-gray-300" />
                      )}
                    </button>
                    <div className="flex-1 min-w-[180px]">
                      <p
                        className={`text-sm font-medium ${
                          item.is_completed ? "line-through text-gray-400" : ""
                        }`}
                      >
                        {item.activity_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        Deadline {formatDateShort(item.deadline_date)}
                        {item.notes ? ` • ${item.notes}` : ""}
                      </p>
                    </div>
                    {!item.is_completed && (
                      <Badge tone={meta.tone}>
                        <Icon size={12} className="mr-1" /> {meta.label}
                      </Badge>
                    )}
                    {item.is_completed && <Badge tone="green">Selesai</Badge>}
                    <button
                      onClick={() => remove(item)}
                      className="p-2 rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 shrink-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        ))
      )}
    </Page>
  );
}
