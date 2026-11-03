import { useState } from "react";
import { motion } from "framer-motion";
import { Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Card, Button, Badge, SectionTitle, EmptyState } from "../../components/ui";
import { formatRupiah, formatDateId } from "../../lib/format";

const EASE = [0.22, 1, 0.36, 1];

function getTrashCollectionMeta(collectionName) {
  switch (collectionName) {
    case "wedding_guests":
      return { label: "Tamu Undangan", tone: "sky" };
    case "vendor_checklists":
      return { label: "Vendor & Tugas", tone: "plum" };
    case "budgets":
      return { label: "Anggaran", tone: "sage" };
    case "cashflow_entries":
      return { label: "Arus Kas", tone: "rose" };
    case "seserahan_items":
      return { label: "Seserahan", tone: "amber" };
    default:
      return { label: collectionName, tone: "neutral" };
  }
}

function renderTrashItemDetails(item) {
  const d = item.item_data || {};
  switch (item.collection_name) {
    case "wedding_guests":
      return `${d.pax || 1} Pax • ${d.side || "CPP"}${d.group_name ? ` • ${d.group_name}` : ""}${d.table_number ? ` • Meja ${d.table_number}` : ""}`;
    case "vendor_checklists":
      return `Kategori: ${d.category || "-"}${d.total_cost ? ` • Biaya: ${formatRupiah(d.total_cost)}` : ""}`;
    case "budgets":
      return `Kategori: ${d.category || "-"} • Jenis: ${d.budget_type || "-"}${d.total_biaya ? ` • Total: ${formatRupiah(d.total_biaya)}` : ""}`;
    case "cashflow_entries":
      return `${d.kind === "income" ? "Pemasukan" : "Pengeluaran"} • ${formatRupiah(d.amount || 0)} (${d.owner || "Bersama"})`;
    case "seserahan_items":
      return `Kategori: ${d.category || "-"} • Qty: ${d.qty || 1}${d.brand ? ` • ${d.brand}` : ""}`;
    default:
      return "";
  }
}

