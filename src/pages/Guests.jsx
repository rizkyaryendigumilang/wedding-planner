import { useMemo, useState, useRef, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Users,
  Mail,
  Printer,
  Plus,
  Trash2,
  Search,
  SlidersHorizontal,
  Check,
  X,
  Link2,
  Download,
  Copy,
  Settings2,
  CheckCircle2,
  Upload,
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
  SectionTitle,
  Button,
  Field,
  Input,
  Select,
} from "../components/ui";
import { useWedding } from "../lib/weddingData";
import pb from "../lib/pocketbase";
import { exportToCsv } from "../lib/export";

const EASE = [0.22, 1, 0.36, 1];

const _PRIORITY_TONE = {
  "A - Must Invite": "plum",
  "B - Should Invite": "sky",
  "C - If Capacity Allows": "gray",
};
const STATUS_TONE = {
  Hadir: "sage",
  "Tidak Hadir": "rose",
  Belum: "gray",
  "Tanpa Keterangan": "amber",
};

const PRIORITIES = ["A - Must Invite", "B - Should Invite", "C - If Capacity Allows"];

function WhatsAppIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm0 18.15c-1.49 0-2.96-.4-4.24-1.16l-.3-.18-3.14.82.84-3.06-.2-.31a8.17 8.17 0 0 1-1.25-4.35c0-4.54 3.69-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.188 8.188 0 0 1 2.41 5.83c.01 4.54-3.68 8.22-8.23 8.22zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.66.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.12.17 1.77 2.71 4.3 3.8 2.52 1.09 2.52.73 2.98.69.45-.04 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.17-.48-.29z" />
    </svg>
  );
}

const DEFAULT_WA_TEMPLATE = `Kepada Yth. {nama},

Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri pernikahan kami:

💍 Rizky & Reina
📅 17 Februari 2028
📍 Gedung PINDAD, Bandung

Tautan undangan dan konfirmasi kehadiran (RSVP) dapat diakses melalui:
{link}

Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.

Salam hangat,
Rizky & Reina`;

const GuestRow = memo(function GuestRow({
  guest: g,
  index: i,
  reduce,
  isMsgCopied,
  isLinkCopied,
  onSendWhatsApp,
  onCopyMessage,
  onCopyLink,
  onToggleSentStatus,
  onToggleInvitation,
  onCycleStatus,
  onRemoveGuest,
}) {
  return (
    <motion.tr
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(i * 0.01, 0.2), duration: 0.2, ease: EASE }}
      className="group hover:bg-canvas-sunken/50 dark:hover:bg-night-sunken/50 transition-colors cv-auto"
    >
      <td className="py-3 px-3 first:pl-0">
        <p className="font-medium text-sm text-ink dark:text-stone-100">{g.name}</p>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-ink-faint">
          {g.relationship && <span>{g.relationship}</span>}
          {g.origin && <span>• {g.origin}</span>}
          {g.phone && (
            <span className="text-sage-600 dark:text-sage-400 font-mono">
              • {g.phone}
            </span>
          )}
          {g.table_number && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400">
              Meja: {g.table_number}
            </span>
          )}
        </div>
      </td>

      <td className="py-3 px-3">
        <Badge tone={g.side === "CPP" ? "sky" : "plum"}>{g.side}</Badge>
      </td>

      <td className="py-3 px-3 text-ink-muted tabular-nums font-medium">
        {g.pax} pax
      </td>

      <td className="py-3 px-3 text-ink-muted whitespace-nowrap text-xs">
        {g.group_name || <span className="text-ink-faint">—</span>}
      </td>

      {/* KOLOM AKSI WHATSAPP CEPAT */}
      <td className="py-3 px-3 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onSendWhatsApp(g)}
            title="Buka obrolan WhatsApp dengan pesan undangan"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] dark:text-[#25D366] text-xs font-semibold transition active:scale-[0.97]"
          >
            <WhatsAppIcon className="w-3.5 h-3.5" />
            <span>Kirim WA</span>
          </button>

          <button
            type="button"
            onClick={() => onCopyMessage(g)}
            title="Salin teks pesan undangan"
            className="p-1.5 rounded-xl text-ink-faint hover:text-ink hover:bg-canvas-sunken dark:hover:bg-night-sunken transition"
          >
            {isMsgCopied ? (
              <Check size={14} className="text-sage-600" />
            ) : (
              <Copy size={14} />
            )}
          </button>

          <button
            type="button"
            onClick={() => onCopyLink(g)}
            title="Salin tautan undangan personal"
            className="p-1.5 rounded-xl text-ink-faint hover:text-ink hover:bg-canvas-sunken dark:hover:bg-night-sunken transition"
          >
            {isLinkCopied ? (
              <Check size={14} className="text-sage-600" />
            ) : (
              <Link2 size={14} />
            )}
          </button>
        </div>
      </td>

      {/* STATUS UNDANGAN */}
      <td className="py-3 px-3 whitespace-nowrap">
        <button
          onClick={() => onToggleSentStatus(g)}
          title="Klik untuk mengubah status sudah/belum terkirim"
          className="focus-ring rounded-lg mr-1.5"
        >
          <Badge tone={g.invitation_sent ? "sage" : "gray"}>
            {g.invitation_sent ? "Terkirim" : "Belum kirim"}
          </Badge>
        </button>
        <button
          onClick={() => onToggleInvitation(g)}
          title="Ubah jenis fisik / digital"
          className="focus-ring rounded-lg text-xs"
        >
          <Badge tone={g.type === "Digital" ? "sky" : "amber"}>{g.type}</Badge>
        </button>
      </td>

      {/* STATUS KEHADIRAN (RSVP) */}
      <td className="py-3 px-3 whitespace-nowrap">
        <button
          onClick={() => onCycleStatus(g)}
          aria-label={`Ubah status kehadiran ${g.name}`}
          title="Klik untuk mengganti status: Belum -> Hadir -> Tidak Hadir"
          className="focus-ring rounded-lg"
        >
          <Badge tone={STATUS_TONE[g.status] || "gray"}>
            {g.status || "Belum"}
          </Badge>
        </button>
      </td>

      <td className="py-3 px-3 text-right">
        <button
          onClick={() => onRemoveGuest(g)}
          aria-label={`Hapus ${g.name}`}
          className="p-2 rounded-xl text-ink-faint opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-rose-600 hover:bg-rose-500/10 transition-all"
        >
          <Trash2 size={15} />
        </button>
      </td>
    </motion.tr>
  );
});

