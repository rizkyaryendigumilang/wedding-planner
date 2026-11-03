import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Copy, QrCode, Check, Save, Landmark } from "lucide-react";
import { toast } from "sonner";
import { Card, Button, Badge, SectionTitle, Field, Input, Select } from "../../components/ui";
import { INDONESIAN_BANKS, formatBankAccountsForWa } from "../../lib/masterData";

const EASE = [0.22, 1, 0.36, 1];

export default function RekeningQrisTab({
  settings,
  saveSettings,
  cppNicknameResolved,
  cpwNicknameResolved,
  reduce,
  t,
}) {
  const [bankAccounts, setBankAccounts] = useState(() => settings?.bank_accounts || []);
  const [qrisImageUrl, setQrisImageUrl] = useState(() => settings?.qris_image_url || "");
  const [qrisInstruction, setQrisInstruction] = useState(
    () => settings?.qris_instruction || "Scan QRIS via BCA Mobile, GoPay, OVO, ShopeePay, atau DANA."
  );
  const [newBankForm, setNewBankForm] = useState({
    bank_name: "BCA",
    account_number: "",
    account_holder: "",
    side: "CPP",
  });
  const [showAddBank, setShowAddBank] = useState(false);
  const [savingRekening, setSavingRekening] = useState(false);
  const [savedRekening, setSavedRekening] = useState(false);

  const handleAddBankAccount = (e) => {
    e.preventDefault();
    if (!newBankForm.account_number.trim() || !newBankForm.account_holder.trim()) {
      toast.error("Nomor rekening dan nama pemilik wajib diisi.");
      return;
    }

    const newItem = {
      id: "acc_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      bank_name: newBankForm.bank_name,
      account_number: newBankForm.account_number.trim(),
      account_holder: newBankForm.account_holder.trim(),
      side: newBankForm.side,
    };

    setBankAccounts((prev) => [...prev, newItem]);
    setNewBankForm({
      bank_name: "BCA",
      account_number: "",
      account_holder: "",
      side: "CPP",
    });
    setShowAddBank(false);
    toast.success(`Rekening ${newItem.bank_name} (${newItem.account_number}) ditambahkan ke daftar.`);
  };

  const handleRemoveBankAccount = (id) => {
    const target = bankAccounts.find((b) => b.id === id);
    setBankAccounts((prev) => prev.filter((b) => b.id !== id));
    toast.info(`Rekening ${target?.bank_name || ""} dihapus dari daftar.`);
  };

  const handleSaveRekening = async () => {
    setSavingRekening(true);
    setSavedRekening(false);
    try {
      await saveSettings({
        bank_accounts: bankAccounts,
        qris_image_url: qrisImageUrl.trim(),
        qris_instruction: qrisInstruction.trim(),
      });
      setSavedRekening(true);
      toast.success(t ? t("Pengaturan rekening & QRIS berhasil disimpan.") : "Pengaturan rekening & QRIS berhasil disimpan.");
      setTimeout(() => setSavedRekening(false), 2400);
    } catch (err) {
      console.error(err);
      toast.error(t ? t("Gagal menyimpan rekening & QRIS:") + " " + (err?.message || "") : "Gagal menyimpan: " + (err?.message || ""));
    } finally {
      setSavingRekening(false);
    }
  };

  const formattedBankAccounts = formatBankAccountsForWa(bankAccounts);

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="space-y-6"
    >
      {/* Rekening Bank Mempelai */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <SectionTitle count={String(bankAccounts.length)}>
              Rekening Bank Mempelai
            </SectionTitle>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
              Daftar rekening resmi untuk transfer tanda kasih / kado pernikahan.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setShowAddBank((v) => !v)}
          >
            {showAddBank ? "Tutup Form" : "Tambah Rekening"}
          </Button>
        </div>

        {/* Form Tambah Rekening Inline */}
        <AnimatePresence>
          {showAddBank && (
            <motion.form
              initial={reduce ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleAddBankAccount}
              className="overflow-hidden mt-4 pt-4 border-t border-line dark:border-night-line"
            >
              <div className="p-4 rounded-3xl bg-canvas-sunken/60 dark:bg-night-sunken/60 border border-line dark:border-night-line space-y-4">
                <p className="text-xs font-semibold text-ink dark:text-stone-100">
                  Tambah Rekening Baru
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <Field label="Pilihan Bank / Dompet">
                    <Select
                      value={newBankForm.bank_name}
                      onChange={(e) =>
                        setNewBankForm({ ...newBankForm, bank_name: e.target.value })
                      }
                      options={INDONESIAN_BANKS.map((b) => [b.code, b.name])}
                    />
                  </Field>
                  <Field label="Pihak Pemilik">
                    <Select
                      value={newBankForm.side}
                      onChange={(e) =>
                        setNewBankForm({ ...newBankForm, side: e.target.value })
                      }
                      options={[
                        ["CPP", `CPP (${cppNicknameResolved || "Pria"})`],
                        ["CPW", `CPW (${cpwNicknameResolved || "Wanita"})`],
                        ["BERSAMA", "Kedua Mempelai (Bersama)"],
                      ]}
                    />
                  </Field>
                  <Field label="Nomor Rekening" required>
                    <Input
                      type="text"
                      value={newBankForm.account_number}
                      onChange={(e) =>
                        setNewBankForm({
                          ...newBankForm,
                          account_number: e.target.value.replace(/[^0-9]/g, ""),
                        })
                      }
                      placeholder="Contoh: 5220304910"
                      required
                    />
                  </Field>
                  <Field label="Atas Nama Pemilik" required>
                    <Input
                      type="text"
                      value={newBankForm.account_holder}
                      onChange={(e) =>
                        setNewBankForm({ ...newBankForm, account_holder: e.target.value })
                      }
                      placeholder="Contoh: Dimas Pratama"
                      required
                    />
                  </Field>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddBank(false)}
                  >
                    Batal
                  </Button>
                  <Button type="submit" variant="primary" size="sm" icon={Plus}>
                    Tambahkan ke Daftar
                  </Button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Grid Daftar Rekening */}
        <div className="mt-4">
          {bankAccounts.length === 0 ? (
            <div className="p-6 rounded-3xl border border-dashed border-line dark:border-night-line text-center">
              <Landmark size={28} className="mx-auto text-ink-faint mb-2 opacity-60" />
              <p className="text-xs font-semibold text-ink dark:text-stone-100">
                Belum ada rekening terdaftar
              </p>
              <p className="text-[11px] text-ink-muted mt-0.5">
                Klik tombol &ldquo;Tambah Rekening&rdquo; di atas untuk mendaftarkan rekening BCA, Mandiri, BRI, dll.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {bankAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-4 rounded-3xl border border-line dark:border-night-line bg-canvas-card dark:bg-night-card shadow-xs flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300">
                          {acc.bank_name}
                        </span>
                        <Badge tone={acc.side === "CPW" ? "plum" : acc.side === "CPP" ? "sky" : "sage"}>
                          {acc.side === "CPW"
                            ? cpwNicknameResolved || "CPW"
                            : acc.side === "CPP"
                            ? cppNicknameResolved || "CPP"
                            : "Bersama"}
                        </Badge>
                      </div>
                      <p className="font-mono text-base font-semibold mt-2 text-ink dark:text-stone-50 tracking-wider">
                        {acc.account_number}
                      </p>
                      <p className="text-xs text-ink-muted mt-0.5">
                        a.n. <span className="font-medium text-ink dark:text-stone-200">{acc.account_holder}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveBankAccount(acc.id)}
                      className="p-1.5 rounded-xl text-ink-faint hover:text-rose-600 hover:bg-rose-500/10 transition"
                      title="Hapus rekening"
                      aria-label="Hapus rekening"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-line/60 dark:border-night-line/60 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(acc.account_number);
                        toast.success(`No. Rekening ${acc.bank_name} (${acc.account_number}) berhasil disalin.`);
                      }}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                    >
                      <Copy size={12} /> Salin No. Rekening
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Amplop Digital QRIS */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <SectionTitle count="QRIS">Amplop Digital QRIS (Statis)</SectionTitle>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
              Sediakan barcode QRIS untuk penerimaan kado via GoPay, OVO, DANA, BCA, ShopeePay.
            </p>
          </div>
          <span className="p-2.5 rounded-2xl bg-canvas-sunken dark:bg-night-sunken text-ink-muted shrink-0">
            <QrCode size={18} />
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-4">
          <div className="lg:col-span-2 space-y-4">
            <Field
              label="Tautan / URL Gambar Barcode QRIS"
              hint="Tautan gambar barcode QRIS (dari Google Drive, hosting gambar, atau media sosial)."
            >
              <Input
                type="url"
                value={qrisImageUrl}
                onChange={(e) => setQrisImageUrl(e.target.value)}
                placeholder="https://drive.google.com/uc?id=... atau https://i.imgur.com/..."
              />
            </Field>

            <Field
              label="Petunjuk / Teks Instruksi Pembayaran"
              hint="Teks bantuan yang menjelaskan cara transfer bagi tamu undangan."
            >
              <Input
                type="text"
                value={qrisInstruction}
                onChange={(e) => setQrisInstruction(e.target.value)}
                placeholder="Scan QRIS via BCA Mobile, GoPay, OVO, DANA, atau ShopeePay."
              />
            </Field>
          </div>

          {/* Pratinjau QRIS */}
          <div className="p-4 rounded-3xl bg-canvas-sunken/60 dark:bg-night-sunken/60 border border-line dark:border-night-line text-center flex flex-col items-center justify-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint mb-2">
              Pratinjau Kartu QRIS
            </p>
            {qrisImageUrl ? (
              <div className="w-36 h-36 rounded-2xl overflow-hidden bg-white p-1 border border-line shadow-xs">
                <img
                  src={qrisImageUrl}
                  alt="QRIS Digital"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            ) : (
              <div className="w-36 h-36 rounded-2xl border-2 border-dashed border-line dark:border-night-line flex flex-col items-center justify-center text-ink-faint">
                <QrCode size={36} className="opacity-40 mb-1" />
                <span className="text-[10px]">Belum ada gambar</span>
              </div>
            )}
            <p className="text-[11px] text-ink-muted mt-2 max-w-[200px] leading-tight">
              {qrisInstruction || "Scan QRIS untuk tanda kasih"}
            </p>
          </div>
        </div>
      </Card>

      {/* Ringkasan Pesan WhatsApp Rekening */}
      {bankAccounts.length > 0 && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <SectionTitle>Format Teks WhatsApp Cepat</SectionTitle>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                Format siap pakai untuk dibagikan via chat WA saat tamu menanyakan nomor rekening.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Copy}
              onClick={() => {
                navigator.clipboard.writeText(formattedBankAccounts);
                toast.success("Format teks rekening berhasil disalin ke clipboard!");
              }}
            >
              Salin Teks WA
            </Button>
          </div>
          <div className="mt-3 p-3.5 rounded-2xl bg-[#ECE5DD] dark:bg-[#0b141a] text-xs font-mono text-stone-900 dark:text-stone-100 whitespace-pre-line border border-black/10 dark:border-white/10 leading-relaxed">
            {formattedBankAccounts}
          </div>
        </Card>
      )}

      {/* Tombol Simpan Tab Rekening */}
      <div className="flex justify-end pt-2">
        <Button
          type="button"
          variant="primary"
          icon={savedRekening ? Check : Save}
          loading={savingRekening}
          onClick={handleSaveRekening}
        >
          {savedRekening ? "Tersimpan!" : "Simpan Rekening & QRIS"}
        </Button>
      </div>
    </motion.div>
  );
}
