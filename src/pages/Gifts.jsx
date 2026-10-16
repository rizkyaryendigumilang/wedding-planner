import { useState, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Coins,
  Plus,
  Search,
  Download,
  Wallet,
  Building2,
  Gift,
  CheckCircle2,
  MessageCircle,
  Pencil,
  Trash2,
  Lock,
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
import { useAuth } from "../lib/auth";
import { formatRupiah } from "../lib/format";
import { exportToCsv } from "../lib/export";

const EASE = [0.22, 1, 0.36, 1];

const GIFT_TYPES = [
  "Semua",
  "Amplop Tunai",
  "Transfer Bank / QRIS",
  "Kado Fisik",
  "Logam Mulia",
  "Lainnya",
];

export default function Gifts() {
  const reduce = useReducedMotion();
  const { isPanitia } = useAuth();
  const {
    gifts = [],
    guests = [],
    giftSummary = {},
    addGift,
    updateGift,
    deleteGift,
  } = useWedding();

  const [typeFilter, setTypeFilter] = useState("Semua");
  const [thankFilter, setThankFilter] = useState("all"); // 'all', 'pending', 'sent'
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const [form, setForm] = useState({
    guest_name: "",
    guest: "",
    gift_type: "Amplop Tunai",
    amount: 0,
    item_description: "",
    destination_account: "Kotak Resepsi Utama",
    received_by: "Meja Penerima Tamu",
    thank_you_sent: false,
    notes: "",
  });

  const filteredGifts = useMemo(() => {
    return gifts.filter((g) => {
      if (typeFilter !== "Semua" && g.gift_type !== typeFilter) return false;
      if (thankFilter === "pending" && g.thank_you_sent) return false;
      if (thankFilter === "sent" && !g.thank_you_sent) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const text = `${g.guest_name} ${g.item_description || ""} ${g.destination_account || ""} ${g.notes || ""}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [gifts, typeFilter, thankFilter, query]);

  // Jika Panitia membuka halaman ini, lindungi data finansial
  if (isPanitia) {
    return (
      <Page>
        <Card className="text-center py-16 max-w-md mx-auto my-12">
          <div className="w-14 h-14 rounded-3xl bg-amber-500/15 text-amber-600 dark:text-amber-400 grid place-items-center mx-auto mb-4">
            <Lock size={28} />
          </div>
          <h2 className="font-display text-lg font-semibold mb-2">
            Akses Finansial Dilindungi
          </h2>
          <p className="text-xs text-ink-muted leading-relaxed">
            Data nominal kado dan angpao pernikahan bersifat privat dan hanya dapat dilihat oleh akun pengantin / pemilik.
          </p>
        </Card>
      </Page>
    );
  }

  const openCreateModal = () => {
    setEditingItem(null);
    setForm({
      guest_name: "",
      guest: "",
      gift_type: typeFilter === "Semua" ? "Amplop Tunai" : typeFilter,
      amount: 0,
      item_description: "",
      destination_account: "Kotak Resepsi Utama",
      received_by: "Meja Penerima Tamu",
      thank_you_sent: false,
      notes: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setForm({
      guest_name: item.guest_name || "",
      guest: item.guest || "",
      gift_type: item.gift_type || "Amplop Tunai",
      amount: Number(item.amount || 0),
      item_description: item.item_description || "",
      destination_account: item.destination_account || "Kotak Resepsi Utama",
      received_by: item.received_by || "Meja Penerima Tamu",
      thank_you_sent: Boolean(item.thank_you_sent),
      notes: item.notes || "",
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.guest_name.trim()) return;

    setLoadingAction(true);
    try {
      const payload = {
        ...form,
        amount: Number(form.amount || 0),
      };
      if (editingItem) {
        await updateGift(editingItem.id, payload);
      } else {
        await addGift(payload);
      }
      setModalOpen(false);
    } catch (err) {
      alert("Gagal menyimpan data kado: " + (err?.message || ""));
    } finally {
      setLoadingAction(false);
    }
  };

  const handleToggleThankYou = async (item) => {
    try {
      await updateGift(item.id, { thank_you_sent: !item.thank_you_sent });
    } catch (err) {
      alert("Gagal mengubah status: " + (err?.message || ""));
    }
  };

  const handleSendWaThankYou = (item) => {
    // Cari kontak telepon tamu jika terhubung ke data wedding_guests
    const matchedGuest = guests.find(
      (g) => g.id === item.guest || g.name?.toLowerCase() === item.guest_name?.toLowerCase()
    );
    const phone = matchedGuest?.phone || "";
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone
      ? cleanPhone.startsWith("0")
        ? `62${cleanPhone.slice(1)}`
        : cleanPhone.startsWith("62")
        ? cleanPhone
        : `62${cleanPhone}`
      : "";

    const msg = `Kepada Yth. ${item.guest_name},\n\nKami ucapkan terima kasih yang sebesar-besarnya atas kehadiran, doa restu, serta tanda kasih yang diberikan untuk pernikahan kami.\n\nKehadiran dan kebaikan Bapak/Ibu/Saudara/i sangat berarti bagi lembaran baru kehidupan kami.\n\nSalam hangat dan doa terbaik,\nRizky & Reina 💍`;

    const waUrl = formattedPhone
      ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;

    window.open(waUrl, "_blank");
    if (!item.thank_you_sent) {
      handleToggleThankYou(item);
    }
  };

  const handleExportCsv = () => {
    if (gifts.length === 0) return;
    const data = gifts.map((g, idx) => ({
      No: idx + 1,
      "Nama Pemberi": g.guest_name,
      "Tipe Hadiah": g.gift_type,
      "Nominal (Rp)": g.amount || 0,
      "Deskripsi Barang": g.item_description || "-",
      "Penyimpanan / Rekening": g.destination_account || "-",
      "Diterima Oleh": g.received_by || "-",
      "Ucapan Terima Kasih": g.thank_you_sent ? "Sudah Terkirim" : "Belum",
      Catatan: g.notes || "-",
    }));
    exportToCsv("rekap-angpao-kado-pernikahan.csv", data);
  };

  return (
    <Page>
      <PageHeader
        title="Pencatatan Angpao &amp; Kado"
        subtitle="Rekapitulasi amplop fisik, transfer bank, kado pernikahan, dan ucapan terima kasih."
        action={
          <div className="flex items-center gap-2">
            {gifts.length > 0 && (
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
              Catat Hadiah
            </Button>
          </div>
        }
      />

      {/* Ringkasan Angpao & Hadiah */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <StatCard
          label="Total Dana Terkumpul"
          value={formatRupiah(giftSummary.totalGiftAmount || 0)}
          sublabel="Amplop tunai + transfer"
          icon={Coins}
          tone="sage"
        />
        <StatCard
          label="Amplop Tunai"
          value={formatRupiah(giftSummary.totalCash || 0)}
          sublabel="Kotak resepsi fisik"
          icon={Wallet}
          tone="stone"
        />
        <StatCard
          label="Transfer Bank / QRIS"
          value={formatRupiah(giftSummary.totalTransfer || 0)}
          sublabel="Rekening CPP &amp; CPW"
          icon={Building2}
          tone="sky"
        />
        <StatCard
          label="Kado Fisik &amp; Logam"
          value={`${giftSummary.totalPhysical || 0} barang`}
          sublabel={`${giftSummary.totalGold || 0} logam mulia`}
          icon={Gift}
          tone="plum"
        />
      </div>

      {/* Filter & Pencarian */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
            {GIFT_TYPES.map((t) => {
              const active = typeFilter === t;
              return (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition active:scale-[0.97] ${
                    active
                      ? "bg-rose-600 text-white shadow-glow"
                      : "bg-canvas-sunken dark:bg-night-sunken text-ink-muted hover:text-ink dark:hover:text-stone-100"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-canvas-sunken dark:bg-night-sunken p-1 rounded-2xl border border-line dark:border-night-line text-xs shrink-0">
              <button
                onClick={() => setThankFilter("all")}
                className={`px-2.5 py-1 rounded-xl transition ${
                  thankFilter === "all" ? "bg-canvas-card dark:bg-night-card shadow-soft font-medium text-ink dark:text-stone-100" : "text-ink-muted"
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setThankFilter("pending")}
                className={`px-2.5 py-1 rounded-xl transition ${
                  thankFilter === "pending" ? "bg-amber-500 text-white font-medium shadow-soft" : "text-ink-muted"
                }`}
              >
                Belum Ucapkan ({giftSummary.thankYouPending || 0})
              </button>
            </div>

            <div className="relative w-full sm:w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                type="text"
                placeholder="Cari nama / barang…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="field pl-8 !py-1.5 !text-xs"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Tabel Hadiah */}
      {gifts.length === 0 ? (
        <Card className="text-center py-12">
          <EmptyState
            icon={Gift}
            title="Belum ada data amplop atau kado"
            description="Catat amplop tunai dari kotak resepsi, transfer bank, maupun kado fisik dari tamu undangan."
            action={
              <Button icon={Plus} onClick={openCreateModal}>
                Catat Hadiah Pertama
              </Button>
            }
          />
        </Card>
      ) : filteredGifts.length === 0 ? (
        <Card className="text-center py-10 text-ink-muted text-xs">
          Tidak ada data kado yang cocok dengan filter saat ini.
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredGifts.map((item, index) => {
            const isCash = item.gift_type === "Amplop Tunai" || item.gift_type === "Transfer Bank / QRIS";

            return (
              <motion.div
                key={item.id}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: Math.min(index * 0.015, 0.2), ease: EASE }}
              >
                <Card className="p-4 hover:border-rose-500/40 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge
                          tone={
                            item.gift_type === "Amplop Tunai"
                              ? "sage"
                              : item.gift_type === "Transfer Bank / QRIS"
                              ? "sky"
                              : "plum"
                          }
                        >
                          {item.gift_type}
                        </Badge>
                        {item.destination_account && (
                          <span className="text-[11px] text-ink-faint">
                            Tujuan: {item.destination_account}
                          </span>
                        )}
                        {item.thank_you_sent ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 size={11} /> Terima Kasih Terkirim
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400">
                            • Belum Ucapkan Terima Kasih
                          </span>
                        )}
                      </div>

                      <h3 className="font-display font-semibold text-sm text-ink dark:text-stone-50">
                        {item.guest_name}
                      </h3>

                      {item.item_description && (
                        <p className="text-xs text-ink-muted mt-0.5">
                          🎁 {item.item_description}
                        </p>
                      )}

                      {item.notes && (
                        <p className="text-[11px] text-ink-faint mt-1 italic">
                          "{item.notes}"
                        </p>
                      )}
                    </div>

                    {/* Nominal & Tombol Tindakan */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-line/60 dark:border-night-line/60">
                      {isCash && Number(item.amount) > 0 ? (
                        <p className="font-display font-bold text-sm sm:text-base text-rose-600 dark:text-rose-400">
                          {formatRupiah(item.amount)}
                        </p>
                      ) : (
                        <p className="text-xs font-semibold text-plum-600 dark:text-plum-400">
                          {item.item_description || "Kado Fisik"}
                        </p>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSendWaThankYou(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium transition active:scale-[0.97]"
                          title="Kirim ucapan terima kasih via WhatsApp"
                        >
                          <MessageCircle size={13} />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-xl text-ink-muted hover:text-ink hover:bg-canvas-sunken dark:hover:bg-night-sunken transition"
                          aria-label="Ubah data"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteGift(item)}
                          className="p-1.5 rounded-xl text-ink-muted hover:text-rose-600 hover:bg-rose-500/10 transition"
                          aria-label="Hapus data"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal Catat Hadiah */}
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
                {editingItem ? "Ubah Data Kado / Angpao" : "Catat Kado / Angpao Baru"}
              </h3>
              <p className="text-xs text-ink-faint mb-5">
                Semua data tersimpan aman dan terenkripsi dalam dasbor keluarga.
              </p>

              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-1">
                    Nama Tamu / Pemberi *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Contoh: Keluarga Bpk. Bambang Sutrisno"
                    value={form.guest_name}
                    onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
                    className="field"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-1">
                      Tipe Hadiah
                    </label>
                    <select
                      value={form.gift_type}
                      onChange={(e) => setForm({ ...form, gift_type: e.target.value })}
                      className="field"
                    >
                      <option value="Amplop Tunai">Amplop Tunai</option>
                      <option value="Transfer Bank / QRIS">Transfer Bank / QRIS</option>
                      <option value="Kado Fisik">Kado Fisik (Barang)</option>
                      <option value="Logam Mulia">Logam Mulia (Emas)</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-1">
                      Nominal Uang (Rp)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={form.amount || ""}
                      onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                      className="field font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-1">
                    Deskripsi Barang / Kado (Jika Ada)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Blender Philips HR2221 / Emas Antam 2 gr"
                    value={form.item_description}
                    onChange={(e) => setForm({ ...form, item_description: e.target.value })}
                    className="field"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-1">
                      Kotak / Rekening Tujuan
                    </label>
                    <input
                      type="text"
                      placeholder="Kotak Resepsi Utama / BCA CPP"
                      value={form.destination_account}
                      onChange={(e) => setForm({ ...form, destination_account: e.target.value })}
                      className="field"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-1">
                      Diterima Oleh
                    </label>
                    <input
                      type="text"
                      placeholder="Meja Penerima Tamu / Transfer Langsung"
                      value={form.received_by}
                      onChange={(e) => setForm({ ...form, received_by: e.target.value })}
                      className="field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-1">
                    Catatan Khusus
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Diberikan langsung oleh Ibu Ani saat di pelaminan."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="field resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 p-3 rounded-2xl bg-canvas-sunken dark:bg-night-sunken border border-line dark:border-night-line">
                  <input
                    type="checkbox"
                    id="thankYouSent"
                    checked={form.thank_you_sent}
                    onChange={(e) => setForm({ ...form, thank_you_sent: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <label htmlFor="thankYouSent" className="text-xs font-medium cursor-pointer">
                    Sudah mengirimkan ucapan terima kasih kepada pemberi
                  </label>
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
                    {loadingAction ? "Menyimpan…" : editingItem ? "Simpan Perubahan" : "Catat Hadiah"}
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
