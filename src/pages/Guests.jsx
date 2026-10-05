import { useMemo, useState } from "react";
import {
  Users,
  Mail,
  Printer,
  UserCheck,
  UserX,
  Plus,
  Trash2,
  Search,
  Filter,
} from "lucide-react";
import {
  Page,
  PageHeader,
  Card,
  StatCard,
  Loading,
  ErrorState,
  Badge,
  Table,
  EmptyState,
} from "../components/ui";
import { useWedding } from "../lib/weddingData";
import pb from "../lib/pocketbase";

const PRIORITY_TONE = {
  "A - Must Invite": "purple",
  "B - Should Invite": "blue",
  "C - If Capacity Allows": "gray",
};
const STATUS_TONE = {
  Hadir: "green",
  "Tidak Hadir": "red",
  Belum: "gray",
  "Tanpa Keterangan": "amber",
};

export default function Guests() {
  const { guests, guestSummary, couple, loading, error, reload, addLog } = useWedding();
  const [side, setSide] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [group, setGroup] = useState("ALL");
  const [type, setType] = useState("ALL");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    side: "CPP",
    name: "",
    relationship: "",
    group_name: "",
    priority: "A - Must Invite",
    pax: 1,
    origin: "",
    type: "Digital",
    status: "Belum",
  });

  const groups = useMemo(
    () => [...new Set(guests.map((g) => g.group_name).filter(Boolean))].sort(),
    [guests]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guests.filter((g) => {
      if (side !== "ALL" && g.side !== side) return false;
      if (priority !== "ALL" && g.priority !== priority) return false;
      if (group !== "ALL" && g.group_name !== group) return false;
      if (type !== "ALL" && g.type !== type) return false;
      if (q && !`${g.name} ${g.origin} ${g.group_name} ${g.relationship}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [guests, side, priority, group, type, query]);

  const filteredPax = filtered.reduce((s, g) => s + Number(g.pax || 0), 0);

  const addGuest = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    await pb.collection("wedding_guests").create({
      couple: couple?.id,
      ...form,
      pax: Number(form.pax) || 1,
    });
    await addLog(`Tamu baru ditambahkan: ${form.name}`, "guest");
    setForm({ ...form, name: "", relationship: "", group_name: "", origin: "" });
    setShowForm(false);
    reload();
  };

  const removeGuest = async (g) => {
    if (!confirm(`Hapus tamu "${g.name}"?`)) return;
    await pb.collection("wedding_guests").delete(g.id);
    reload();
  };

  const cycleStatus = async (g) => {
    const order = ["Belum", "Hadir", "Tidak Hadir", "Tanpa Keterangan"];
    const next = order[(order.indexOf(g.status) + 1) % order.length];
    await pb.collection("wedding_guests").update(g.id, { status: next });
    reload();
  };

  const toggleInvitation = async (g) => {
    await pb.collection("wedding_guests").update(g.id, {
      type: g.type === "Digital" ? "Fisik" : "Digital",
    });
    reload();
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  return (
    <Page>
      <PageHeader
        title="Daftar Tamu Undangan"
        subtitle="Manajemen tamu pihak CPP & CPW dengan filter circle, prioritas, dan kehadiran."
        icon={Users}
        action={
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-white text-sm font-medium hover:opacity-90"
          >
            <Plus size={16} /> Tamu
          </button>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard label="Total Tamu" value={guestSummary.total} sub={`${guestSummary.totalPax} pax`} icon={Users} tone="primary" />
        <StatCard label="Undangan Digital" value={guestSummary.digital} sub="via WhatsApp/e-invite" icon={Mail} tone="blue" />
        <StatCard label="Undangan Fisik" value={guestSummary.fisik} sub="cetak & kirim" icon={Printer} tone="amber" />
        <StatCard label="Konfirmasi Hadir" value={guestSummary.hadir} sub={`${guestSummary.paxHadir} pax`} icon={UserCheck} tone="green" />
        <StatCard label="Tidak Hadir" value={guestSummary.tidakHadir} sub={`${guestSummary.paxTidakHadir} pax`} icon={UserX} tone="red" />
      </div>

      {showForm && (
        <Card>
          <form onSubmit={addGuest} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input placeholder="Nama tamu" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-darksurface text-sm" required />
            <input placeholder="Hubungan (cth: Close Friend)" value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-darksurface text-sm" />
            <input placeholder="Group (cth: THM)" value={form.group_name} onChange={(e) => setForm({ ...form, group_name: e.target.value })} className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-darksurface text-sm" />
            <input placeholder="Asal tamu" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-darksurface text-sm" />
            <select value={form.side} onChange={(e) => setForm({ ...form, side: e.target.value })} className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-darksurface text-sm">
              <option value="CPP">Pihak CPP</option>
              <option value="CPW">Pihak CPW</option>
            </select>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-darksurface text-sm">
              <option>A - Must Invite</option>
              <option>B - Should Invite</option>
              <option>C - If Capacity Allows</option>
            </select>
            <input type="number" min="1" placeholder="Pax" value={form.pax} onChange={(e) => setForm({ ...form, pax: e.target.value })} className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-darksurface text-sm" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-darksurface text-sm">
              <option>Digital</option>
              <option>Fisik</option>
            </select>
            <button className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium">Simpan Tamu</button>
          </form>
        </Card>
      )}

      {/* Filter */}
      <Card>
        <div className="flex items-center gap-2 mb-4 text-gray-500 text-sm">
          <Filter size={16} /> Filter tamu
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama / asal…" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-darksurface text-sm" />
          </div>
          <Select value={side} onChange={setSide} options={[["ALL", "Semua Pihak"], ["CPP", "CPP"], ["CPW", "CPW"]]} />
          <Select value={priority} onChange={setPriority} options={[["ALL", "Semua Prioritas"], ["A - Must Invite", "A - Must Invite"], ["B - Should Invite", "B - Should Invite"], ["C - If Capacity Allows", "C - If Capacity Allows"]]} />
          <Select value={group} onChange={setGroup} options={[["ALL", "Semua Group"], ...groups.map((g) => [g, g])]} />
          <Select value={type} onChange={setType} options={[["ALL", "Semua Tipe"], ["Digital", "Undangan Digital"], ["Fisik", "Undangan Fisik"]]} />
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Menampilkan <b>{filtered.length}</b> tamu ({filteredPax} pax) dari total {guestSummary.total}.
        </p>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState message="Tidak ada tamu yang cocok dengan filter." icon={Users} />
        ) : (
          <Table head={["Nama Tamu", "Pihak", "Circle / Group", "Prioritas", "Pax", "Asal", "Undangan", "Status", ""]}>
            {filtered.map((g) => (
              <tr key={g.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                <td className="py-3 px-3 first:pl-0">
                  <p className="font-medium">{g.name}</p>
                  <p className="text-xs text-gray-400">{g.relationship}</p>
                </td>
                <td className="py-3 px-3">
                  <Badge tone={g.side === "CPP" ? "blue" : "purple"}>{g.side}</Badge>
                </td>
                <td className="py-3 px-3 text-gray-500 whitespace-nowrap">{g.group_name}</td>
                <td className="py-3 px-3">
                  <Badge tone={PRIORITY_TONE[g.priority] || "gray"}>
                    {(g.priority || "").split(" - ")[0]}
                  </Badge>
                </td>
                <td className="py-3 px-3 text-gray-500">{g.pax}</td>
                <td className="py-3 px-3 text-gray-500 whitespace-nowrap">{g.origin}</td>
                <td className="py-3 px-3">
                  <button onClick={() => toggleInvitation(g)} className="text-xs">
                    <Badge tone={g.type === "Digital" ? "blue" : "amber"}>{g.type}</Badge>
                  </button>
                </td>
                <td className="py-3 px-3">
                  <button onClick={() => cycleStatus(g)}>
                    <Badge tone={STATUS_TONE[g.status] || "gray"}>{g.status || "Belum"}</Badge>
                  </button>
                </td>
                <td className="py-3 px-3 text-right">
                  <button onClick={() => removeGuest(g)} className="p-2 rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </Page>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-darksurface text-sm"
    >
      {options.map(([v, label]) => (
        <option key={v} value={v}>{label}</option>
      ))}
    </select>
  );
}
