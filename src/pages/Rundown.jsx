import { useState, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Clock,
  Plus,
  Search,
  CheckCircle2,
  Circle,
  MapPin,
  Phone,
  MessageCircle,
  Pencil,
  Trash2,
  Download,
  Calendar,
  Sparkles,
  X,
} from "lucide-react";
import {
  Page,
  PageHeader,
  Card,
  StatCard,
  Badge,
  Button,
  EmptyState,
} from "../components/ui";
import { useWedding } from "../lib/weddingData";
import { exportToCsv } from "../lib/export";

const EASE = [0.22, 1, 0.36, 1];

const PHASES = ["Semua", "Persiapan", "Akad / Pemberkatan", "Resepsi", "After Party"];

const DEFAULT_RUNDOWN_TEMPLATE = [
  {
    phase: "Persiapan",
    time_start: "05:00",
    time_end: "07:00",
    title: "Make Up & Busana Pengantin (MUA & Attire)",
    location: "Kamar Rias / Ruang Ganti Gedung",
    pic_name: "Tim MUA & Wardrobe",
    pic_phone: "",
    notes: "Pengantin wanita dan pria mulai rias wajah dan mengenakan busana akad.",
    sort_order: 1,
  },
  {
    phase: "Persiapan",
    time_start: "07:00",
    time_end: "07:30",
    title: "Briefing Panitia & Keluarga Inti",
    location: "Lobi Gedung",
    pic_name: "Koordinator Acara / WO",
    pic_phone: "",
    notes: "Pengecekan akhir konsumsi, sound system, meja buku tamu, dan saksi nikah.",
    sort_order: 2,
  },
  {
    phase: "Akad / Pemberkatan",
    time_start: "07:30",
    time_end: "08:00",
    title: "Penyambutan Rombongan Calon Pengantin Pria",
    location: "Pintu Masuk Ruang Akad",
    pic_name: "Juru Bicara Keluarga",
    pic_phone: "",
    notes: "Pengalungan bunga melati dan penyerahan seserahan simbolis.",
    sort_order: 3,
  },
  {
    phase: "Akad / Pemberkatan",
    time_start: "08:00",
    time_end: "09:00",
    title: "Prosesi Ijab Kabul & Khutbah Nikah",
    location: "Meja Akad Nikah",
    pic_name: "Petugas KUA & Saksi",
    pic_phone: "",
    notes: "Penyerahan mahar, pemasangan cincin, dan penandatanganan buku nikah.",
    sort_order: 4,
  },
  {
    phase: "Akad / Pemberkatan",
    time_start: "09:00",
    time_end: "10:00",
    title: "Sungkeman & Foto Bersama Keluarga Inti",
    location: "Pelaminan Akad",
    pic_name: "Fotografer & MC",
    pic_phone: "",
    notes: "Sesi sungkem kepada kedua orang tua dilanjutkan foto keluarga CPP & CPW.",
    sort_order: 5,
  },
  {
    phase: "Persiapan",
    time_start: "10:00",
    time_end: "11:00",
    title: "Retouch Make Up & Ganti Busana Resepsi",
    location: "Ruang Ganti Pengantin",
    pic_name: "Tim MUA",
    pic_phone: "",
    notes: "Istirahat singkat, makan ringan, dan ganti busana resepsi.",
    sort_order: 6,
  },
  {
    phase: "Resepsi",
    time_start: "11:00",
    time_end: "11:30",
    title: "Kirab Pengantin Masuk Pelaminan",
    location: "Pintu Masuk Ballroom ke Pelaminan",
    pic_name: "WO & Tim Musik",
    pic_phone: "",
    notes: "Pengantin didampingi orang tua dan pagar ayu berjalan menuju pelaminan.",
    sort_order: 7,
  },
  {
    phase: "Resepsi",
    time_start: "11:30",
    time_end: "13:30",
    title: "Ramah Tamah, Prasmanan & Sesi Foto Tamu",
    location: "Pelaminan & Area Buffet",
    pic_name: "MC, Catering & Fotografer",
    pic_phone: "",
    notes: "Tamu memberikan ucapan selamat, menikmati hidangan, dan berfoto bersama.",
    sort_order: 8,
  },
  {
    phase: "Resepsi",
    time_start: "13:30",
    time_end: "14:00",
    title: "Lempar Hand Bouquet & Penutupan Acara",
    location: "Tengah Ballroom",
    pic_name: "MC & WO",
    pic_phone: "",
    notes: "Sesi seru lempar bunga untuk sahabat lajang dan foto panitia.",
    sort_order: 9,
  },
];

