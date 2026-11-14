import { useState } from "react";
import {
  Sparkles,
  Mail,
  Copy,
  Check,
  Send,
  Trash2,
  Users,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Card, SectionTitle, Button, Field, Input, Badge } from "../../components/ui";
import { Avatar } from "../../components/Avatar";
import { triggerHaptic } from "../../lib/haptic";
import {
  createOrResetFriendAccount,
  generateTemporaryPassword,
  buildInviteWhatsAppMessage,
} from "../../lib/quickInvite";
import pb from "../../lib/pocketbase";

/**
 * Kartu Akses Cepat & Password Sementara Teman (Eksklusif Superadmin)
 * ---------------------------------------------------------------------------
 * Hanya meminta alamat email teman, lalu sistem otomatis:
 * 1. Membuat akun baru di database dengan role "owner"
 * 2. Mengenerate password sementara yang mudah diketik
 * 3. Menyediakan format pesan ramah siap kirim via WhatsApp dalam 1 klik
 */
export default function QuickFriendInviteCard({
  isAdmin,
  currentUser,
  partnerUsers = [],
  refreshUsers,
  cppUser,
  cpwUser,
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [resettingId, setResettingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Guard mutlak: Hanya Superadmin yang diizinkan merender atau menggunakan fitur ini
  if (!isAdmin) {
    return null;
  }

  // Filter daftar teman yang pernah diundang oleh superadmin
  const invitedFriends = (partnerUsers || []).filter(
    (u) =>
      u.app_role === "owner" &&
      u.id !== currentUser?.id &&
      u.id !== cppUser?.id &&
      u.id !== cpwUser?.id &&
      u.username !== "admin"
  );

  const handleGenerate = async (e) => {
    e?.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      toast.error("Mohon masukkan alamat email yang valid.");
      return;
    }

    setLoading(true);
    triggerHaptic("light");

    try {
      const result = await createOrResetFriendAccount({
        email: cleanEmail,
        name: name.trim(),
        existingUsers: partnerUsers,
      });

      setGeneratedResult(result);
      triggerHaptic("success");

      if (result.isNew) {
        toast.success(`Akun teman untuk ${cleanEmail} berhasil dibuat!`);
      } else {
        toast.info(`Email ${cleanEmail} sudah ada. Password sementara baru berhasil diatur!`);
      }

      setEmail("");
      setName("");
      if (typeof refreshUsers === "function") {
        await refreshUsers();
      }
    } catch (err) {
      console.error("Gagal membuat akun teman:", err);
      triggerHaptic("error");
      toast.error(err?.message || "Terjadi kesalahan saat membuat akun.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = async () => {
    if (!generatedResult?.messageText) return;
    try {
      await navigator.clipboard.writeText(generatedResult.messageText);
      setCopiedKey(true);
      triggerHaptic("selection");
      toast.success("Rincian akun & pesan WhatsApp berhasil disalin!");
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      toast.error("Gagal menyalin ke clipboard.");
    }
  };

  const handleCopyPasswordOnly = async () => {
    if (!generatedResult?.tempPassword) return;
    try {
      await navigator.clipboard.writeText(generatedResult.tempPassword);
      triggerHaptic("selection");
      toast.success("Password sementara disalin!");
    } catch {
      toast.error("Gagal menyalin password.");
    }
  };

  const handleSendWhatsApp = () => {
    if (!generatedResult?.messageText) return;
    triggerHaptic("light");
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      generatedResult.messageText
    )}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  // Reset password instan untuk akun teman yang sudah terdaftar
  const handleQuickReset = async (friendUser) => {
    setResettingId(friendUser.id);
    triggerHaptic("light");
    try {
      const newTempPassword = generateTemporaryPassword();
      await pb.collection("users").update(friendUser.id, {
        password: newTempPassword,
        passwordConfirm: newTempPassword,
      });

      const messageText = buildInviteWhatsAppMessage({
        name: friendUser.name || friendUser.username,
        email: friendUser.email,
        username: friendUser.username,
        tempPassword: newTempPassword,
      });

      setGeneratedResult({
        isNew: false,
        email: friendUser.email,
        username: friendUser.username,
        name: friendUser.name || friendUser.username,
        tempPassword: newTempPassword,
        messageText,
      });

      triggerHaptic("success");
      toast.success(`Password baru untuk ${friendUser.email} berhasil digenerate!`);
      if (typeof refreshUsers === "function") {
        await refreshUsers();
      }
    } catch (err) {
      console.error("Gagal reset password:", err);
      toast.error("Gagal mengatur ulang kata sandi.");
    } finally {
      setResettingId(null);
    }
  };

  // Hapus akun teman
  const handleDeleteFriend = async (friendUser) => {
    const confirmDelete = window.confirm(
      `Yakin ingin menghapus akun teman "${friendUser.name || friendUser.email}"?`
    );
    if (!confirmDelete) return;

    setDeletingId(friendUser.id);
    try {
      await pb.collection("users").delete(friendUser.id);
      triggerHaptic("success");
      toast.success("Akun teman berhasil dihapus.");
      if (typeof refreshUsers === "function") {
        await refreshUsers();
      }
    } catch (err) {
      console.error("Gagal menghapus akun:", err);
      toast.error("Gagal menghapus akun.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="border-rose-500/20 bg-gradient-to-br from-rose-500/[0.04] via-transparent to-amber-500/[0.04] p-5 sm:p-6">
      {/* Header Kartu */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 grid place-items-center shrink-0 border border-rose-500/20">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <SectionTitle>Undang Teman Cepat (Akses Instan)</SectionTitle>
              <Badge tone="plum">
                Khusus Superadmin
              </Badge>
            </div>
            <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
              Cukup minta email teman. Sistem akan otomatis membuat akun Owner privat dan menghasilkan kata sandi sementara.
            </p>
          </div>
        </div>
      </div>

      {/* Formulir Input Email */}
      <form onSubmit={handleGenerate} className="mt-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field
            label="Alamat Email Teman *"
            hint="Satu-satunya data wajib yang perlu Anda minta dari teman."
          >
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
              />
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama.teman@gmail.com"
                className="pl-10 text-xs"
                disabled={loading}
              />
            </div>
          </Field>

          <Field
            label="Nama Panggilan / Teman"
            hint="Opsional (otomatis diambil dari email jika dikosongkan)."
          >
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="text-xs"
              disabled={loading}
            />
          </Field>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-[11px] text-ink-faint hidden sm:block">
            * Teman otomatis mendapat ruang pernikahan kosong sendiri tanpa melihat data pernikahan Anda.
          </p>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            icon={Sparkles}
            loading={loading}
            className="w-full sm:w-auto"
          >
            {loading ? "Menyiapkan Akun…" : "Generate Akun & Password"}
          </Button>
        </div>
      </form>

      {/* Box Hasil Generate Kredensial */}
      {generatedResult && (
        <div className="mt-5 p-4 rounded-3xl bg-sage-500/10 dark:bg-sage-500/15 border border-sage-500/30 text-xs space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sage-500 animate-pulse" />
              <strong className="text-sage-800 dark:text-sage-200 font-semibold text-sm">
                {generatedResult.isNew ? "Akun Teman Berhasil Dibuat!" : "Password Sementara Baru Dihasilkan!"}
              </strong>
            </div>
            <button
              type="button"
              onClick={() => setGeneratedResult(null)}
              className="text-[11px] text-ink-muted hover:text-ink dark:hover:text-stone-100"
            >
              Tutup
            </button>
          </div>

          {/* Rincian Akun */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-white/70 dark:bg-night-card/70 border border-line/60 dark:border-night-line/60">
            <div>
              <span className="text-[11px] text-ink-faint block">Email Login:</span>
              <span className="font-semibold text-ink dark:text-stone-100 break-all">
                {generatedResult.email}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-ink-faint block">Username:</span>
              <span className="font-semibold text-ink dark:text-stone-100">
                @{generatedResult.username}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-ink-faint block">Password Sementara:</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <code className="px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 font-mono font-bold text-xs select-all">
                  {generatedResult.tempPassword}
                </code>
                <button
                  type="button"
                  onClick={handleCopyPasswordOnly}
                  className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-ink-faint hover:text-ink transition"
                  title="Salin kata sandi"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Tombol Aksi Berbagi */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={Send}
              onClick={handleSendWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-soft"
            >
              Kirim via WhatsApp
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={copiedKey ? Check : Copy}
              onClick={handleCopyMessage}
            >
              {copiedKey ? "Tersalin!" : "Salin Pesan Undangan"}
            </Button>
          </div>
        </div>
      )}

      {/* Riwayat Teman yang Pernah Diundang */}
      {invitedFriends.length > 0 && (
        <div className="mt-6 pt-5 border-t border-line/60 dark:border-night-line/60">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-ink dark:text-stone-100 flex items-center gap-1.5">
              <Users size={14} className="text-rose-500" />
              <span>Daftar Akun Teman yang Diundang ({invitedFriends.length})</span>
            </h4>
            <span className="text-[11px] text-ink-faint">
              Setiap teman memiliki dashboard pernikahan pribadi
            </span>
          </div>

          <div className="space-y-2">
            {invitedFriends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-canvas-sunken/40 dark:bg-night-sunken/40 border border-line/60 dark:border-night-line/60 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={friend.name || friend.username} size="sm" />
                  <div className="min-w-0">
                    <p className="font-semibold text-ink dark:text-stone-100 truncate">
                      {friend.name || friend.username}
                      <span className="ml-1.5 text-[11px] font-normal text-ink-faint">
                        (@{friend.username})
                      </span>
                    </p>
                    <p className="text-[11px] text-ink-muted truncate">{friend.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={RotateCcw}
                    loading={resettingId === friend.id}
                    disabled={resettingId === friend.id || deletingId === friend.id}
                    onClick={() => handleQuickReset(friend)}
                    className="text-[11px] py-1 px-2.5 h-auto"
                    title="Buat password sementara baru"
                  >
                    Reset Password
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleDeleteFriend(friend)}
                    disabled={resettingId === friend.id || deletingId === friend.id}
                    className="p-1.5 rounded-lg text-ink-faint hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Hapus akun teman"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
