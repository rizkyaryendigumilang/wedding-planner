import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Shield,
  UserPlus,
  Copy,
  Check,
  Send,
  Trash2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import {
  Page,
  PageHeader,
  Card,
  SectionTitle,
  Button,
  Field,
  Input,
  Select,
  Badge,
  EmptyState,
} from "../components/ui";
import { Avatar } from "../components/Avatar";
import { useAuth } from "../lib/auth";
import { useWedding } from "../lib/weddingData";
import pb from "../lib/pocketbase";
import { toast } from "sonner";
import { triggerHaptic } from "../lib/haptic";
import QuickFriendInviteCard from "./settings/QuickFriendInviteCard";
import { generateCleanUsername, generateTemporaryPassword, buildInviteWhatsAppMessage } from "../lib/quickInvite";

export default function UserManagement() {
  const { user: currentUser, isOwner, isAdmin } = useAuth();
  const { couple } = useWedding();
  const [activeTab, setActiveTab] = useState("profile"); // 'profile', 'team', 'permissions', 'invitations'

  const [teamUsers, setTeamUsers] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(true);

  // Form Tambah Anggota Tim
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    role: "panitia", // 'couple', 'panitia', 'wo'
    partnerRole: "None",
  });
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [createdInvite, setCreatedInvite] = useState(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const coupleId = couple?.id;
  const coupleOwner = couple?.owner;

  useEffect(() => {
    if (!coupleId) return;
    let isMounted = true;
    pb.collection("users")
      .getFullList({
        filter: `couple="${coupleId}" || id="${coupleOwner}"`,
        sort: "name,username",
      })
      .then((list) => {
        if (isMounted) {
          setTeamUsers(list);
          setLoadingTeam(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn("Gagal mengambil anggota tim:", err);
          setLoadingTeam(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [coupleId, coupleOwner]);

  const fetchTeam = useCallback(async () => {
    if (!coupleId) return;
    try {
      const list = await pb.collection("users").getFullList({
        filter: `couple="${coupleId}" || id="${coupleOwner}"`,
        sort: "name,username",
      });
      setTeamUsers(list);
    } catch (err) {
      console.warn("Gagal mengambil anggota tim:", err);
    }
  }, [coupleId, coupleOwner]);

  // Tambah anggota tim baru
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim()) {
      toast.error("Nama anggota tim wajib diisi.");
      return;
    }
    const cleanEmail = addForm.email.trim().toLowerCase();
    if (cleanEmail && !cleanEmail.includes("@")) {
      toast.error("Format email tidak valid.");
      return;
    }

    setSubmittingAdd(true);
    try {
      const tempPassword = generateTemporaryPassword();
      const username = generateCleanUsername(cleanEmail || addForm.name, addForm.name, teamUsers);

      const payload = {
        name: addForm.name.trim(),
        username,
        email: cleanEmail || `${username}@wedding.local`,
        password: tempPassword,
        passwordConfirm: tempPassword,
        app_role: addForm.role,
        couple: couple?.id,
      };

      if (addForm.role === "couple" && addForm.partnerRole !== "None") {
        payload.partner_role = addForm.partnerRole;
      }

      const record = await pb.collection("users").create(payload);

      const messageText = buildInviteWhatsAppMessage({
        name: payload.name,
        email: payload.email,
        username,
        tempPassword,
      });

      setCreatedInvite({
        record,
        username,
        tempPassword,
        email: payload.email,
        role: addForm.role,
        messageText,
      });

      toast.success(`Anggota tim ${payload.name} berhasil ditambahkan!`);
      fetchTeam();
      setAddForm({ name: "", email: "", role: "panitia", partnerRole: "None" });
    } catch (err) {
      toast.error("Gagal menambahkan anggota tim: " + (err?.message || ""));
    } finally {
      setSubmittingAdd(false);
    }
  };

  const handleDeleteMember = async (userId, memberName) => {
    if (userId === currentUser?.id) {
      toast.error("Anda tidak dapat menghapus akun Anda sendiri.");
      return;
    }
    if (!window.confirm(`Hapus akses untuk ${memberName}?`)) return;

    try {
      await pb.collection("users").delete(userId);
      toast.success(`Akses untuk ${memberName} berhasil dihapus.`);
      fetchTeam();
    } catch (err) {
      toast.error("Gagal menghapus anggota: " + (err?.message || ""));
    }
  };

  // Matriks Hak Akses
  const PERMISSIONS_MATRIX = [
    {
      feature: "Dashboard & Ringkasan Acara",
      owner: true,
      couple: true,
      panitia: true,
      wo: true,
      desc: "Melihat statistik tamu, hitung mundur, dan ringkasan persiapan",
    },
    {
      feature: "Buku Tamu & RSVP",
      owner: true,
      couple: true,
      panitia: true,
      wo: true,
      desc: "Melihat daftar tamu undangan dan status kehadiran",
    },
    {
      feature: "Meja Tamu & Check-in Hari-H",
      owner: true,
      couple: true,
      panitia: true,
      wo: true,
      desc: "Mencatat kehadiran tamu dan pembagian souvenir di resepsi",
    },
    {
      feature: "Itinerary & Susunan Acara (Rundown)",
      owner: true,
      couple: true,
      panitia: true,
      wo: true,
      desc: "Melihat dan memperbarui susunan acara akad, resepsi, & PIC",
    },
    {
      feature: "Kelola Vendor & Kontrak",
      owner: true,
      couple: true,
      panitia: false,
      wo: true,
      desc: "Melihat checklist vendor, PIC kontak, dan milestone pembayaran",
    },
    {
      feature: "Kelola Anggaran & Pengeluaran",
      owner: true,
      couple: true,
      panitia: false,
      wo: false,
      desc: "Melihat dan mengedit pos anggaran privat pengantin (Sensitif)",
    },
    {
      feature: "Pencatatan Kado & Angpao Amplop",
      owner: true,
      couple: true,
      panitia: false,
      wo: false,
      desc: "Melihat riwayat amplop tunai dan transfer QRIS digital (Sensitif)",
    },
    {
      feature: "Pengaturan Sistem & Hak Akses",
      owner: true,
      couple: false,
      panitia: false,
      wo: false,
      desc: "Menambah anggota tim, mengganti kata sandi, & cadangan data",
    },
  ];

  return (
    <Page>
      <PageHeader
        title="Manajemen Pengguna & Tim"
        subtitle="Kelola profil akun, anggota tim keluarga/WO, peran, matriks hak akses, serta undangan akses cepat"
        icon={Users}
        action={
          isOwner && (
            <Button
              variant="primary"
              icon={UserPlus}
              onClick={() => {
                setCreatedInvite(null);
                setShowAddModal(true);
              }}
            >
              Tambah Anggota Tim
            </Button>
          )
        }
      />

      {/* Tab Navigasi */}
      <div className="flex items-center gap-2 border-b border-line dark:border-night-line pb-px overflow-x-auto scrollbar-none">
        {[
          { id: "profile", label: "Profil Akun", icon: Avatar },
          { id: "team", label: `Tim & Anggota (${teamUsers.length})`, icon: Users },
          { id: "permissions", label: "Matriks Hak Akses", icon: ShieldCheck },
          { id: "invitations", label: "Undangan & Akses Cepat", icon: Send },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              triggerHaptic("selection");
              setActiveTab(t.id);
            }}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === t.id
                ? "border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-300"
                : "border-transparent text-ink-muted hover:text-ink dark:hover:text-stone-300"
            }`}
          >
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ======================= TAB 1: PROFIL PENGGUNA ======================= */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 flex flex-col items-center text-center p-6">
            <div className="relative mb-4">
              <Avatar name={currentUser?.name || currentUser?.email} size="lg" />
              <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-night-card" />
            </div>

            <h3 className="font-display font-semibold text-lg text-ink dark:text-stone-100">
              {currentUser?.name || "Pengguna"}
            </h3>
            <p className="text-xs text-ink-muted mb-3">{currentUser?.email}</p>

            <div className="flex flex-wrap items-center justify-center gap-1.5 mb-6">
              <Badge tone="rose">
                {currentUser?.app_role === "owner"
                  ? "Pemilik / Pengantin"
                  : currentUser?.app_role === "couple"
                  ? "Pasangan Mempelai"
                  : currentUser?.app_role === "wo"
                  ? "Wedding Organizer"
                  : "Panitia Keluarga"}
              </Badge>
              {currentUser?.partner_role && (
                <Badge tone="sky">{currentUser.partner_role}</Badge>
              )}
              {isAdmin && <Badge tone="amber">Superadmin</Badge>}
            </div>

            <div className="w-full text-left space-y-2.5 pt-4 border-t border-line dark:border-night-line text-xs">
              <div className="flex justify-between py-1">
                <span className="text-ink-muted">Username</span>
                <span className="font-semibold text-ink dark:text-stone-200">
                  @{currentUser?.username || "-"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-ink-muted">Status Akun</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  Aktif & Terverifikasi
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-ink-muted">Terdaftar Sejak</span>
                <span className="text-ink dark:text-stone-300">
                  {currentUser?.created
                    ? new Date(currentUser.created).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "-"}
                </span>
              </div>
            </div>
          </Card>

          <Card className="md:col-span-2 space-y-5">
            <SectionTitle
              title="Informasi Profil & Peran"
              subtitle="Detail identitas Anda dalam kepanitiaan pernikahan ini"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nama Lengkap">
                <Input value={currentUser?.name || ""} disabled readOnly />
              </Field>
              <Field label="Alamat Email">
                <Input value={currentUser?.email || ""} disabled readOnly />
              </Field>
              <Field label="Username Login">
                <Input value={currentUser?.username || ""} disabled readOnly />
              </Field>
              <Field label="Peran Pasangan (Role)">
                <Input value={currentUser?.partner_role || "Bukan Pengantin"} disabled readOnly />
              </Field>
            </div>

            <div className="p-4 rounded-2xl bg-canvas-sunken dark:bg-night-sunken border border-line dark:border-night-line flex items-start gap-3">
              <Shield size={20} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-semibold text-ink dark:text-stone-100">
                  Tingkat Hak Akses Anda:{" "}
                  {isOwner ? "Akses Penuh (Owner)" : "Akses Terbatas Operasional"}
                </p>
                <p className="text-ink-muted leading-relaxed">
                  {isOwner
                    ? "Anda memiliki kontrol penuh atas seluruh data pernikahan, termasuk pos anggaran privat, kado amplop digital, manajemen vendor, dan hak mengundang anggota tim."
                    : "Anda dapat melihat dan memperbarui susunan acara (rundown) serta check-in tamu resepsi pada hari-H."}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ======================= TAB 2: TIM & ANGGOTA ======================= */}
      {activeTab === "team" && (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionTitle
              title="Daftar Anggota Tim & Kolaborator"
              subtitle="Keluarga, panitia, dan vendor wedding organizer yang memiliki akses ke aplikasi"
            />
            {isOwner && (
              <Button
                variant="neutral"
                size="sm"
                icon={UserPlus}
                onClick={() => {
                  setCreatedInvite(null);
                  setShowAddModal(true);
                }}
              >
                Tambah Anggota
              </Button>
            )}
          </div>

          {loadingTeam ? (
            <p className="py-8 text-center text-xs text-ink-muted">Memuat daftar anggota tim…</p>
          ) : teamUsers.length === 0 ? (
            <EmptyState
              title="Belum ada anggota tim tambahan"
              description="Undang pasangan, panitia keluarga, atau wedding organizer untuk membantu mengelola acara."
            />
          ) : (
            <div className="divide-y divide-line dark:divide-night-line">
              {teamUsers.map((member) => {
                const isSelf = member.id === currentUser?.id;
                const isMemberOwner = member.app_role === "owner" || member.id === couple?.owner;

                return (
                  <div
                    key={member.id}
                    className="py-3.5 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={member.name || member.username} size="md" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-ink dark:text-stone-100 truncate">
                            {member.name || member.username}
                          </p>
                          {isSelf && <Badge tone="sage">Anda</Badge>}
                        </div>
                        <p className="text-xs text-ink-muted truncate">
                          @{member.username} • {member.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        tone={
                          isMemberOwner
                            ? "rose"
                            : member.app_role === "wo"
                            ? "plum"
                            : member.app_role === "couple"
                            ? "sky"
                            : "gray"
                        }
                      >
                        {isMemberOwner
                          ? "Owner"
                          : member.app_role === "couple"
                          ? "Pasangan"
                          : member.app_role === "wo"
                          ? "Wedding Organizer"
                          : "Panitia"}
                      </Badge>

                      {isOwner && !isSelf && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMember(member.id, member.name || member.username)}
                          className="p-2 rounded-xl text-ink-muted hover:text-rose-600 hover:bg-rose-500/10 transition"
                          title="Hapus akses anggota"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* ======================= TAB 3: MATRIKS HAK AKSES ======================= */}
      {activeTab === "permissions" && (
        <Card className="space-y-4">
          <SectionTitle
            title="Matriks Hak Akses & Pembagian Wewenang"
            subtitle="Panduan hak akses per peran untuk menjaga kerahasiaan data finansial dan kelancaran operasional"
          />

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-line dark:border-night-line text-ink-muted">
                  <th className="py-3 px-3">Fitur / Modul</th>
                  <th className="py-3 px-3 text-center">Owner</th>
                  <th className="py-3 px-3 text-center">Pasangan</th>
                  <th className="py-3 px-3 text-center">Panitia</th>
                  <th className="py-3 px-3 text-center">WO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line dark:divide-night-line">
                {PERMISSIONS_MATRIX.map((row, idx) => (
                  <tr key={idx} className="hover:bg-canvas-sunken/40 dark:hover:bg-night-sunken/40 transition">
                    <td className="py-3 px-3">
                      <span className="font-semibold block text-ink dark:text-stone-100">
                        {row.feature}
                      </span>
                      <span className="text-[11px] text-ink-muted">{row.desc}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row.owner ? (
                        <CheckCircle2 size={16} className="text-emerald-600 inline" />
                      ) : (
                        <XCircle size={16} className="text-ink-faint inline" />
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row.couple ? (
                        <CheckCircle2 size={16} className="text-emerald-600 inline" />
                      ) : (
                        <XCircle size={16} className="text-ink-faint inline" />
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row.panitia ? (
                        <CheckCircle2 size={16} className="text-emerald-600 inline" />
                      ) : (
                        <XCircle size={16} className="text-rose-500 inline" />
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row.wo ? (
                        <CheckCircle2 size={16} className="text-emerald-600 inline" />
                      ) : (
                        <XCircle size={16} className="text-rose-500 inline" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ======================= TAB 4: UNDANGAN & AKSES CEPAT ======================= */}
      {activeTab === "invitations" && (
        <div className="space-y-6">
          {isAdmin ? (
            <QuickFriendInviteCard
              isAdmin={isAdmin}
              currentUser={currentUser}
              partnerUsers={teamUsers}
              refreshUsers={fetchTeam}
              cppUser={teamUsers.find((u) => u.partner_role === "CPP")}
              cpwUser={teamUsers.find((u) => u.partner_role === "CPW")}
            />
          ) : (
            <Card className="text-center py-8">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 grid place-items-center mx-auto mb-3">
                <Send size={24} />
              </div>
              <h3 className="font-semibold text-sm">Undangan Pasangan & Panitia</h3>
              <p className="text-xs text-ink-muted max-w-md mx-auto mt-1 mb-4">
                Gunakan tab &quot;Tim &amp; Anggota&quot; untuk menambahkan akun pasangan atau panitia keluarga yang akan membantu persiapan acara.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setActiveTab("team");
                  setShowAddModal(true);
                }}
              >
                Undang Anggota Tim
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* ======================= MODAL TAMBAH ANGGOTA TIM ======================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-ink/50 dark:bg-black/70 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />

          <div className="relative w-full max-w-md bg-canvas-card dark:bg-night-card rounded-3xl border border-line dark:border-night-line p-6 shadow-lift z-10 space-y-4">
            <h3 className="font-display font-semibold text-lg text-ink dark:text-stone-100 flex items-center gap-2">
              <UserPlus size={20} className="text-rose-600" />
              Tambah Anggota Tim
            </h3>

            {createdInvite ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2">
                  <p className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 size={16} />
                    Akun Berhasil Dibuat!
                  </p>
                  <p className="text-ink-muted">
                    Username: <span className="font-semibold text-ink dark:text-stone-100">@{createdInvite.username}</span>
                  </p>
                  <p className="text-ink-muted">
                    Password Sementara:{" "}
                    <span className="font-mono font-semibold text-ink dark:text-stone-100 bg-white/50 dark:bg-black/30 px-1.5 py-0.5 rounded">
                      {createdInvite.tempPassword}
                    </span>
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(createdInvite.messageText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white font-medium text-xs hover:bg-emerald-700 transition"
                  >
                    <Send size={15} />
                    Kirim via WhatsApp
                  </a>

                  <Button
                    variant="neutral"
                    size="sm"
                    icon={copiedInvite ? Check : Copy}
                    onClick={() => {
                      navigator.clipboard.writeText(createdInvite.messageText);
                      setCopiedInvite(true);
                      setTimeout(() => setCopiedInvite(false), 2000);
                      toast.success("Pesan undangan disalin ke clipboard!");
                    }}
                  >
                    {copiedInvite ? "Tersalin!" : "Salin Format Undangan"}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddModal(false);
                      setCreatedInvite(null);
                    }}
                  >
                    Selesai & Tutup
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddMember} className="space-y-3.5">
                <Field label="Nama Panggilan / Lengkap" required>
                  <Input
                    placeholder="Contoh: Sarah / Om Bambang"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    required
                  />
                </Field>

                <Field label="Alamat Email (Opsional)">
                  <Input
                    type="email"
                    placeholder="nama@gmail.com"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  />
                </Field>

                <Field label="Peran Anggota" required>
                  <Select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                  >
                    <option value="panitia">Panitia Keluarga (Akses Rundown & Meja Tamu)</option>
                    <option value="wo">Wedding Organizer (Akses Rundown, Tamu, & Vendor)</option>
                    <option value="couple">Pasangan Mempelai (Akses Penuh)</option>
                  </Select>
                </Field>

                {addForm.role === "couple" && (
                  <Field label="Pihak Pengantin">
                    <Select
                      value={addForm.partnerRole}
                      onChange={(e) => setAddForm({ ...addForm, partnerRole: e.target.value })}
                    >
                      <option value="None">Pilih Pihak…</option>
                      <option value="CPP">CPP (Calon Pengantin Pria)</option>
                      <option value="CPW">CPW (Calon Pengantin Wanita)</option>
                    </Select>
                  </Field>
                )}

                <div className="flex items-center justify-end gap-2 pt-3">
                  <Button
                    type="button"
                    variant="neutral"
                    size="sm"
                    onClick={() => setShowAddModal(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={submittingAdd}
                  >
                    Buat Akun & Undangan
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </Page>
  );
}