export default function Rundown() {
  const reduce = useReducedMotion();
  const {
    rundowns = [],
    rundownSummary = {},
    toggleRundown,
    addRundownEvent,
    updateRundownEvent,
    deleteRundownEvent,
  } = useWedding();

  const [phaseFilter, setPhaseFilter] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const [form, setForm] = useState({
    phase: "Akad / Pemberkatan",
    time_start: "08:00",
    time_end: "09:00",
    title: "",
    location: "",
    pic_name: "",
    pic_phone: "",
    notes: "",
  });

  const filtered = useMemo(() => {
    return rundowns.filter((item) => {
      if (phaseFilter !== "Semua" && item.phase !== phaseFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const str = `${item.title} ${item.location || ""} ${item.pic_name || ""} ${item.notes || ""}`.toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }, [rundowns, phaseFilter, searchQuery]);

  const openCreateModal = () => {
    setEditingItem(null);
    setForm({
      phase: phaseFilter === "Semua" ? "Akad / Pemberkatan" : phaseFilter,
      time_start: "08:00",
      time_end: "09:00",
      title: "",
      location: "",
      pic_name: "",
      pic_phone: "",
      notes: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setForm({
      phase: item.phase || "Akad / Pemberkatan",
      time_start: item.time_start || "08:00",
      time_end: item.time_end || "",
      title: item.title || "",
      location: item.location || "",
      pic_name: item.pic_name || "",
      pic_phone: item.pic_phone || "",
      notes: item.notes || "",
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.time_start.trim()) return;

    setLoadingAction(true);
    try {
      if (editingItem) {
        await updateRundownEvent(editingItem.id, form);
      } else {
        await addRundownEvent(form);
      }
      setModalOpen(false);
    } catch (err) {
      alert("Gagal menyimpan agenda: " + (err?.message || "Terjadi kesalahan"));
    } finally {
      setLoadingAction(false);
    }
  };

  const handleApplyTemplate = async () => {
    if (rundowns.length > 0) {
      const ok = confirm("Muat template jadwal lengkap? Agenda template akan ditambahkan ke daftar rundown Anda.");
      if (!ok) return;
    }
    setLoadingAction(true);
    try {
      for (const t of DEFAULT_RUNDOWN_TEMPLATE) {
        await addRundownEvent(t);
      }
    } catch (err) {
      alert("Gagal memuat template: " + (err?.message || ""));
    } finally {
      setLoadingAction(false);
    }
  };

  const handleExportCsv = () => {
    if (rundowns.length === 0) return;
    const data = rundowns.map((r, idx) => ({
      No: idx + 1,
      Fase: r.phase,
      "Waktu Mulai": r.time_start,
      "Waktu Selesai": r.time_end || "-",
      "Nama Agenda": r.title,
      Lokasi: r.location || "-",
      "PIC (Penanggung Jawab)": r.pic_name || "-",
      "Kontak PIC": r.pic_phone || "-",
      Status: r.is_completed ? "Selesai" : "Belum",
      Catatan: r.notes || "-",
    }));
    exportToCsv("itinerary-hari-h-pernikahan.csv", data);
  };

  const completedPct = rundownSummary.total
    ? Math.round((rundownSummary.done / rundownSummary.total) * 100)
    : 0;

  return (
    <Page>
      <PageHeader
        title="Itinerary Hari-H"
        subtitle="Susunan jadwal acara akad &amp; resepsi, lokasi, dan kontak penanggung jawab."
        action={
          <div className="flex items-center gap-2">
            {rundowns.length > 0 && (
              <Button
                variant="secondary"
                icon={Download}
                onClick={handleExportCsv}
                className="hidden sm:inline-flex"
              >
                Unduh CSV
              </Button>
            )}
            <Button icon={Plus} onClick={openCreateModal}>
              Tambah Agenda
            </Button>
          </div>
        }
      />

      {/* Ringkasan Statistik */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <StatCard
          label="Total Agenda"
          value={rundownSummary.total || 0}
          sublabel="Jadwal tersusun"
          icon={Calendar}
          tone="stone"
        />
        <StatCard
          label="Progres Acara"
          value={`${completedPct}%`}
          sublabel={`${rundownSummary.done || 0} dari ${rundownSummary.total || 0} selesai`}
          icon={CheckCircle2}
          tone="sage"
        />
        <StatCard
          label="Sisa Agenda"
          value={rundownSummary.remaining || 0}
          sublabel="Menunggu giliran"
          icon={Clock}
          tone="amber"
        />
        <Card className="flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
              Agenda Selanjutnya
            </p>
            {rundownSummary.nextRundown ? (
              <div className="mt-1">
                <p className="font-semibold text-xs text-rose-600 dark:text-rose-400">
                  {rundownSummary.nextRundown.time_start} - {rundownSummary.nextRundown.title}
                </p>
                <p className="text-[11px] text-ink-muted truncate">
                  {rundownSummary.nextRundown.location || "Lokasi utama"}
                </p>
              </div>
            ) : (
              <p className="text-xs text-ink-muted mt-2">Semua agenda selesai 🎉</p>
            )}
          </div>
          <span className="text-[10px] text-ink-faint mt-1">Real-time update</span>
        </Card>
      </div>

      {/* Filter & Pencarian */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {PHASES.map((ph) => {
              const active = phaseFilter === ph;
              return (
                <button
                  key={ph}
                  onClick={() => setPhaseFilter(ph)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition active:scale-[0.97] ${
                    active
                      ? "bg-rose-600 text-white shadow-glow"
                      : "bg-canvas-sunken dark:bg-night-sunken text-ink-muted hover:text-ink dark:hover:text-stone-100"
                  }`}
                >
                  {ph}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              placeholder="Cari agenda / PIC…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="field pl-8 !py-1.5 !text-xs"
            />
          </div>
        </div>
      </Card>

      {/* Empty State / Template Button */}
      {rundowns.length === 0 ? (
        <Card className="text-center py-12">
          <EmptyState
            icon={Clock}
            title="Belum ada susunan acara"
            description="Mulai rancang susunan acara pernikahan dari persiapan rias, akad nikah, hingga resepsi."
            action={
              <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                <Button
                  variant="primary"
                  icon={Sparkles}
                  onClick={handleApplyTemplate}
                  disabled={loadingAction}
                >
                  Gunakan Template Lengkap (Akad &amp; Resepsi)
                </Button>
                <Button variant="secondary" icon={Plus} onClick={openCreateModal}>
                  Buat Manual
                </Button>
              </div>
            }
          />
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-10 text-ink-muted text-xs">
          Tidak ada agenda yang cocok dengan filter atau kata kunci pencarian.
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, index) => {
            const isCompleted = Boolean(item.is_completed);
            return (
              <motion.div
                key={item.id}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.02, ease: EASE }}
              >
                <Card
                  className={`p-4 transition-all duration-200 ${
                    isCompleted
                      ? "opacity-60 bg-canvas-sunken/40 dark:bg-night-sunken/40 border-line/50 dark:border-night-line/50"
                      : "hover:border-rose-500/40"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Checkbox status selesai */}
                    <button
                      type="button"
                      onClick={() => toggleRundown(item.id, !isCompleted)}
                      className={`mt-0.5 p-1 rounded-xl transition active:scale-[0.9] shrink-0 ${
                        isCompleted
                          ? "text-emerald-500 hover:text-emerald-600"
                          : "text-ink-faint hover:text-rose-500"
                      }`}
                      aria-label={isCompleted ? "Tandai belum selesai" : "Tandai selesai"}
                    >
                      {isCompleted ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                    </button>

                    {/* Konten Agenda */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono bg-canvas-sunken dark:bg-night-sunken border border-line dark:border-night-line text-ink dark:text-stone-100">
                          {item.time_start} {item.time_end ? `– ${item.time_end}` : ""}
                        </span>
                        <Badge tone={item.phase === "Akad / Pemberkatan" ? "plum" : item.phase === "Resepsi" ? "rose" : "sky"}>
                          {item.phase}
                        </Badge>
                      </div>

                      <h3
                        className={`font-semibold text-sm leading-snug ${
                          isCompleted ? "line-through text-ink-muted" : "text-ink dark:text-stone-50"
                        }`}
                      >
                        {item.title}
                      </h3>

                      {item.location && (
                        <p className="flex items-center gap-1 text-xs text-ink-muted mt-1">
                          <MapPin size={12} className="shrink-0 text-rose-500" />
                          <span>{item.location}</span>
                        </p>
                      )}

                      {item.notes && (
                        <p className="text-xs text-ink-faint mt-1.5 leading-relaxed bg-canvas-sunken/50 dark:bg-night-sunken/50 p-2 rounded-xl">
                          {item.notes}
                        </p>
                      )}

                      {/* PIC & Kontak */}
                      {item.pic_name && (
                        <div className="flex flex-wrap items-center gap-2.5 mt-2.5 pt-2 border-t border-line/60 dark:border-night-line/60 text-xs">
                          <span className="text-ink-faint">PIC:</span>
                          <span className="font-medium text-ink dark:text-stone-200">
                            {item.pic_name}
                          </span>
                          {item.pic_phone && (
                            <div className="flex items-center gap-1.5 ml-auto">
                              <a
                                href={`https://wa.me/${item.pic_phone.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 active:scale-[0.97] transition text-[11px] font-medium"
                              >
                                <MessageCircle size={11} /> WhatsApp
                              </a>
                              <a
                                href={`tel:${item.pic_phone}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-canvas-sunken dark:bg-night-sunken text-ink-muted hover:text-ink active:scale-[0.97] transition text-[11px] font-medium"
                              >
                                <Phone size={11} /> Telepon
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Tombol Aksi */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 rounded-lg text-ink-muted hover:text-ink dark:hover:text-stone-100 hover:bg-canvas-sunken dark:hover:bg-night-sunken transition"
                        aria-label="Edit agenda"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => deleteRundownEvent(item)}
                        className="p-1.5 rounded-lg text-ink-muted hover:text-rose-600 hover:bg-rose-500/10 transition"
                        aria-label="Hapus agenda"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal Tambah / Edit Agenda */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="absolute inset-0 bg-ink/60 dark:bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="relative w-full max-w-lg rounded-3xl bg-canvas-card dark:bg-night-card border border-line dark:border-night-line p-6 shadow-lift z-10 max-h-[90vh] overflow-y-auto scroll-area"
            >
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-ink-muted hover:bg-canvas-sunken dark:hover:bg-night-sunken transition"
                aria-label="Tutup"
              >
                <X size={16} />
              </button>

              <h3 className="font-display font-semibold text-base mb-1">
                {editingItem ? "Ubah Agenda Hari-H" : "Tambah Agenda Hari-H"}
              </h3>
              <p className="text-xs text-ink-faint mb-5">
                Pastikan waktu, lokasi, dan penanggung jawab terisi dengan jelas.
              </p>

              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-1">
                    Fase Acara
                  </label>
                  <select
                    value={form.phase}
                    onChange={(e) => setForm({ ...form, phase: e.target.value })}
                    className="field"
                  >
                    <option value="Persiapan">Persiapan (Make Up, Briefing, Gladhik)</option>
                    <option value="Akad / Pemberkatan">Akad Nikah / Pemberkatan</option>
                    <option value="Resepsi">Resepsi / Pesta Pernikahan</option>
                    <option value="After Party">After Party / Ramah Tamah Malam</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-1">
                      Waktu Mulai *
                    </label>
                    <input
                      type="time"
                      required
                      value={form.time_start}
                      onChange={(e) => setForm({ ...form, time_start: e.target.value })}
                      className="field"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-1">
                      Waktu Selesai (Opsional)
                    </label>
                    <input
                      type="time"
                      value={form.time_end}
                      onChange={(e) => setForm({ ...form, time_end: e.target.value })}
                      className="field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-1">
                    Nama Agenda / Aktivitas *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ijab Kabul & Penyerahan Mahar"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="field"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-1">
                    Lokasi / Ruangan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Meja Akad / Pelaminan Utama Gedung PINDAD"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="field"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-1">
                      PIC (Penanggung Jawab)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Pak Rahmat / WO Cindy"
                      value={form.pic_name}
                      onChange={(e) => setForm({ ...form, pic_name: e.target.value })}
                      className="field"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-1">
                      Nomor Telepon / WhatsApp
                    </label>
                    <input
                      type="tel"
                      placeholder="081234567890"
                      value={form.pic_phone}
                      onChange={(e) => setForm({ ...form, pic_phone: e.target.value })}
                      className="field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-1">
                    Catatan / Detail Perlengkapan
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Siapkan buku nikah, map mahar, dan mikrofon wireless."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="field resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line dark:border-night-line">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setModalOpen(false)}
                    disabled={loadingAction}
                  >
                    Batal
                  </Button>
                  <Button type="submit" variant="primary" disabled={loadingAction}>
                    {loadingAction ? "Menyimpan…" : editingItem ? "Simpan Perubahan" : "Tambahkan"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Page>
  );
}
