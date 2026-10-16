import { useMemo, useState, memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarCheck,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Plus,
  Trash2,
  Search,
  Check,
  Download,
  Share2,
  Bell,
  Coins,
  Phone,
  Banknote,
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
} from "../components/ui";
import { DatePicker } from "../components/DatePicker";
import { useWedding } from "../lib/weddingData";
import pb from "../lib/pocketbase";
import { daysUntil, formatDateShort, pct, formatRupiah } from "../lib/format";
import { exportToCsv } from "../lib/export";

const EASE = [0.22, 1, 0.36, 1];

const CATEGORIES = [
  "Booking Vendor",
  "Things To Do",
  "Administrasi Pernikahan",
  "Rangkaian Acara",
];

/** Warna, label, dan ikon berdasarkan sisa hari menuju tenggat. */
function deadlineMeta(date) {
  const d = daysUntil(date);
  if (d === null) return { tone: "gray", label: "Tanpa tenggat", icon: Clock };
  if (d < 0) return { tone: "rose", label: `Lewat ${Math.abs(d)} hari`, icon: AlertTriangle };
  if (d === 0) return { tone: "rose", label: "Hari ini", icon: AlertTriangle };
  if (d <= 7) return { tone: "amber", label: `${d} hari lagi`, icon: AlertTriangle };
  if (d <= 30) return { tone: "sky", label: `${d} hari lagi`, icon: Clock };
  return { tone: "gray", label: `${d} hari lagi`, icon: Clock };
}