export default function TrashTab({
  trashItems,
  restoreFromTrash,
  permanentDeleteFromTrash,
  emptyTrash,
  reduce,
}) {
  const [trashFilter, setTrashFilter] = useState("ALL");
  const [trashActionId, setTrashActionId] = useState(null);

  const filteredTrash = (trashItems || []).filter((it) => {
    if (trashFilter === "ALL") return true;
    return it.collection_name === trashFilter;
  });

  const handleRestoreItem = async (item) => {
    setTrashActionId(item.id);
    try {
      await restoreFromTrash(item);
      toast.success(`"${item.item_title}" berhasil dipulihkan!`);
    } catch (err) {
      console.error("Gagal memulihkan:", err);
      toast.error("Gagal memulihkan item: " + (err.message || "Terjadi kesalahan"));
    } finally {
      setTrashActionId(null);
    }
  };

  const handlePermanentDeleteItem = async (item) => {
    if (!confirm(`Hapus permanen "${item.item_title}"? Data ini TIDAK DAPAT dipulihkan lagi.`)) {
      return;
    }
    setTrashActionId(item.id);
    try {
      await permanentDeleteFromTrash(item.id, item.item_title);
      toast.info(`"${item.item_title}" dihapus permanen.`);
    } catch (err) {
      console.error("Gagal menghapus permanen:", err);
      toast.error("Gagal menghapus item: " + (err.message || "Terjadi kesalahan"));
    } finally {
      setTrashActionId(null);
    }
  };

  const handleEmptyTrash = async () => {
    if (
      !confirm(
        `PERINGATAN: Kosongkan seluruh tempat sampah (${trashItems?.length || 0} item)?\n\nSemua data ini akan dihapus secara permanen dan tidak dapat dikembalikan lagi.`
      )
    ) {
      return;
    }
    setTrashActionId("all");
    try {
      await emptyTrash();
      toast.info("Tempat sampah berhasil dikosongkan.");
    } catch (err) {
      console.error("Gagal mengosongkan tempat sampah:", err);
      toast.error("Gagal mengosongkan tempat sampah: " + (err.message || "Terjadi kesalahan"));
    } finally {
      setTrashActionId(null);
    }
  };

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="space-y-6"
    >
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <SectionTitle count={`${trashItems?.length || 0} item`}>
            Tempat Sampah
          </SectionTitle>
          {trashItems?.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              icon={Trash2}
              className="text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border-rose-500/20"
              loading={trashActionId === "all"}
              onClick={handleEmptyTrash}
            >
              Kosongkan Tempat Sampah
            </Button>
          )}
        </div>

        <p className="text-xs text-ink-muted leading-relaxed mt-2">
          Item yang dihapus dari Tamu, Vendor, Anggaran, Arus Kas, atau Seserahan disimpan di sini untuk menghindari kehilangan data tidak disengaja. Anda dapat memulihkannya kembali ke data aktif kapan saja, atau menghapusnya secara permanen.
        </p>

        {/* Filter Tabs */}
        {trashItems?.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-3 pb-1 border-t border-line dark:border-night-line mt-4">
            {[
              { id: "ALL", label: `Semua (${trashItems.length})` },
              { id: "wedding_guests", label: `Tamu (${trashItems.filter((i) => i.collection_name === "wedding_guests").length})` },
              { id: "vendor_checklists", label: `Vendor (${trashItems.filter((i) => i.collection_name === "vendor_checklists").length})` },
              { id: "budgets", label: `Anggaran (${trashItems.filter((i) => i.collection_name === "budgets").length})` },
              { id: "cashflow_entries", label: `Arus Kas (${trashItems.filter((i) => i.collection_name === "cashflow_entries").length})` },
              { id: "seserahan_items", label: `Seserahan (${trashItems.filter((i) => i.collection_name === "seserahan_items").length})` },
            ]
              .filter((f) => f.id === "ALL" || !f.label.includes("(0)"))
              .map((f) => (
                <button
                  key={f.id}
                  onClick={() => setTrashFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                    trashFilter === f.id
                      ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 font-semibold"
                      : "text-ink-muted hover:text-ink hover:bg-canvas-sunken dark:hover:bg-night-sunken"
                  }`}
                >
                  {f.label}
                </button>
              ))}
          </div>
        )}

        {filteredTrash.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={Trash2}
              message={trashFilter === "ALL" ? "Tempat sampah kosong" : "Tidak ada item untuk kategori ini"}
              hint="Semua item yang dihapus dari aplikasi akan muncul di sini dan dapat dipulihkan kapan saja."
            />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {filteredTrash.map((it) => {
              const meta = getTrashCollectionMeta(it.collection_name);
              const detailStr = renderTrashItemDetails(it);
              const isProcessing = trashActionId === it.id;

              return (
                <div
                  key={it.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl bg-canvas-sunken/60 dark:bg-night-sunken/60 border border-line dark:border-night-line hover:border-line-strong transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                      <h4 className="font-semibold text-sm text-ink dark:text-stone-100 truncate">
                        {it.item_title}
                      </h4>
                    </div>

                    {detailStr && (
                      <p className="text-xs text-ink-muted mt-1 font-medium">{detailStr}</p>
                    )}

                    <p className="text-[11px] text-ink-faint mt-1">
                      Dihapus oleh <span className="font-medium text-ink-muted">{it.deleted_by || "Pengguna"}</span> •{" "}
                      {formatDateId(it.created)}{" "}
                      {new Date(it.created).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={RotateCcw}
                      loading={isProcessing}
                      onClick={() => handleRestoreItem(it)}
                    >
                      Pulihkan
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      className="text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                      loading={isProcessing}
                      onClick={() => handlePermanentDeleteItem(it)}
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