export default function Guests() {
  const {
    guests,
    guestSummary,
    couple,
    loading,
    error,
    reload,
    addLog,
    saveSettings,
    settings,
    moveToTrash,
  } = useWedding();
  const [side, setSide] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [group, setGroup] = useState("ALL");
  const [type, setType] = useState("ALL");
  const [rsvpFilter, setRsvpFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const reduce = useReducedMotion();

  // Settings State: Base link undangan & template WA
  const [baseInvitationUrl, setBaseInvitationUrl] = useState(
    () => settings?.invitation_base_url || "https://undangan-pernikahan.me/rizky-reina"
  );
  const [waTemplate, setWaTemplate] = useState(
    () => settings?.wa_invitation_template || DEFAULT_WA_TEMPLATE
  );
  const [savingSettings, setSavingSettings] = useState(false);

  const [form, setForm] = useState({
    side: "CPP",
    name: "",
    relationship: "",
    group_name: "",
    priority: PRIORITIES[0],
    pax: 1,
    origin: "",
    type: "Digital",
    status: "Belum",
    phone: "",
    invitation_url: "",
    table_number: "",
  });

  const importFileRef = useRef(null);
  const [importModal, setImportModal] = useState({
    open: false,
    fileName: "",
    rows: [],
    importing: false,
    progress: 0,
    result: null,
  });

  const groups = useMemo(
    () => [...new Set(guests.map((g) => g.group_name).filter(Boolean))].sort(),
    [guests]
  );

  // Debounce input pencarian (150ms) agar tidak membebani CPU saat mengetik cepat
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  // Progressive pagination (50 baris pertama untuk meringankan render DOM awal)
  const PAGE_SIZE = 50;
  const filterKey = `${side}|${priority}|${group}|${type}|${rsvpFilter}|${debouncedQuery}`;
  const [pageState, setPageState] = useState({ key: filterKey, count: PAGE_SIZE });

  // Jika filter berubah, otomatis gunakan PAGE_SIZE secara murni tanpa cascading render
  const visibleCount = pageState.key === filterKey ? pageState.count : PAGE_SIZE;

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return guests.filter((g) => {
      if (side !== "ALL" && g.side !== side) return false;
      if (priority !== "ALL" && g.priority !== priority) return false;
      if (group !== "ALL" && g.group_name !== group) return false;
      if (type !== "ALL" && g.type !== type) return false;
      if (rsvpFilter !== "ALL") {
        if (rsvpFilter === "Hadir" && g.status !== "Hadir") return false;
        if (rsvpFilter === "Tidak Hadir" && g.status !== "Tidak Hadir") return false;
        if (rsvpFilter === "Belum" && g.status === "Hadir") return false;
        if (rsvpFilter === "Sent" && !g.invitation_sent) return false;
      }
      if (
        q &&
        !`${g.name} ${g.origin} ${g.group_name} ${g.relationship} ${g.phone || ""}`
          .toLowerCase()
          .includes(q)
      )
        return false;
      return true;
    });
  }, [guests, side, priority, group, type, rsvpFilter, debouncedQuery]);

  const displayedGuests = useMemo(() => {
    return filtered.slice(0, visibleCount);
  }, [filtered, visibleCount]);

  const filteredPax = filtered.reduce((s, g) => s + Number(g.pax || 0), 0);

  const activeFilters =
    (side !== "ALL" ? 1 : 0) +
    (priority !== "ALL" ? 1 : 0) +
    (group !== "ALL" ? 1 : 0) +
    (type !== "ALL" ? 1 : 0) +
    (rsvpFilter !== "ALL" ? 1 : 0);

  const resetFilters = () => {
    setSide("ALL");
    setPriority("ALL");
    setGroup("ALL");
    setType("ALL");
    setRsvpFilter("ALL");
    setQuery("");
  };

  /**
   * Helper untuk membuat link personal setiap tamu dari Base URL.
   */
  const getGuestInvitationLink = useCallback((g) => {
    if (g.invitation_url?.trim()) return g.invitation_url.trim();
    if (!baseInvitationUrl?.trim()) return "";
    const cleanBase = baseInvitationUrl.trim();
    const separator = cleanBase.includes("?") ? "&" : "?";
    return `${cleanBase}${separator}to=${encodeURIComponent(g.name)}`;
  }, [baseInvitationUrl]);

  /**
   * Format pesan WhatsApp dengan penggantian placeholder {nama}, {link}, {pax}.
   */
  const getGuestWaMessage = useCallback((g) => {
    const link = getGuestInvitationLink(g);
    return waTemplate
      .replace(/{nama}/g, g.name)
      .replace(/{pax}/g, String(g.pax || 1))
      .replace(/{link}/g, link || baseInvitationUrl || "")
      .replace(/{pengantin}/g, "Rizky & Reina")
      .replace(/{tanggal}/g, "17 Februari 2028")
      .replace(/{venue}/g, couple?.venue || "Gedung PINDAD")
      .replace(/{meja}/g, g.table_number || "Meja Resepsi");
  }, [baseInvitationUrl, couple?.venue, getGuestInvitationLink, waTemplate]);

  /**
   * Buka WhatsApp langsung ke nomor tamu (atau buka Web WA) dan tandai undangan terkirim.
   */
  const sendWhatsApp = useCallback(async (g) => {
    const msg = getGuestWaMessage(g);
    const cleanPhone = (g.phone || "").replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone
      ? cleanPhone.startsWith("0")
        ? `62${cleanPhone.slice(1)}`
        : cleanPhone.startsWith("62")
        ? cleanPhone
        : `62${cleanPhone}`
      : null;
    const waUrl = formattedPhone
      ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;

    window.open(waUrl, "_blank");

    // Tandai otomatis bahwa undangan sudah terkirim
    if (!g.invitation_sent) {
      try {
        await pb.collection("wedding_guests").update(g.id, { invitation_sent: true });
        reload();
      } catch (err) {
        console.warn("Gagal update status kirim undangan:", err);
      }
    }
  }, [getGuestWaMessage, reload]);

  const copyGuestMessage = useCallback((g) => {
    const msg = getGuestWaMessage(g);
    navigator.clipboard.writeText(msg);
    setCopiedId(`msg-${g.id}`);
    setTimeout(() => setCopiedId(null), 2000);
  }, [getGuestWaMessage]);

  const copyGuestLink = useCallback((g) => {
    const link = getGuestInvitationLink(g);
    navigator.clipboard.writeText(link);
    setCopiedId(`link-${g.id}`);
    setTimeout(() => setCopiedId(null), 2000);
  }, [getGuestInvitationLink]);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await saveSettings({
        invitation_base_url: baseInvitationUrl.trim(),
        wa_invitation_template: waTemplate.trim(),
      });
      setShowSettingsModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      { key: "name", label: "Nama Tamu" },
      { key: "phone", label: "Nomor WhatsApp" },
      { key: "side", label: "Pihak" },
      { key: "relationship", label: "Hubungan" },
      { key: "group_name", label: "Lingkaran / Grup" },
      { key: "priority", label: "Prioritas" },
      { key: "pax", label: "Jumlah Pax" },
      { key: "origin", label: "Asal / Kota" },
      { key: "type", label: "Jenis Undangan" },
      { key: "status", label: "Status Kehadiran" },
      {
        key: "invitation_sent",
        label: "Undangan Terkirim",
        format: (val) => (val ? "Sudah" : "Belum"),
      },
      { key: "table_number", label: "Nomor Meja" },
      {
        key: "link",
        label: "Link Undangan Personal",
        format: (_, g) => getGuestInvitationLink(g),
      },
    ];

    exportToCsv("Daftar_Tamu_Rizky_Reina", headers, guests);
  };

  const handleCsvFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const parsedRows = parseCsvText(text);
      setImportModal({
        open: true,
        fileName: file.name,
        rows: parsedRows,
        importing: false,
        progress: 0,
        result: null,
      });
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const parseCsvText = (text) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const parseRow = (line) => {
      const result = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === "," && !inQuotes) {
          result.push(cur.trim());
          cur = "";
        } else {
          cur += c;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const headers = parseRow(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
    const dataRows = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseRow(lines[i]);
      if (cols.length === 0 || !cols.some((c) => c)) continue;
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = cols[idx] || "";
      });

      const name =
        row["nama"] || row["namatamu"] || row["name"] || row["guestname"] || row["guest"] || cols[0] || "";
      if (!name) continue;

      const rawSide = (row["pihak"] || row["side"] || "").toUpperCase();
      const side = rawSide.includes("CPW") || rawSide.includes("REINA") ? "CPW" : "CPP";

      const pax = parseInt(row["pax"] || row["jumlah"] || row["kursi"] || "1", 10) || 1;
      const phone = row["phone"] || row["whatsapp"] || row["nohp"] || row["wa"] || row["telepon"] || "";
      const groupName = row["group"] || row["grup"] || row["kategori"] || row["circle"] || row["lingkaran"] || "";
      const priority = row["priority"] || row["prioritas"] || "B - Should Invite";
      const tableNumber = row["meja"] || row["nomormeja"] || row["table"] || row["tablenumber"] || "";
      const origin = row["asal"] || row["kota"] || row["origin"] || "";
      const relationship = row["hubungan"] || row["relasi"] || row["relationship"] || "";

      dataRows.push({
        name,
        side,
        pax,
        phone,
        group_name: groupName,
        priority: priority.startsWith("A") ? "A - Must Invite" : priority.startsWith("C") ? "C - If Capacity Allows" : "B - Should Invite",
        table_number: tableNumber,
        origin,
        relationship,
        type: "Digital",
        status: "Belum",
      });
    }
    return dataRows;
  };

  const executeImport = async () => {
    if (importModal.rows.length === 0) return;
    setImportModal((prev) => ({ ...prev, importing: true, progress: 0 }));

    let successCount = 0;
    const coupleId = couple?.id;

    for (let i = 0; i < importModal.rows.length; i++) {
      const guestData = importModal.rows[i];
      try {
        await pb.collection("wedding_guests").create({
          ...guestData,
          couple: coupleId,
        });
        successCount++;
      } catch (err) {
        console.warn("Gagal mengimpor tamu baris ke-", i, err);
      }
      setImportModal((prev) => ({
        ...prev,
        progress: Math.round(((i + 1) / prev.rows.length) * 100),
      }));
    }

    if (addLog) {
      await addLog(`Mengimpor ${successCount} tamu dari berkas ${importModal.fileName}`, "guest");
    }
    await reload();

    setImportModal((prev) => ({
      ...prev,
      importing: false,
      result: `Berhasil mengimpor ${successCount} dari ${prev.rows.length} tamu!`,
    }));
  };

  const addGuest = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    await pb.collection("wedding_guests").create({
      couple: couple?.id,
      ...form,
      name: form.name.trim(),
      pax: Number(form.pax) || 1,
    });
    await addLog(`Tamu baru ditambahkan: ${form.name.trim()}`, "guest");
    setForm({
      side: "CPP",
      name: "",
      relationship: "",
      group_name: "",
      priority: PRIORITIES[0],
      pax: 1,
      origin: "",
      type: "Digital",
      status: "Belum",
      phone: "",
      invitation_url: "",
      table_number: "",
    });
    setShowForm(false);
    reload();
  };

  const removeGuest = useCallback(async (g) => {
    if (!confirm(`Pindahkan tamu "${g.name}" ke Tempat Sampah? Anda dapat memulihkannya kembali dari menu Pengaturan.`)) return;
    if (moveToTrash) {
      await moveToTrash("wedding_guests", g, g.name);
    } else {
      await pb.collection("wedding_guests").delete(g.id);
      await addLog(`Tamu "${g.name}" dihapus`, "guest");
      reload();
    }
  }, [moveToTrash, addLog, reload]);

  const cycleStatus = useCallback(async (g) => {
    const order = ["Belum", "Hadir", "Tidak Hadir", "Tanpa Keterangan"];
    const next = order[(order.indexOf(g.status || "Belum") + 1) % order.length];
    await pb.collection("wedding_guests").update(g.id, { status: next });
    reload();
  }, [reload]);

  const toggleSentStatus = useCallback(async (g) => {
    await pb.collection("wedding_guests").update(g.id, {
      invitation_sent: !g.invitation_sent,
    });
    reload();
  }, [reload]);

  const toggleInvitation = useCallback(async (g) => {
    await pb.collection("wedding_guests").update(g.id, {
      type: g.type === "Digital" ? "Fisik" : "Digital",
    });
    reload();
  }, [reload]);

  if (loading) return <Loading label="Memuat daftar tamu…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <Page>
      <PageHeader
        eyebrow="Undangan"
        title="Daftar tamu &amp; RSVP"
        subtitle="Manajemen 165 tamu, kirim undangan WhatsApp 1-klik, dan lacak konfirmasi kehadiran (pax)."
        icon={Users}
        action={
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={importFileRef}
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleCsvFileSelect}
            />
            <Button
              variant="outline"
              size="sm"
              icon={Upload}
              onClick={() => importFileRef.current?.click()}
              title="Impor daftar tamu massal dari berkas CSV"
            >
              Impor CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Settings2}
              onClick={() => setShowSettingsModal(true)}
              title="Atur link website undangan & template WA"
            >
              Link &amp; Template
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              onClick={handleExportCsv}
              title="Download spreadsheet tamu untuk Excel / Google Sheets"
            >
              Ekspor Excel
            </Button>
            <Button size="sm" icon={Plus} onClick={() => setShowForm((s) => !s)}>
              Tamu Baru
            </Button>
          </div>
        }
      />

      {/* Baris Ringkasan Statistik RSVP */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Total tamu"
          value={guestSummary.total}
          sub={`${guestSummary.totalPax} pax total`}
          icon={Users}
          tone="neutral"
          delay={0}
        />
        <StatCard
          label="Undangan digital"
          value={guestSummary.digital}
          sub="WhatsApp e-invite"
          icon={Mail}
          tone="sky"
          delay={0.03}
        />
        <StatCard
          label="Undangan fisik"
          value={guestSummary.fisik}
          sub="Cetak & antar"
          icon={Printer}
          tone="amber"
          delay={0.06}
        />
        <StatCard
          label="Terkirim"
          value={guestSummary.sentCount || 0}
          sub="Undangan terkirim"
          icon={CheckCircle2}
          tone="sky"
          delay={0.09}
        />
        <StatCard
          label="Konfirmasi hadir"
          value={guestSummary.hadir}
          sub={`${guestSummary.paxHadir} pax hadir`}
          icon={Check}
          tone="sage"
          delay={0.12}
        />
        <StatCard
          label="Tidak hadir"
          value={guestSummary.tidakHadir}
          sub={`${guestSummary.paxTidakHadir} pax berhalangan`}
          icon={X}
          tone="rose"
          delay={0.15}
        />
      </section>

      {/* Banner Informasi Link Undangan */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-canvas-sunken/70 dark:bg-night-sunken/70 border border-line dark:border-night-line text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link2 size={16} className="text-rose-600 shrink-0" />
          <div className="min-w-0">
            <span className="font-semibold text-ink dark:text-stone-200">Link Website Undangan: </span>
            <code className="text-rose-600 dark:text-rose-400 font-mono truncate">
              {baseInvitationUrl || "Belum diatur"}
            </code>
          </div>
        </div>
        <button
          onClick={() => setShowSettingsModal(true)}
          className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline shrink-0"
        >
          Ubah Link / Template Pesan &rarr;
        </button>
      </div>

      {/* Formulir Tambah Tamu Baru */}
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
              <SectionTitle>Tambah tamu baru</SectionTitle>
              <form onSubmit={addGuest} className="mt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Field label="Pihak">
                    <Select
                      value={form.side}
                      onChange={(e) => setForm({ ...form, side: e.target.value })}
                      options={[
                        ["CPP", "CPP (Rizky)"],
                        ["CPW", "CPW (Reina)"],
                      ]}
                    />
                  </Field>
                  <Field label="Nama tamu" required>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Budi Santoso"
                      required
                    />
                  </Field>
                  <Field label="Nomor WhatsApp">
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="08123456789"
                    />
                  </Field>
                  <Field label="Hubungan">
                    <Input
                      value={form.relationship}
                      onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                      placeholder="Teman Kantor / Saudara"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                  <Field label="Grup / Lingkaran">
                    <Input
                      value={form.group_name}
                      onChange={(e) => setForm({ ...form, group_name: e.target.value })}
                      placeholder="Kantor, Kuliah, Keluarga"
                    />
                  </Field>
                  <Field label="Prioritas">
                    <Select
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      options={PRIORITIES.map((p) => [p, p])}
                    />
                  </Field>
                  <Field label="Pax">
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={form.pax}
                      onChange={(e) => setForm({ ...form, pax: e.target.value })}
                    />
                  </Field>
                  <Field label="Nomor / Label Meja">
                    <Input
                      value={form.table_number}
                      onChange={(e) => setForm({ ...form, table_number: e.target.value })}
                      placeholder="Meja 1 / VIP"
                    />
                  </Field>
                  <Field label="Kota / Asal">
                    <Input
                      value={form.origin}
                      onChange={(e) => setForm({ ...form, origin: e.target.value })}
                      placeholder="Bandung"
                    />
                  </Field>
                  <Field label="Jenis undangan">
                    <Select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      options={[
                        ["Digital", "Digital (WA)"],
                        ["Fisik", "Fisik (Cetak)"],
                      ]}
                    />
                  </Field>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button type="submit" size="sm" icon={Check}>
                    Simpan tamu
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

      {/* Pencarian & Filter Cepat */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama, nomor WA, kota, atau grup tamu…"
              className="!pl-10"
              aria-label="Cari tamu"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {/* Quick RSVP Filters */}
            <button
              onClick={() => setRsvpFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                rsvpFilter === "ALL"
                  ? "bg-ink dark:bg-stone-100 text-canvas dark:text-ink"
                  : "bg-canvas-sunken dark:bg-night-sunken text-ink-muted hover:text-ink"
              }`}
            >
              Semua ({guests.length})
            </button>
            <button
              onClick={() => setRsvpFilter("Hadir")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                rsvpFilter === "Hadir"
                  ? "bg-sage-600 text-white"
                  : "bg-sage-500/10 text-sage-700 dark:text-sage-300"
              }`}
            >
              Hadir ({guestSummary.hadir})
            </button>
            <button
              onClick={() => setRsvpFilter("Belum")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                rsvpFilter === "Belum"
                  ? "bg-stone-600 text-white"
                  : "bg-canvas-sunken dark:bg-night-sunken text-ink-muted"
              }`}
            >
              Belum RSVP ({guestSummary.belum})
            </button>

            <Button
              variant={showFilters ? "primary" : "outline"}
              size="sm"
              icon={SlidersHorizontal}
              onClick={() => setShowFilters((s) => !s)}
              className="shrink-0 ml-1"
            >
              Filter{activeFilters > 0 ? ` (${activeFilters})` : ""}
            </Button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-line dark:border-night-line mt-3">
                <Field label="Pihak">
                  <Select
                    value={side}
                    onChange={(e) => setSide(e.target.value)}
                    options={[
                      ["ALL", "Semua pihak"],
                      ["CPP", "CPP (Rizky)"],
                      ["CPW", "CPW (Reina)"],
                    ]}
                  />
                </Field>
                <Field label="Prioritas">
                  <Select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    options={[["ALL", "Semua prioritas"], ...PRIORITIES.map((p) => [p, p])]}
                  />
                </Field>
                <Field label="Lingkaran / grup">
                  <Select
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                    options={[["ALL", "Semua grup"], ...groups.map((g) => [g, g])]}
                  />
                </Field>
                <Field label="Jenis undangan">
                  <Select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    options={[
                      ["ALL", "Semua jenis"],
                      ["Digital", "Digital"],
                      ["Fisik", "Fisik"],
                    ]}
                  />
                </Field>
              </div>

              {activeFilters > 0 && (
                <button
                  onClick={resetFilters}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink dark:hover:text-stone-100 transition-colors"
                >
                  <X size={13} /> Bersihkan filter
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-xs text-ink-faint mt-3">
          Menampilkan <span className="font-semibold text-ink dark:text-stone-200">{filtered.length}</span> tamu
          ({filteredPax} pax) dari total {guestSummary.total}.
        </p>
      </Card>

      {/* Tabel Tamu dengan Tombol WhatsApp & RSVP */}
      <Card>
        <SectionTitle count={`${filtered.length} baris`}>Daftar tamu &amp; undangan</SectionTitle>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            message="Tidak ada tamu yang cocok."
            hint="Longgarkan filter atau ubah kata kunci pencarian."
            action={
              <Button variant="outline" size="sm" onClick={resetFilters} className="mt-1">
                Bersihkan filter
              </Button>
            }
          />
        ) : (
          <div className="mt-4 overflow-x-auto">
            <Table
              head={[
                "Nama tamu",
                "Pihak",
                "Pax",
                "Lingkaran",
                "Kirim WhatsApp",
                "Undangan",
                "RSVP",
                "",
              ]}
            >
              {displayedGuests.map((g, i) => (
                <GuestRow
                  key={g.id}
                  guest={g}
                  index={i}
                  reduce={reduce}
                  isMsgCopied={copiedId === `msg-${g.id}`}
                  isLinkCopied={copiedId === `link-${g.id}`}
                  onSendWhatsApp={sendWhatsApp}
                  onCopyMessage={copyGuestMessage}
                  onCopyLink={copyGuestLink}
                  onToggleSentStatus={toggleSentStatus}
                  onToggleInvitation={toggleInvitation}
                  onCycleStatus={cycleStatus}
                  onRemoveGuest={removeGuest}
                />
              ))}
            </Table>

            {visibleCount < filtered.length && (
              <div className="mt-4 pt-3 border-t border-line dark:border-night-line flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-ink-muted">
                  Menampilkan <strong>{displayedGuests.length}</strong> dari <strong>{filtered.length}</strong> tamu
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageState({ key: filterKey, count: visibleCount + PAGE_SIZE })}
                  >
                    Muat 50 Tamu Lainnya
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPageState({ key: filterKey, count: filtered.length })}
                  >
                    Tampilkan Semua ({filtered.length})
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ---------------- MODAL PENGATURAN LINK & TEMPLATE WA ---------------- */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettingsModal(false)}
              className="absolute inset-0 bg-ink/60 dark:bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg rounded-3xl bg-canvas-card dark:bg-night-card border border-line dark:border-night-line p-6 shadow-lift z-10 max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowSettingsModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-ink-muted hover:bg-canvas-sunken dark:hover:bg-night-sunken transition"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 grid place-items-center shrink-0">
                  <Link2 size={20} />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-base">
                    Pengaturan Link Undangan &amp; WhatsApp
                  </h3>
                  <p className="text-xs text-ink-faint">
                    Sesuaikan link website undangan luar &amp; format pesan otomatis
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-1">
                    Link Website Undangan Anda
                  </label>
                  <Input
                    value={baseInvitationUrl}
                    onChange={(e) => setBaseInvitationUrl(e.target.value)}
                    placeholder="https://undangan.me/rizky-reina"
                  />
                  <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
                    💡 <strong>Tips:</strong> Karena undangan dibuat di vendor/website lain, cukup
                    masukkan link dasarnya di sini. Aplikasi akan otomatis menambahkan parameter
                    nama tamu (contoh: <code className="font-mono">?to=Budi+Santoso</code>).
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-1">
                    Template Pesan WhatsApp
                  </label>
                  <textarea
                    rows={7}
                    value={waTemplate}
                    onChange={(e) => setWaTemplate(e.target.value)}
                    className="field font-sans text-xs leading-relaxed resize-y"
                    placeholder="Tulis format pesan..."
                  />
                  <p className="text-[11px] text-ink-muted mt-1">
                    Variabel otomatis yang bisa dipakai: <code className="font-mono text-rose-600">{'{nama}'}</code>,{" "}
                    <code className="font-mono text-rose-600">{'{link}'}</code>,{" "}
                    <code className="font-mono text-rose-600">{'{pax}'}</code>,{" "}
                    <code className="font-mono text-rose-600">{'{meja}'}</code>.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-line dark:border-night-line">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettingsModal(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    size="sm"
                    icon={Check}
                    loading={savingSettings}
                    onClick={handleSaveSettings}
                  >
                    Simpan Pengaturan
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- MODAL IMPOR MASSAL CSV ---------------- */}
      <AnimatePresence>
        {importModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!importModal.importing) setImportModal({ ...importModal, open: false });
              }}
              className="absolute inset-0 bg-ink/60 dark:bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-xl rounded-3xl bg-canvas-card dark:bg-night-card border border-line dark:border-night-line p-6 shadow-lift z-10 max-h-[90vh] overflow-y-auto"
            >
              {!importModal.importing && (
                <button
                  onClick={() => setImportModal({ ...importModal, open: false })}
                  className="absolute top-4 right-4 p-2 rounded-xl text-ink-muted hover:bg-canvas-sunken dark:hover:bg-night-sunken transition"
                >
                  <X size={16} />
                </button>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 grid place-items-center shrink-0">
                  <Upload size={20} />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-base">
                    Impor Tamu Massal (CSV)
                  </h3>
                  <p className="text-xs text-ink-faint">
                    Berkas: <span className="font-mono font-medium text-ink dark:text-stone-200">{importModal.fileName}</span>
                  </p>
                </div>
              </div>

              {importModal.result ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-sage-500/10 border border-sage-500/20 text-center">
                    <CheckCircle2 size={32} className="mx-auto text-sage-600 dark:text-sage-400 mb-2" />
                    <p className="text-sm font-semibold text-sage-700 dark:text-sage-300">
                      {importModal.result}
                    </p>
                    <p className="text-xs text-ink-faint mt-1">
                      Data tamu telah masuk ke database dan siap dikirimi undangan WhatsApp.
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => setImportModal({ ...importModal, open: false, result: null })}
                    >
                      Selesai
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-canvas-sunken dark:bg-night-sunken">
                    <div>
                      <p className="font-semibold text-ink dark:text-stone-200">
                        Total {importModal.rows.length} calon tamu terdeteksi
                      </p>
                      <p className="text-[11px] text-ink-faint mt-0.5">
                        Kolom: Nama, Pihak (CPP/CPW), Pax, WhatsApp, Meja, Grup, Kota
                      </p>
                    </div>
                    <Badge tone={importModal.rows.length > 0 ? "sky" : "rose"}>
                      {importModal.rows.length} Baris
                    </Badge>
                  </div>

                  {importModal.rows.length > 0 ? (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-2">
                        Pratinjau Data (Maks 5 Tamu Pertama):
                      </p>
                      <div className="border border-line dark:border-night-line rounded-2xl overflow-hidden max-h-52 overflow-y-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-canvas-sunken dark:bg-night-sunken sticky top-0 text-[11px] font-semibold text-ink-muted">
                            <tr>
                              <th className="py-2 px-3 border-b border-line dark:border-night-line">Nama</th>
                              <th className="py-2 px-3 border-b border-line dark:border-night-line">Pihak</th>
                              <th className="py-2 px-3 border-b border-line dark:border-night-line">Pax</th>
                              <th className="py-2 px-3 border-b border-line dark:border-night-line">Meja</th>
                              <th className="py-2 px-3 border-b border-line dark:border-night-line">WhatsApp</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line dark:divide-night-line">
                            {importModal.rows.slice(0, 5).map((r, idx) => (
                              <tr key={idx} className="hover:bg-canvas-sunken/40 dark:hover:bg-night-sunken/40">
                                <td className="py-2 px-3 font-medium text-ink dark:text-stone-200">{r.name}</td>
                                <td className="py-2 px-3">{r.side}</td>
                                <td className="py-2 px-3">{r.pax} pax</td>
                                <td className="py-2 px-3 text-amber-600 dark:text-amber-400 font-mono text-[11px]">
                                  {r.table_number || "—"}
                                </td>
                                <td className="py-2 px-3 font-mono text-[11px] text-ink-muted">
                                  {r.phone || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-700 dark:text-rose-300 text-center">
                      <p className="font-semibold">Tidak ada baris data yang valid ditemukan.</p>
                      <p className="text-[11px] mt-1">Pastikan baris pertama berisi header CSV (misal: Nama, Pihak, Pax, WhatsApp, Meja).</p>
                    </div>
                  )}

                  {importModal.importing && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-ink-muted">Sedang menyimpan ke database...</span>
                        <span className="font-mono font-semibold">{importModal.progress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-canvas-sunken dark:bg-night-sunken overflow-hidden">
                        <div
                          className="h-full bg-sky-500 transition-all duration-200"
                          style={{ width: `${importModal.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-3 flex items-center justify-end gap-2 border-t border-line dark:border-night-line">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={importModal.importing}
                      onClick={() => setImportModal({ ...importModal, open: false })}
                    >
                      Batal
                    </Button>
                    <Button
                      size="sm"
                      icon={Upload}
                      loading={importModal.importing}
                      disabled={importModal.rows.length === 0 || importModal.importing}
                      onClick={executeImport}
                    >
                      Mulai Impor ({importModal.rows.length} Tamu)
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Page>
  );
}