/** Komponen Baris Checklist Vendor yang di-memoize untuk scrolling mulus */
const VendorTaskItem = memo(function VendorTaskItem({
  item,
  onToggle,
  onToggleDp,
  onToggleSettlement,
  onSendWhatsApp,
  onRemove,
}) {
  const meta = deadlineMeta(item.deadline_date);
  const MetaIcon = meta.icon;

  return (
    <div className="cv-auto group flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 transition hover:bg-canvas-sunken/40 dark:hover:bg-night-sunken/40 -mx-4 px-4 rounded-xl">
      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
        <button
          onClick={() => onToggle(item)}
          className="mt-0.5 sm:mt-0 p-1 rounded-xl text-ink-faint hover:text-rose-600 transition focus-ring"
          aria-label={item.is_completed ? "Tandai belum selesai" : "Tandai selesai"}
        >
          {item.is_completed ? (
            <CheckCircle2 size={19} className="text-sage-600 dark:text-sage-400" />
          ) : (
            <Circle size={19} />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <span
            className={`text-sm leading-snug min-w-0 truncate block ${
              item.is_completed
                ? "line-through text-ink-faint"
                : "font-medium text-ink dark:text-stone-100"
            }`}
          >
            {item.activity_name}
          </span>
          {(Number(item.total_cost || 0) > 0 || Number(item.dp_amount || 0) > 0 || item.vendor_phone) && (
            <div className="flex items-center gap-2 mt-1 text-xs text-ink-faint flex-wrap">
              {Number(item.total_cost || 0) > 0 && (
                <span className="font-semibold text-ink dark:text-stone-200">
                  {formatRupiah(item.total_cost)}
                </span>
              )}
              {Number(item.dp_amount || 0) > 0 && (
                <span>• DP: {formatRupiah(item.dp_amount)}</span>
              )}
              {item.vendor_phone && (
                <button
                  type="button"
                  onClick={() => onSendWhatsApp(item)}
                  className="inline-flex items-center gap-1 text-[#128C7E] dark:text-[#25D366] font-medium hover:underline ml-0.5"
                  title="Hubungi vendor via WhatsApp"
                >
                  <Phone size={11} />
                  <span>{item.vendor_phone}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end pl-8 sm:pl-0">
        {/* Tombol Toggle DP */}
        {(Number(item.total_cost || 0) > 0 || Number(item.dp_amount || 0) > 0) && (
          <button
            type="button"
            onClick={() => onToggleDp(item)}
            title="Klik untuk ubah status pembayaran DP"
            className="focus-ring rounded-lg text-xs"
          >
            <Badge tone={item.dp_paid ? "sage" : "amber"}>
              {item.dp_paid ? "DP Lunas" : "DP Belum"}
            </Badge>
          </button>
        )}

        {/* Tombol Toggle Pelunasan */}
        {Number(item.total_cost || 0) > 0 && (
          <button
            type="button"
            onClick={() => onToggleSettlement(item)}
            title="Klik untuk ubah status pelunasan"
            className="focus-ring rounded-lg text-xs"
          >
            <Badge tone={item.settlement_paid ? "sage" : "gray"}>
              {item.settlement_paid ? "Pelunasan Lunas" : "Belum Lunas"}
            </Badge>
          </button>
        )}

        {item.deadline_date && !item.is_completed && (
          <Badge tone={meta.tone}>
            <MetaIcon size={12} />
            <span>{meta.label}</span>
          </Badge>
        )}
        {item.deadline_date && (
          <span className="text-xs text-ink-faint hidden sm:inline font-mono">
            {formatDateShort(item.deadline_date)}
          </span>
        )}
        <button
          onClick={() => onRemove(item)}
          className="p-1.5 rounded-xl text-ink-faint opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-rose-600 hover:bg-rose-500/10 transition"
          aria-label="Hapus tugas"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
});

export default function Vendors() {
  const { vendors, vendorSummary, couple, loading, error, reload, addLog, moveToTrash } =
    useWedding();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, OVERDUE, WEEK, PENDING, DONE
  const [showForm, setShowForm] = useState(false);
  const [copiedBriefing, setCopiedBriefing] = useState(false);
  const [notifGranted, setNotifGranted] = useState(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    return Notification.permission === "granted";
  });

  const [form, setForm] = useState({
    category: CATEGORIES[0],
    activity_name: "",
    deadline_date: "",
    total_cost: "",
    dp_amount: "",
    dp_paid: false,
    settlement_paid: false,
    vendor_phone: "",
  });

  // Kalkulasi Milestone Pembayaran Vendor
  const milestoneStats = useMemo(() => {
    let totalContract = 0;
    let totalDpPaid = 0;
    let totalSettlementPaid = 0;

    vendors.forEach((v) => {
      const cost = Number(v.total_cost || 0);
      const dp = Number(v.dp_amount || 0);
      totalContract += cost;
      if (v.dp_paid) {
        totalDpPaid += dp;
      }
      if (v.settlement_paid) {
        totalSettlementPaid += Math.max(0, cost - dp);
      }
    });

    const totalPaid = totalDpPaid + totalSettlementPaid;
    const remainingToPay = Math.max(0, totalContract - totalPaid);

    return {
      totalContract,
      totalDpPaid,
      totalSettlementPaid,
      totalPaid,
      remainingToPay,
    };
  }, [vendors]);

  // Filter tasks
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = vendors;

    if (q) {
      list = list.filter(
        (v) =>
          v.activity_name.toLowerCase().includes(q) || v.category.toLowerCase().includes(q)
      );
    }

    if (statusFilter === "OVERDUE") {
      list = list.filter((v) => !v.is_completed && v.deadline_date && daysUntil(v.deadline_date) < 0);
    } else if (statusFilter === "WEEK") {
      list = list.filter(
        (v) =>
          !v.is_completed &&
          v.deadline_date &&
          daysUntil(v.deadline_date) >= 0 &&
          daysUntil(v.deadline_date) <= 7
      );
    } else if (statusFilter === "PENDING") {
      list = list.filter((v) => !v.is_completed);
    } else if (statusFilter === "DONE") {
      list = list.filter((v) => v.is_completed);
    }

    // Tenggat terdekat lebih dulu; yang sudah selesai selalu di bawah.
    return [...list].sort((a, b) => {
      if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
      if (!a.deadline_date) return 1;
      if (!b.deadline_date) return -1;
      return new Date(a.deadline_date) - new Date(b.deadline_date);
    });
  }, [vendors, query, statusFilter]);

  const sections = useMemo(() => {
    const map = new Map();
    for (const v of filtered) {
      if (!map.has(v.category)) map.set(v.category, []);
      map.get(v.category).push(v);
    }
    return [...map.entries()];
  }, [filtered]);

  const nextDeadline = useMemo(() => {
    const pending = vendors.filter((v) => !v.is_completed && v.deadline_date);
    if (pending.length === 0) return null;
    return [...pending].sort(
      (a, b) => new Date(a.deadline_date) - new Date(b.deadline_date)
    )[0];
  }, [vendors]);

  const overdueList = useMemo(
    () => vendors.filter((v) => !v.is_completed && v.deadline_date && daysUntil(v.deadline_date) < 0),
    [vendors]
  );

  const thisWeekList = useMemo(
    () =>
      vendors.filter(
        (v) =>
          !v.is_completed &&
          v.deadline_date &&
          daysUntil(v.deadline_date) >= 0 &&
          daysUntil(v.deadline_date) <= 7
      ),
    [vendors]
  );

  const toggle = useCallback(async (item) => {
    await pb.collection("vendor_checklists").update(item.id, {
      is_completed: !item.is_completed,
    });
    await addLog(
      `"${item.activity_name}" ditandai ${!item.is_completed ? "selesai" : "belum selesai"}`,
      "task"
    );
    reload();
  }, [addLog, reload]);

  const toggleDp = useCallback(async (item) => {
    const nextVal = !item.dp_paid;
    await pb.collection("vendor_checklists").update(item.id, {
      dp_paid: nextVal,
    });
    await addLog(
      `DP vendor "${item.activity_name}" ditandai ${nextVal ? "sudah dibayar" : "belum dibayar"}`,
      "task"
    );
    reload();
  }, [addLog, reload]);

  const toggleSettlement = useCallback(async (item) => {
    const nextVal = !item.settlement_paid;
    await pb.collection("vendor_checklists").update(item.id, {
      settlement_paid: nextVal,
    });
    await addLog(
      `Pelunasan vendor "${item.activity_name}" ditandai ${nextVal ? "sudah lunas" : "belum lunas"}`,
      "task"
    );
    reload();
  }, [addLog, reload]);

  const sendVendorWhatsApp = useCallback((v) => {
    if (!v.vendor_phone) return;
    const cleanPhone = (v.vendor_phone || "").replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone
      ? cleanPhone.startsWith("0")
        ? `62${cleanPhone.slice(1)}`
        : cleanPhone.startsWith("62")
        ? cleanPhone
        : `62${cleanPhone}`
      : "";
    const msg = `Halo ${v.activity_name},\n\nSalam hangat dari Rizky & Reina (Pernikahan 17 Februari 2028). Ingin konfirmasi mengenai persiapan vendor dan tenggat waktu kegiatan kami.\n\nTerima kasih!`;
    const waUrl = formattedPhone
      ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank");
  }, []);

  const remove = useCallback(async (item) => {
    if (!confirm(`Pindahkan tugas "${item.activity_name}" ke Tempat Sampah? Anda dapat memulihkannya kembali dari menu Pengaturan.`)) return;
    if (moveToTrash) {
      await moveToTrash("vendor_checklists", item, item.activity_name);
    } else {
      await pb.collection("vendor_checklists").delete(item.id);
      await addLog(`Tugas "${item.activity_name}" dihapus`, "task");
      reload();
    }
  }, [moveToTrash, addLog, reload]);

  const addItem = async (e) => {
    e.preventDefault();
    if (!form.activity_name.trim()) return;
    await pb.collection("vendor_checklists").create({
      couple: couple?.id,
      category: form.category,
      activity_name: form.activity_name.trim(),
      deadline_date: form.deadline_date ? `${form.deadline_date} 00:00:00.000Z` : undefined,
      is_completed: false,
      total_cost: Number(form.total_cost) || 0,
      dp_amount: Number(form.dp_amount) || 0,
      dp_paid: Boolean(form.dp_paid),
      settlement_paid: Boolean(form.settlement_paid),
      vendor_phone: form.vendor_phone.trim(),
      sort_order: vendors.length + 1,
    });
    await addLog(`Tugas baru: "${form.activity_name.trim()}"`, "task");
    setForm({
      category: CATEGORIES[0],
      activity_name: "",
      deadline_date: "",
      total_cost: "",
      dp_amount: "",
      dp_paid: false,
      settlement_paid: false,
      vendor_phone: "",
    });
    setShowForm(false);
    reload();
  };

  /**
   * Generator ringkasan teks pengingat WhatsApp untuk Rizky & Reina.
   */
  const handleCopyWaBriefing = () => {
    const lines = [
      `⏰ *PENGINGAT TENGGAT VENDOR PERNIKAHAN*`,
      `Rizky & Reina • Menuju 17 Februari 2028`,
      ``,
    ];

    if (overdueList.length > 0) {
      lines.push(`🚨 *LEWAT TENGGAT (${overdueList.length} tugas):*`);
      overdueList.slice(0, 5).forEach((t) => {
        lines.push(`• ${t.activity_name} (${t.category}) — ${formatDateShort(t.deadline_date)}`);
      });
      lines.push(``);
    }

    if (thisWeekList.length > 0) {
      lines.push(`⚡ *JATUH TEMPO MINGGU INI (${thisWeekList.length} tugas):*`);
      thisWeekList.forEach((t) => {
        lines.push(`• ${t.activity_name} — ${daysUntil(t.deadline_date)} hari lagi (${formatDateShort(t.deadline_date)})`);
      });
      lines.push(``);
    }

    lines.push(
      `📊 Progres: ${vendorSummary.done}/${vendorSummary.total} tugas selesai (${(
        pct(vendorSummary.done, vendorSummary.total)
      ).toFixed(0)}%).`
    );
    lines.push(`Semangat mempersiapkan hari bahagia kita! 💍✨`);

    const text = lines.join("\n");
    navigator.clipboard.writeText(text);
    setCopiedBriefing(true);
    setTimeout(() => setCopiedBriefing(false), 2200);

    // Buka WhatsApp Web/App dengan teks siap kirim
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
  };

  const handleExportCsv = () => {
    const headers = [
      { key: "category", label: "Kategori" },
      { key: "activity_name", label: "Nama Tugas / Vendor" },
      {
        key: "deadline_date",
        label: "Tenggat Waktu",
        format: (val) => (val ? formatDateShort(val) : "Tanpa Tenggat"),
      },
      {
        key: "total_cost",
        label: "Total Kontrak (Rp)",
        format: (val) => formatRupiah(val || 0),
      },
      {
        key: "dp_amount",
        label: "Uang Muka / DP (Rp)",
        format: (val) => formatRupiah(val || 0),
      },
      {
        key: "dp_paid",
        label: "Status DP",
        format: (val) => (val ? "Lunas" : "Belum"),
      },
      {
        key: "settlement_paid",
        label: "Status Pelunasan",
        format: (val) => (val ? "Lunas" : "Belum"),
      },
      { key: "vendor_phone", label: "No. WA Vendor" },
      {
        key: "is_completed",
        label: "Status Tugas",
        format: (val) => (val ? "Selesai" : "Belum"),
      },
    ];
    exportToCsv("Checklist_Vendor_Rizky_Reina", headers, vendors);
  };

  const handleToggleNotification = async () => {
    if (!("Notification" in window)) {
      alert("Browser ini tidak mendukung notifikasi push.");
      return;
    }

    if (Notification.permission === "granted") {
      new Notification("Pengingat Vendor Pernikahan", {
        body: `Ada ${overdueList.length + thisWeekList.length} tugas vendor yang memerlukan perhatian!`,
        icon: "/apple-touch-icon.png",
      });
      return;
    }

    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      setNotifGranted(true);
      new Notification("Pengingat Aktif!", {
        body: "Anda akan mendapatkan pemberitahuan saat ada tenggat vendor yang mendekati.",
        icon: "/apple-touch-icon.png",
      });
    }
  };

  if (loading) return <Loading label="Memuat checklist vendor…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const overallPct = pct(vendorSummary.done, vendorSummary.total);

  return (
    <Page>
      <PageHeader
        eyebrow="Persiapan"
        title="Vendor &amp; tenggat waktu"
        subtitle="55 tugas vendor, hitung mundur hari H, notifikasi jatuh tempo, dan pengingat WhatsApp."
        icon={CalendarCheck}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={copiedBriefing ? Check : Share2}
              onClick={handleCopyWaBriefing}
              title="Kirim atau salin ringkasan tenggat ke WhatsApp"
            >
              {copiedBriefing ? "Tersalin!" : "Pengingat WA"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Bell}
              onClick={handleToggleNotification}
              title="Aktifkan pengingat notifikasi browser"
            >
              {notifGranted ? "Notif Aktif" : "Notifikasi"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              onClick={handleExportCsv}
              title="Unduh checklist ke Excel / CSV"
            >
              Ekspor
            </Button>
            <Button size="sm" icon={Plus} onClick={() => setShowForm((s) => !s)}>
              Tugas Baru
            </Button>
          </div>
        }
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total tugas"
          value={vendorSummary.total}
          sub={`${vendorSummary.remaining} belum selesai`}
          icon={CalendarCheck}
          tone="neutral"
          delay={0}
        />
        <StatCard
          label="Selesai"
          value={vendorSummary.done}
          sub={`${overallPct.toFixed(0)}% progres`}
          icon={CheckCircle2}
          tone="sage"
          delay={0.05}
        />
        <StatCard
          label="Tenggat terdekat"
          value={nextDeadline ? `${daysUntil(nextDeadline.deadline_date)} hari` : "—"}
          sub={nextDeadline ? nextDeadline.activity_name : "Semua sudah beres"}
          icon={Clock}
          tone="amber"
          delay={0.1}
          compact
        />
        <StatCard
          label="Lewat tenggat"
          value={overdueList.length}
          sub={overdueList.length > 0 ? "perlu tindakan segera" : "semua tepat waktu"}
          icon={AlertTriangle}
          tone={overdueList.length > 0 ? "rose" : "sage"}
          delay={0.15}
        />
      </section>

      {/* Milestone Pembayaran Vendor (DP & Pelunasan) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-3xl bg-canvas-card dark:bg-night-card border border-line dark:border-night-line">
          <div className="flex items-center justify-between text-ink-muted text-xs font-medium mb-1">
            <span>Total Kontrak Vendor</span>
            <Banknote size={15} className="text-brass-500" />
          </div>
          <p className="text-lg font-display font-semibold text-ink dark:text-stone-100">
            {formatRupiah(milestoneStats.totalContract)}
          </p>
          <p className="text-[11px] text-ink-faint mt-0.5">
            {vendors.filter((v) => Number(v.total_cost || 0) > 0).length} vendor tercatat biaya
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-canvas-card dark:bg-night-card border border-line dark:border-night-line">
          <div className="flex items-center justify-between text-ink-muted text-xs font-medium mb-1">
            <span>DP Terbayar</span>
            <Coins size={15} className="text-amber-500" />
          </div>
          <p className="text-lg font-display font-semibold text-amber-600 dark:text-amber-400">
            {formatRupiah(milestoneStats.totalDpPaid)}
          </p>
          <p className="text-[11px] text-ink-faint mt-0.5">
            {vendors.filter((v) => v.dp_paid).length} vendor lunas DP
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-canvas-card dark:bg-night-card border border-line dark:border-night-line">
          <div className="flex items-center justify-between text-ink-muted text-xs font-medium mb-1">
            <span>Pelunasan Lunas</span>
            <CheckCircle2 size={15} className="text-sage-500" />
          </div>
          <p className="text-lg font-display font-semibold text-sage-600 dark:text-sage-400">
            {formatRupiah(milestoneStats.totalSettlementPaid)}
          </p>
          <p className="text-[11px] text-ink-faint mt-0.5">
            {vendors.filter((v) => v.settlement_paid).length} vendor lunas penuh
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-canvas-card dark:bg-night-card border border-line dark:border-night-line">
          <div className="flex items-center justify-between text-ink-muted text-xs font-medium mb-1">
            <span>Sisa Pelunasan</span>
            <Clock size={15} className="text-rose-500" />
          </div>
          <p className="text-lg font-display font-semibold text-rose-600 dark:text-rose-400">
            {formatRupiah(milestoneStats.remainingToPay)}
          </p>
          <p className="text-[11px] text-ink-faint mt-0.5">
            Sisa kewajiban pembayaran
          </p>
        </div>
      </section>

      {/* Peringatan jika ada tugas yang lewat tenggat */}
      {overdueList.length > 0 && (
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={16} className="shrink-0" />
            <span>
              Ada <strong>{overdueList.length} tugas vendor</strong> yang telah melewati tenggat waktu!
            </span>
          </div>
          <button
            onClick={() => setStatusFilter("OVERDUE")}
            className="font-semibold underline hover:no-underline shrink-0"
          >
            Lihat tugas &rarr;
          </button>
        </div>
      )}

      <Card>
        <SectionTitle
          action={<Badge tone={overallPct === 100 ? "sage" : "amber"}>{overallPct.toFixed(0)}%</Badge>}
        >
          Progres keseluruhan
        </SectionTitle>
        <div className="mt-4">
          <ProgressBar value={overallPct} tone="bg-brass-400" height="h-2.5" />
        </div>
      </Card>

      {/* Formulir Tambah Tugas */}
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
              <SectionTitle>Tugas baru</SectionTitle>
              <form onSubmit={addItem} className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Field label="Kategori">
                  <Select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    options={CATEGORIES.map((c) => [c, c])}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Nama aktivitas / vendor" required>
                    <Input
                      value={form.activity_name}
                      onChange={(e) => setForm({ ...form, activity_name: e.target.value })}
                      placeholder="Contoh: Booking MUA, DP Gedung"
                      required
                    />
                  </Field>
                </div>
                <Field label="Tenggat waktu">
                  <DatePicker
                    value={form.deadline_date}
                    onChange={(d) => setForm({ ...form, deadline_date: d })}
                    placeholder="Pilih tanggal"
                  />
                </Field>

                <div className="sm:col-span-2 lg:col-span-4 border-t border-line dark:border-night-line pt-3 mt-1">
                  <p className="text-xs font-semibold text-ink dark:text-stone-200 mb-2">
                    Milestone Pembayaran &amp; Kontak Vendor (Opsional)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Field label="Total Biaya Kontrak (Rp)">
                      <Input
                        type="number"
                        step={100000}
                        value={form.total_cost}
                        onChange={(e) => setForm({ ...form, total_cost: e.target.value })}
                        placeholder="Contoh: 15000000"
                      />
                    </Field>
                    <Field label="Nominal Uang Muka / DP (Rp)">
                      <Input
                        type="number"
                        step={100000}
                        value={form.dp_amount}
                        onChange={(e) => setForm({ ...form, dp_amount: e.target.value })}
                        placeholder="Contoh: 5000000"
                      />
                    </Field>
                    <Field label="Nomor WhatsApp Vendor">
                      <Input
                        value={form.vendor_phone}
                        onChange={(e) => setForm({ ...form, vendor_phone: e.target.value })}
                        placeholder="08123456789"
                      />
                    </Field>
                    <div className="flex flex-col justify-end gap-2 pb-1">
                      <label className="flex items-center gap-2 text-xs font-medium text-ink dark:text-stone-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.dp_paid}
                          onChange={(e) => setForm({ ...form, dp_paid: e.target.checked })}
                          className="rounded text-rose-600 focus:ring-rose-500"
                        />
                        <span>DP Sudah Dibayar</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium text-ink dark:text-stone-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.settlement_paid}
                          onChange={(e) => setForm({ ...form, settlement_paid: e.target.checked })}
                          className="rounded text-rose-600 focus:ring-rose-500"
                        />
                        <span>Pelunasan Sudah Lunas</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-2 pt-2">
                  <Button type="submit" size="sm" icon={Check}>
                    Simpan tugas
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowForm(false)}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter & Pencarian */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari tugas vendor atau kategori…"
              className="!pl-10"
              aria-label="Cari tugas"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === "ALL"
                  ? "bg-ink dark:bg-stone-100 text-canvas dark:text-ink"
                  : "bg-canvas-sunken dark:bg-night-sunken text-ink-muted hover:text-ink"
              }`}
            >
              Semua ({vendors.length})
            </button>
            <button
              onClick={() => setStatusFilter("OVERDUE")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === "OVERDUE"
                  ? "bg-rose-600 text-white"
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-300"
              }`}
            >
              Lewat Tenggat ({overdueList.length})
            </button>
            <button
              onClick={() => setStatusFilter("WEEK")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === "WEEK"
                  ? "bg-amber-600 text-white"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
              }`}
            >
              Minggu Ini ({thisWeekList.length})
            </button>
            <button
              onClick={() => setStatusFilter("PENDING")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === "PENDING"
                  ? "bg-stone-600 text-white"
                  : "bg-canvas-sunken dark:bg-night-sunken text-ink-muted"
              }`}
            >
              Belum ({vendorSummary.remaining})
            </button>
            <button
              onClick={() => setStatusFilter("DONE")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === "DONE"
                  ? "bg-sage-600 text-white"
                  : "bg-sage-500/10 text-sage-700 dark:text-sage-300"
              }`}
            >
              Selesai ({vendorSummary.done})
            </button>
          </div>
        </div>
      </Card>

      {/* Render Daftar Tugas per Kategori */}
      {sections.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarCheck}
            message="Tidak ada tugas yang cocok."
            hint="Ubah kata kunci pencarian atau sesuaikan filter status."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setStatusFilter("ALL");
                }}
                className="mt-1"
              >
                Tampilkan semua
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {sections.map(([cat, items]) => {
            const catDone = items.filter((i) => i.is_completed).length;
            return (
              <Card key={cat}>
                <div className="flex items-center justify-between pb-3 border-b border-line dark:border-night-line">
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-display font-semibold text-base">{cat}</h2>
                    <span className="text-xs text-ink-faint">
                      {catDone}/{items.length} selesai
                    </span>
                  </div>
                  <Badge tone={catDone === items.length ? "sage" : "amber"}>
                    {pct(catDone, items.length).toFixed(0)}%
                  </Badge>
                </div>

                <div className="divide-y divide-line dark:divide-night-line">
                  {items.map((item) => (
                    <VendorTaskItem
                      key={item.id}
                      item={item}
                      onToggle={toggle}
                      onToggleDp={toggleDp}
                      onToggleSettlement={toggleSettlement}
                      onSendWhatsApp={sendVendorWhatsApp}
                      onRemove={remove}
                    />
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Page>
  );
}
