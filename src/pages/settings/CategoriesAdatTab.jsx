import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, X, RotateCcw, Check, Save } from "lucide-react";
import { toast } from "sonner";
import { Card, Button, SectionTitle, Input } from "../../components/ui";
import {
  DEFAULT_BUDGET_CATEGORIES,
  DEFAULT_VENDOR_CATEGORIES,
  TRADITIONAL_CUSTOM_PRESETS,
  TRADITIONAL_VENDOR_PRESETS,
} from "../../lib/masterData";

const EASE = [0.22, 1, 0.36, 1];

export default function CategoriesAdatTab({
  settings,
  saveSettings,
  reduce,
  t,
}) {
  const [customBudgetCategories, setCustomBudgetCategories] = useState(
    () => settings?.custom_budget_categories || DEFAULT_BUDGET_CATEGORIES
  );
  const [customVendorCategories, setCustomVendorCategories] = useState(
    () => settings?.custom_vendor_categories || DEFAULT_VENDOR_CATEGORIES
  );
  const [newBudgetCatInput, setNewBudgetCatInput] = useState("");
  const [newVendorCatInput, setNewVendorCatInput] = useState("");
  const [savingCategories, setSavingCategories] = useState(false);
  const [savedCategories, setSavedCategories] = useState(false);

  const handleAddBudgetCategory = (catName) => {
    const val = (catName || newBudgetCatInput).trim();
    if (!val) return;
    if (customBudgetCategories.map((c) => c.toLowerCase()).includes(val.toLowerCase())) {
      toast.error(`Kategori "${val}" sudah ada.`);
      return;
    }
    setCustomBudgetCategories((prev) => [...prev, val]);
    setNewBudgetCatInput("");
    toast.success(`Kategori "${val}" ditambahkan.`);
  };

  const handleRemoveBudgetCategory = (cat) => {
    if (customBudgetCategories.length <= 1) {
      toast.error("Minimal harus ada 1 kategori anggaran.");
      return;
    }
    setCustomBudgetCategories((prev) => prev.filter((c) => c !== cat));
  };

  const handleResetBudgetCategories = () => {
    if (!confirm("Kembalikan daftar kategori anggaran ke susunan bawaan?")) return;
    setCustomBudgetCategories(DEFAULT_BUDGET_CATEGORIES);
    toast.info("Kategori anggaran diatur ulang ke bawaan.");
  };

  const handleAddVendorCategory = (catName) => {
    const val = (catName || newVendorCatInput).trim();
    if (!val) return;
    if (customVendorCategories.map((c) => c.toLowerCase()).includes(val.toLowerCase())) {
      toast.error(`Kategori "${val}" sudah ada.`);
      return;
    }
    setCustomVendorCategories((prev) => [...prev, val]);
    setNewVendorCatInput("");
    toast.success(`Kategori vendor "${val}" ditambahkan.`);
  };

  const handleRemoveVendorCategory = (cat) => {
    if (customVendorCategories.length <= 1) {
      toast.error("Minimal harus ada 1 kategori vendor.");
      return;
    }
    setCustomVendorCategories((prev) => prev.filter((c) => c !== cat));
  };

  const handleResetVendorCategories = () => {
    if (!confirm("Kembalikan daftar kategori vendor ke susunan bawaan?")) return;
    setCustomVendorCategories(DEFAULT_VENDOR_CATEGORIES);
    toast.info("Kategori vendor diatur ulang ke bawaan.");
  };

  const handleSaveCategories = async () => {
    setSavingCategories(true);
    setSavedCategories(false);
    try {
      await saveSettings({
        custom_budget_categories: customBudgetCategories,
        custom_vendor_categories: customVendorCategories,
      });
      setSavedCategories(true);
      toast.success(t ? t("Kategori anggaran & vendor berhasil disimpan.") : "Kategori anggaran & vendor berhasil disimpan.");
      setTimeout(() => setSavedCategories(false), 2400);
    } catch (err) {
      console.error(err);
      toast.error(t ? t("Gagal menyimpan kategori:") + " " + (err?.message || "") : "Gagal menyimpan: " + (err?.message || ""));
    } finally {
      setSavingCategories(false);
    }
  };

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="space-y-6"
    >
      {/* Kategori Anggaran */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <SectionTitle count={String(customBudgetCategories.length)}>
              Kategori Anggaran &amp; Pos Biaya
            </SectionTitle>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
              Kategori yang didaftarkan di sini otomatis muncul sebagai pilihan saat mencatat anggaran baru.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={RotateCcw}
            onClick={handleResetBudgetCategories}
          >
            Reset Bawaan
          </Button>
        </div>

        {/* Rekomendasi Rangkaian Adat */}
        <div className="mt-4 p-3.5 rounded-2xl bg-canvas-sunken/60 dark:bg-night-sunken/60 border border-line dark:border-night-line">
          <span className="text-[11px] font-semibold text-ink-muted block mb-2">
            ✨ Tambah Cepat Rangkaian Tradisi Adat:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {TRADITIONAL_CUSTOM_PRESETS.filter(
              (p) => !customBudgetCategories.map((c) => c.toLowerCase()).includes(p.toLowerCase())
            ).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleAddBudgetCategory(preset)}
                className="px-2.5 py-1 rounded-xl text-xs font-medium bg-canvas-card dark:bg-night-card border border-line dark:border-night-line hover:border-rose-500 hover:text-rose-600 transition inline-flex items-center gap-1 shadow-2xs"
              >
                <Plus size={12} /> {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Input Tambah Kategori Anggaran */}
        <div className="flex items-center gap-2 mt-4">
          <Input
            type="text"
            placeholder="Ketik kategori baru (contoh: Acara Siraman, Seserahan, After Party)"
            value={newBudgetCatInput}
            onChange={(e) => setNewBudgetCatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddBudgetCategory();
              }
            }}
            className="flex-1"
          />
          <Button
            type="button"
            variant="secondary"
            icon={Plus}
            onClick={() => handleAddBudgetCategory()}
          >
            Tambah
          </Button>
        </div>

        {/* Chips Kategori Aktif */}
        <div className="mt-4 flex flex-wrap gap-2">
          {customBudgetCategories.map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold bg-rose-500/10 text-rose-800 dark:text-rose-200 border border-rose-500/20"
            >
              <span>{cat}</span>
              <button
                type="button"
                onClick={() => handleRemoveBudgetCategory(cat)}
                className="hover:text-rose-600 transition"
                title={`Hapus kategori ${cat}`}
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      </Card>

      {/* Kategori Checklist Vendor */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <SectionTitle count={String(customVendorCategories.length)}>
              Kategori Checklist Vendor
            </SectionTitle>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
              Pengelompokan tugas dan konfirmasi vendor pada modul Checklist Vendor.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={RotateCcw}
            onClick={handleResetVendorCategories}
          >
            Reset Bawaan
          </Button>
        </div>

        {/* Rekomendasi Tugas Vendor */}
        <div className="mt-4 p-3.5 rounded-2xl bg-canvas-sunken/60 dark:bg-night-sunken/60 border border-line dark:border-night-line">
          <span className="text-[11px] font-semibold text-ink-muted block mb-2">
            ✨ Tambah Cepat Kategori Tugas:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {TRADITIONAL_VENDOR_PRESETS.filter(
              (p) => !customVendorCategories.map((c) => c.toLowerCase()).includes(p.toLowerCase())
            ).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleAddVendorCategory(preset)}
                className="px-2.5 py-1 rounded-xl text-xs font-medium bg-canvas-card dark:bg-night-card border border-line dark:border-night-line hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-300 transition inline-flex items-center gap-1 shadow-2xs"
              >
                <Plus size={12} /> {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Input Tambah Kategori Vendor */}
        <div className="flex items-center gap-2 mt-4">
          <Input
            type="text"
            placeholder="Ketik kategori vendor baru (contoh: Properti Adat, Fitting Baju)"
            value={newVendorCatInput}
            onChange={(e) => setNewVendorCatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddVendorCategory();
              }
            }}
            className="flex-1"
          />
          <Button
            type="button"
            variant="secondary"
            icon={Plus}
            onClick={() => handleAddVendorCategory()}
          >
            Tambah
          </Button>
        </div>

        {/* Chips Kategori Vendor Aktif */}
        <div className="mt-4 flex flex-wrap gap-2">
          {customVendorCategories.map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold bg-amber-500/10 text-amber-800 dark:text-amber-200 border border-amber-500/20"
            >
              <span>{cat}</span>
              <button
                type="button"
                onClick={() => handleRemoveVendorCategory(cat)}
                className="hover:text-amber-600 transition"
                title={`Hapus kategori ${cat}`}
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      </Card>

      {/* Tombol Simpan Kategori */}
      <div className="flex justify-end pt-2">
        <Button
          type="button"
          variant="primary"
          icon={savedCategories ? Check : Save}
          loading={savingCategories}
          onClick={handleSaveCategories}
        >
          {savedCategories ? "Tersimpan!" : "Simpan Kategori Adat & Vendor"}
        </Button>
      </div>
    </motion.div>
  );
}
