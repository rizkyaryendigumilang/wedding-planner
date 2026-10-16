import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Settings as SettingsIcon,
  Heart,
  Users,
  Send,
  Bell,
  Palette,
  Image as ImageIcon,
  FileSpreadsheet,
  FileJson,
  ShieldCheck,
  Laptop,
  Moon,
  Sun,
  Save,
  ExternalLink,
  Check,
  LogOut,
  Download,
  Printer,
  Radio,
  RefreshCw,
  KeyRound,
  AlertTriangle,
  RotateCcw,
  CheckCheck,
  Upload,
  Eye,
  EyeOff,
  UserPlus,
  Trash2,
  Lock,
  Shield,
} from "lucide-react";
import {
  Page,
  PageHeader,
  Card,
  Button,
  Field,
  Input,
  SectionTitle,
  Badge,
  Loading,
  KeyValue,
  EmptyState,
} from "../components/ui";
import { Avatar } from "../components/Avatar";
import { PWAInstallButton, PWAInstallBanner } from "../components/PWAInstallPrompt";
import { useWedding } from "../lib/weddingData";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import { formatDateId, formatRupiah } from "../lib/format";
import { isDriveFolder, toDriveOpenUrl } from "../lib/photos";
import { exportToCsv, exportToJson, printReport } from "../lib/export";
import pb from "../lib/pocketbase";

const EASE = [0.22, 1, 0.36, 1];

const DEFAULT_WA_TEMPLATE = `Kepada Yth. {nama},

Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri pernikahan kami:

💍 Rizky & Reina
📅 17 Februari 2028
📍 Gedung PINDAD, Bandung

Tautan undangan dan konfirmasi kehadiran (RSVP) dapat diakses melalui:
{link}

Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.

Terima kasih,
Rizky & Reina`;

const TABS = [
  { id: "acara", label: "Acara & Pasangan", icon: Heart },
  { id: "pasangan", label: "Akun & Hak Akses", icon: Users },
  { id: "undangan", label: "Undangan & WA", icon: Send },
  { id: "alerts", label: "Peringatan & Alerts", icon: Bell },
  { id: "tampilan", label: "Tampilan & Tema", icon: Palette },
  { id: "prewedding", label: "Prewedding & Galeri", icon: ImageIcon },
  { id: "cadangan", label: "Ekspor & Cadangan", icon: FileSpreadsheet },
  { id: "sampah", label: "Tempat Sampah", icon: Trash2 },
  { id: "keamanan", label: "Kata Sandi", icon: ShieldCheck },
  { id: "sistem", label: "Sistem & PWA", icon: Laptop },
];

export default function Settings() {
  const {
    settings,
    gallerySummary,
    couple,
    photos,
    budgets,
    cashflow,
    administrations,
    vendors,
    guests,
    seserahan,
    logs,
    saveSettings,
    saveCouple,
    addLog,
    loading,
    reload,
    isLiveConnected,
    lastLiveUpdate,
    trashItems,
    restoreFromTrash,
    permanentDeleteFromTrash,
    emptyTrash,
  } = useWedding();
  const { user, logout, isSuperuser, displayName, isPanitia } = useAuth();
  const { isDark, toggle, followsSystem } = useTheme();
  const reduce = useReducedMotion();

  const [rawActiveTab, setActiveTab] = useState("acara");
  const activeTab =
    isPanitia && (rawActiveTab === "pasangan" || rawActiveTab === "cadangan" || rawActiveTab === "sampah")
      ? "acara"
      : rawActiveTab;

  // --- Form 1: Acara & Pasangan ---
  const [cppNickname, setCppNickname] = useState("");
  const [cppFullName, setCppFullName] = useState("");
  const [cpwNickname, setCpwNickname] = useState("");
  const [cpwFullName, setCpwFullName] = useState("");
  const [weddingDate, setWeddingDate] = useState("2028-02-17");
  const [venue, setVenue] = useState("");
  const [targetBudget, setTargetBudget] = useState(150000000);
  const [savingCouple, setSavingCouple] = useState(false);
  const [savedCouple, setSavedCouple] = useState(false);

  // --- Form 2: Akun Pasangan (Skema 2 Akun) ---
  const [partnerUsers, setPartnerUsers] = useState([]);
  const [showCreateReina, setShowCreateReina] = useState(false);
  const [reinaForm, setReinaForm] = useState({
    username: "reina",
    name: "Reina Nurulita",
    email: "reina@wedding.local",
    password: "reina123",
  });
  const [creatingReina, setCreatingReina] = useState(false);
  const [reinaMsg, setReinaMsg] = useState(null);

  // --- Form 2b: Akun Panitia & WO (Hak Akses Terbatas) ---
  const [showCreatePanitia, setShowCreatePanitia] = useState(false);
  const [panitiaForm, setPanitiaForm] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    app_role: "panitia",
  });
  const [creatingPanitia, setCreatingPanitia] = useState(false);
  const [panitiaMsg, setPanitiaMsg] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  // --- Form 3: Undangan & WhatsApp ---
  const [invitationUrl, setInvitationUrl] = useState("");
  const [waTemplate, setWaTemplate] = useState(DEFAULT_WA_TEMPLATE);
  const [showWaPreview, setShowWaPreview] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedSettings, setSavedSettings] = useState(false);

  // --- Form 4: Peringatan & Alerts ---
  const [alertVendorDeadline, setAlertVendorDeadline] = useState(true);
  const [alertVendorDays, setAlertVendorDays] = useState(7);
  const [alertBudgetOverrun, setAlertBudgetOverrun] = useState(true);
  const [alertRsvpReminder, setAlertRsvpReminder] = useState(true);
  const [savingAlerts, setSavingAlerts] = useState(false);
  const [savedAlerts, setSavedAlerts] = useState(false);
  const [notifPermission, setNotifPermission] = useState(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    return Notification.permission;
  });

  // --- Form 5: Prewedding ---
  const [drive, setDrive] = useState("");
  const [title, setTitle] = useState("");
  const [preweddingDone, setPreweddingDone] = useState(false);
  const [showOnDashboard, setShowOnDashboard] = useState(true);
  const [savingGallery, setSavingGallery] = useState(false);
  const [savedGallery, setSavedGallery] = useState(false);

  // --- Form 6: Keamanan / Ganti Password ---
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passSaving, setPassSaving] = useState(false);
  const [passStatus, setPassStatus] = useState(null);

  // --- Impor / Restore JSON ---
  const fileInputRef = useRef(null);
  const [restoreStatus, setRestoreStatus] = useState(null);

  // --- Tempat Sampah ---
  const [trashActionId, setTrashActionId] = useState(null);
  const [trashFilter, setTrashFilter] = useState("ALL");

  // Ambil daftar user partner untuk Skema 2 Akun
  const refreshUsers = useCallback(async () => {
    try {
      const records = await pb.collection("users").getFullList({ sort: "created" });
      setPartnerUsers(records);
    } catch (err) {
      console.warn("Gagal mengambil daftar pengguna:", err);
    }
  }, []);

  useEffect(() => {
    let active = true;
    pb.collection("users")
      .getFullList({ sort: "created" })
      .then((records) => {
        if (active) setPartnerUsers(records);
      })
      .catch((err) => {
        console.warn("Gagal mengambil daftar pengguna:", err);
      });
    return () => {
      active = false;
    };
  }, []);

  // Isi form begitu data pernikahan termuat
  const snapshot = `${couple?.id || ""}|${couple?.cpp_nickname || ""}|${couple?.cpw_nickname || ""}|${
    couple?.wedding_date || ""
  }|${couple?.venue || ""}|${couple?.target_budget || 0}|${gallerySummary.driveLink || ""}|${
    gallerySummary.title || ""
  }|${settings?.prewedding_done ? 1 : 0}|${
    settings?.show_gallery_on_dashboard === false ? 0 : 1
  }|${settings?.invitation_base_url || ""}|${settings?.wa_invitation_template || ""}|${
    settings?.alert_vendor_deadline ? 1 : 0
  }|${settings?.alert_vendor_days || 7}|${settings?.alert_budget_overrun ? 1 : 0}|${
    settings?.alert_rsvp_reminder ? 1 : 0
  }`;
  const [loadedSnapshot, setLoadedSnapshot] = useState(null);

  if (!loading && snapshot !== loadedSnapshot) {
    setLoadedSnapshot(snapshot);
    setCppNickname(couple?.cpp_nickname || "");
    setCppFullName(couple?.cpp_full_name || "");
    setCpwNickname(couple?.cpw_nickname || "");
    setCpwFullName(couple?.cpw_full_name || "");
    setWeddingDate(couple?.wedding_date ? couple.wedding_date.slice(0, 10) : "2028-02-17");
    setVenue(couple?.venue || "");
    setTargetBudget(couple?.target_budget || 150000000);

    setDrive(gallerySummary.driveLink || "");
    setTitle(gallerySummary.title || "");
    setPreweddingDone(Boolean(settings?.prewedding_done));
    setShowOnDashboard(settings?.show_gallery_on_dashboard ?? true);

    setInvitationUrl(settings?.invitation_base_url || "");
    setWaTemplate(settings?.wa_invitation_template || DEFAULT_WA_TEMPLATE);

    setAlertVendorDeadline(settings?.alert_vendor_deadline ?? true);
    setAlertVendorDays(settings?.alert_vendor_days ?? 7);
    setAlertBudgetOverrun(settings?.alert_budget_overrun ?? true);
    setAlertRsvpReminder(settings?.alert_rsvp_reminder ?? true);
  }

  // --- DETEKSI PERUBAHAN HALUS (DIRTY STATE INDICATORS) ---
  const isCoupleDirty =
    cppNickname !== (couple?.cpp_nickname || "") ||
    cppFullName !== (couple?.cpp_full_name || "") ||
    cpwNickname !== (couple?.cpw_nickname || "") ||
    cpwFullName !== (couple?.cpw_full_name || "") ||
    weddingDate !== (couple?.wedding_date ? couple.wedding_date.slice(0, 10) : "2028-02-17") ||
    venue !== (couple?.venue || "") ||
    Number(targetBudget) !== (couple?.target_budget || 150000000);

  const isInvitationDirty =
    invitationUrl !== (settings?.invitation_base_url || "") ||
    waTemplate !== (settings?.wa_invitation_template || DEFAULT_WA_TEMPLATE);

  const isAlertsDirty =
    alertVendorDeadline !== (settings?.alert_vendor_deadline ?? true) ||
    Number(alertVendorDays) !== (settings?.alert_vendor_days ?? 7) ||
    alertBudgetOverrun !== (settings?.alert_budget_overrun ?? true) ||
    alertRsvpReminder !== (settings?.alert_rsvp_reminder ?? true);

  const isGalleryDirty =
    drive !== (gallerySummary.driveLink || "") ||
    title !== (gallerySummary.title || "") ||
    preweddingDone !== Boolean(settings?.prewedding_done) ||
    showOnDashboard !== (settings?.show_gallery_on_dashboard ?? true);

  const availableTabs = isPanitia
    ? TABS.filter((t) => t.id !== "pasangan" && t.id !== "cadangan" && t.id !== "sampah")
    : TABS;

  const tabDirtyMap = {
    acara: isCoupleDirty,
    undangan: isInvitationDirty,
    alerts: isAlertsDirty,
    prewedding: isGalleryDirty,
  };

  const isAnyDirty = isCoupleDirty || isInvitationDirty || isAlertsDirty || isGalleryDirty;

  if (loading) return <Loading label="Memuat pengaturan…" />;

  // 1. Simpan Data Acara & Pasangan
  const handleSaveCouple = async (e) => {
    e?.preventDefault();
    setSavingCouple(true);
    setSavedCouple(false);
    try {
      await saveCouple({
        cpp_nickname: cppNickname.trim(),
        cpp_full_name: cppFullName.trim(),
        cpw_nickname: cpwNickname.trim(),
        cpw_full_name: cpwFullName.trim(),
        wedding_date: weddingDate,
        venue: venue.trim(),
        target_budget: Number(targetBudget) || 0,
      });
      setSavedCouple(true);
      setTimeout(() => setSavedCouple(false), 2400);
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan data acara: " + (err?.message || err));
    } finally {
      setSavingCouple(false);
    }
  };

  // 2. Buat Akun Pasangan (Reina - CPW)
  const handleCreateReina = async (e) => {
    e.preventDefault();
    setCreatingReina(true);
    setReinaMsg(null);
    try {
      await pb.collection("users").create({
        username: reinaForm.username.trim().toLowerCase(),
        name: reinaForm.name.trim(),
        email: reinaForm.email.trim(),
        password: reinaForm.password,
        passwordConfirm: reinaForm.password,
        partner_role: "CPW",
      });
      setReinaMsg({
        type: "success",
        message: `Akun ${reinaForm.name} berhasil dibuat! Username: "${reinaForm.username}", Password: "${reinaForm.password}". Berikan kredensial ini ke Reina untuk masuk di HP-nya.`,
      });
      await refreshUsers();
      setShowCreateReina(false);
      if (addLog) {
        addLog(`Akun pasangan (${reinaForm.name}) berhasil didaftarkan`, "info");
      }
    } catch (err) {
      setReinaMsg({
        type: "error",
        message: err?.message || "Gagal membuat akun pasangan.",
      });
    } finally {
      setCreatingReina(false);
    }
  };

  // 2b. Buat Akun Panitia / WO (Hak Akses Terbatas)
  const handleCreatePanitia = async (e) => {
    e.preventDefault();
    setCreatingPanitia(true);
    setPanitiaMsg(null);
    try {
      const cleanUsername = panitiaForm.username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");
      if (!cleanUsername) throw new Error("Username wajib diisi (hanya huruf, angka, titik, atau strip).");
      if (!panitiaForm.password || panitiaForm.password.length < 6) {
        throw new Error("Kata sandi minimal 6 karakter.");
      }
      const cleanEmail = panitiaForm.email.trim() || `${cleanUsername}@panitia.local`;

      await pb.collection("users").create({
        username: cleanUsername,
        name: panitiaForm.name.trim() || cleanUsername,
        email: cleanEmail,
        password: panitiaForm.password,
        passwordConfirm: panitiaForm.password,
        app_role: panitiaForm.app_role || "panitia",
        couple: couple?.id || null,
        emailVisibility: false,
      });

      const roleLabel = panitiaForm.app_role === "wo" ? "Wedding Organizer (WO)" : "Panitia Meja / Acara";
      setPanitiaMsg({
        type: "success",
        message: `Akun ${roleLabel} "${panitiaForm.name || cleanUsername}" berhasil dibuat! Username: "${cleanUsername}" & Kata Sandi: "${panitiaForm.password}".`,
      });
      setPanitiaForm({
        username: "",
        name: "",
        email: "",
        password: "",
        app_role: "panitia",
      });
      setShowCreatePanitia(false);
      await refreshUsers();
      if (addLog) {
        addLog(`Akun panitia (${cleanUsername} - ${roleLabel}) berhasil dibuat`, "info");
      }
    } catch (err) {
      setPanitiaMsg({
        type: "error",
        message: err?.message || "Gagal membuat akun panitia.",
      });
    } finally {
      setCreatingPanitia(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Yakin ingin menghapus akses akun "${userName}"? Akun ini tidak akan dapat login lagi.`)) return;
    setDeletingUserId(userId);
    try {
      await pb.collection("users").delete(userId);
      await refreshUsers();
      if (addLog) {
        addLog(`Akun panitia (${userName}) telah dihapus`, "warning");
      }
    } catch (err) {
      alert("Gagal menghapus akun: " + (err?.message || err));
    } finally {
      setDeletingUserId(null);
    }
  };

  // 3. Simpan Tautan Undangan & Template WhatsApp
  const handleSaveInvitation = async () => {
    setSavingSettings(true);
    setSavedSettings(false);
    try {
      await saveSettings({
        invitation_base_url: invitationUrl.trim(),
        wa_invitation_template: waTemplate.trim(),
      });
      setSavedSettings(true);
      setTimeout(() => setSavedSettings(false), 2400);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  // 4. Simpan Pengaturan Peringatan & Alerts
  const handleSaveAlerts = async () => {
    setSavingAlerts(true);
    setSavedAlerts(false);
    try {
      await saveSettings({
        alert_vendor_deadline: alertVendorDeadline,
        alert_vendor_days: Number(alertVendorDays) || 7,
        alert_budget_overrun: alertBudgetOverrun,
        alert_rsvp_reminder: alertRsvpReminder,
      });
      setSavedAlerts(true);
      setTimeout(() => setSavedAlerts(false), 2400);
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan preferensi alert: " + (err?.message || err));
    } finally {
      setSavingAlerts(false);
    }
  };

  const requestNotif = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const p = await Notification.requestPermission();
      setNotifPermission(p);
    }
  };

  // 5. Simpan Galeri & Prewedding
  const handleSaveGallery = async () => {
    setSavingGallery(true);
    setSavedGallery(false);
    try {
      await saveSettings({
        prewed_drive_link: drive.trim(),
        prewedding_done: preweddingDone,
        gallery_title: title.trim(),
        show_gallery_on_dashboard: showOnDashboard,
      });
      setSavedGallery(true);
      setTimeout(() => setSavedGallery(false), 2400);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingGallery(false);
    }
  };

  // 6. Ubah Kata Sandi
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPassStatus({ type: "error", message: "Kata sandi baru minimal 8 karakter." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassStatus({ type: "error", message: "Konfirmasi kata sandi tidak cocok." });
      return;
    }
    setPassSaving(true);
    setPassStatus(null);
    try {
      await pb.collection("users").update(user.id, {
        password: newPassword,
        passwordConfirm: confirmPassword,
      });
      setPassStatus({ type: "success", message: "Kata sandi berhasil diperbarui!" });
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPassStatus(null), 3500);
    } catch (err) {
      setPassStatus({ type: "error", message: err?.message || "Gagal mengubah kata sandi." });
    } finally {
      setPassSaving(false);
    }
  };

  // 7. Ekspor CSV
  const exportGuestsCsv = () => {
    const headers = [
      { key: "name", label: "Nama Tamu" },
      { key: "category", label: "Kategori" },
      { key: "side", label: "Pihak" },
      { key: "priority", label: "Prioritas" },
      { key: "pax", label: "Jumlah Pax" },
      { key: "status", label: "Status RSVP" },
      { key: "phone", label: "No. WhatsApp" },
      { key: "invitation_sent", label: "Sudah Kirim Undangan", format: (v) => (v ? "Ya" : "Belum") },
      { key: "invitation_url", label: "Link Undangan Personal" },
      { key: "notes", label: "Catatan" },
    ];
    exportToCsv("Daftar_Tamu_Rizky_Reina.csv", headers, guests);
  };

  const exportBudgetsCsv = () => {
    const headers = [
      { key: "category", label: "Kategori" },
      { key: "item", label: "Nama Pos / Item" },
      { key: "allocated", label: "Alokasi Target (Rp)", format: (v) => v || 0 },
      { key: "actual", label: "Realisasi (Rp)", format: (v) => v || 0 },
      { key: "selisih", label: "Selisih (Rp)", format: (_, r) => (r.allocated || 0) - (r.actual || 0) },
      { key: "paid_by", label: "Ditanggung Oleh" },
      { key: "notes", label: "Catatan" },
    ];
    exportToCsv("Rencana_Anggaran_Rizky_Reina.csv", headers, budgets);
  };

  const exportVendorsCsv = () => {
    const headers = [
      { key: "category", label: "Kategori" },
      { key: "name", label: "Nama Vendor" },
      { key: "contact", label: "Kontak / PIC" },
      { key: "phone", label: "No. HP / WA" },
      { key: "cost", label: "Biaya (Rp)", format: (v) => v || 0 },
      { key: "due_date", label: "Tenggat Waktu" },
      { key: "done", label: "Status Selesai", format: (v) => (v ? "Selesai" : "Belum") },
      { key: "notes", label: "Catatan" },
    ];
    exportToCsv("Daftar_Vendor_Rizky_Reina.csv", headers, vendors);
  };

  const exportSeserahanCsv = () => {
    const headers = [
      { key: "side", label: "Pihak (CPP/CPW)" },
      { key: "box_number", label: "Nomor Kotak" },
      { key: "title", label: "Nama Barang / Item" },
      { key: "purchased", label: "Sudah Dibeli", format: (v) => (v ? "Sudah" : "Belum") },
      { key: "packed", label: "Sudah Dihias/Bungkus", format: (v) => (v ? "Sudah" : "Belum") },
      { key: "cost", label: "Biaya (Rp)", format: (v) => v || 0 },
      { key: "notes", label: "Catatan" },
    ];
    exportToCsv("Daftar_Seserahan_Rizky_Reina.csv", headers, seserahan);
  };

  const exportFullBackupJson = () => {
    const snapshotData = {
      exported_at: new Date().toISOString(),
      couple,
      settings,
      budgets,
      cashflow,
      administrations,
      vendors,
      guests,
      seserahan,
      logs,
    };
    const dateStr = new Date().toISOString().slice(0, 10);
    exportToJson(`Backup_Pernikahan_Rizky_Reina_${dateStr}.json`, snapshotData);
  };

  // 8. Pulihkan dari berkas JSON
  const handleRestoreFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed || typeof parsed !== "object") {
          throw new Error("Berkas JSON tidak valid.");
        }
        setRestoreStatus({
          type: "confirm",
          date: parsed.exported_at ? new Date(parsed.exported_at).toLocaleString("id-ID") : "Tidak tercatat",
          summary: `Tamu: ${parsed.guests?.length || 0}, Anggaran: ${parsed.budgets?.length || 0}, Vendor: ${parsed.vendors?.length || 0}`,
          data: parsed,
        });
      } catch (err) {
        setRestoreStatus({ type: "error", message: "Gagal membaca berkas: " + err.message });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // 9. Bersihkan Cache & Muat Ulang PWA
  const clearCacheAndReload = async () => {
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    }
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
    }
    window.location.reload();
  };

  // Sisipkan variabel ke template WhatsApp
  const insertVariable = (variable) => {
    const textarea = document.getElementById("wa-template-textarea");
    if (!textarea) {
      setWaTemplate((prev) => prev + variable);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = waTemplate;
    const newText = text.substring(0, start) + variable + text.substring(end);
    setWaTemplate(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  const samplePreviewText = waTemplate
    .replace(/\{nama\}/g, "Bapak Budi Santoso")
    .replace(/\{link\}/g, `${invitationUrl || "https://undangan.me/rizky-reina"}?to=Budi+Santoso`)
    .replace(/\{pax\}/g, "2 pax")
    .replace(/\{venue\}/g, venue || "Gedung PINDAD, Bandung")
    .replace(/\{meja\}/g, "Meja 05 (VIP)");

  // Cari akun pasangan untuk Skema 2 Akun
  const cppUser = partnerUsers.find(
    (u) => u.partner_role === "CPP" || u.username === "admin" || (u.name || "").toLowerCase().includes("rizky")
  );
  const cpwUser = partnerUsers.find(
    (u) => u.partner_role === "CPW" || u.username === "reina" || (u.name || "").toLowerCase().includes("reina")
  );

  // Akun Panitia & Wedding Organizer (Hak Akses Terbatas)
  const committeeUsers = partnerUsers.filter(
    (u) =>
      (u.app_role === "panitia" || u.app_role === "wo") &&
      u.id !== cppUser?.id &&
      u.id !== cpwUser?.id &&
      u.id !== user?.id
  );

  const ThemeIcon = isDark ? Sun : Moon;
  const driveOpen = toDriveOpenUrl(drive);

  // --- Tempat Sampah Handlers ---
  const handleRestoreItem = async (item) => {
    setTrashActionId(item.id);
    try {
      await restoreFromTrash(item);
    } catch (err) {
      console.error("Gagal memulihkan:", err);
      alert("Gagal memulihkan item: " + (err.message || "Terjadi kesalahan"));
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
    } catch (err) {
      console.error("Gagal menghapus permanen:", err);
      alert("Gagal menghapus item: " + (err.message || "Terjadi kesalahan"));
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
    } catch (err) {
      console.error("Gagal mengosongkan tempat sampah:", err);
      alert("Gagal mengosongkan tempat sampah: " + (err.message || "Terjadi kesalahan"));
    } finally {
      setTrashActionId(null);
    }
  };

  const filteredTrash = (trashItems || []).filter((it) => {
    if (trashFilter === "ALL") return true;
    return it.collection_name === trashFilter;
  });

  return (
    <Page>
      {/* Header dengan Indikator Status Simpan Halus (Dirty State Pill) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <PageHeader
          eyebrow="Konfigurasi Sistem"
          title="Pengaturan"
          subtitle="Kelola data hari-H, akun pasangan, template WhatsApp, peringatan, dan sistem."
          icon={SettingsIcon}
        />
        <div className="self-start sm:self-center">
          {isAnyDirty ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Ada perubahan belum disimpan
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-sage-500/10 text-sage-700 dark:text-sage-300 border border-sage-500/20">
              <Check size={13} />
              Semua tersimpan rapi
            </span>
          )}
        </div>
      </div>

      {/* ===================== NAVIGASI TAB KATEGORI ===================== */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 mt-3">
        {availableTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const hasDirty = tabDirtyMap[tab.id];
          const badgeCount = tab.id === "sampah" ? (trashItems?.length || 0) : 0;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-colors duration-150 ${
                isActive
                  ? "text-rose-700 dark:text-rose-300 bg-rose-500/10 shadow-sm border border-rose-500/20"
                  : "text-ink-muted hover:text-ink dark:hover:text-stone-100 hover:bg-canvas-sunken dark:hover:bg-night-sunken"
              }`}
            >
              <Icon size={15} strokeWidth={isActive ? 2.3 : 1.8} />
              <span>{tab.label}</span>
              {badgeCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white leading-none">
                  {badgeCount}
                </span>
              )}
              {hasDirty && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Ada perubahan belum disimpan" />
              )}
              {isActive && (
                <motion.span
                  layoutId="settings-tab-active"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  className="absolute inset-0 rounded-2xl border-2 border-rose-500/30 pointer-events-none"
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-6">
        {/* ===================== TAB 1: ACARA & PASANGAN ===================== */}
        {activeTab === "acara" && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="space-y-6"
          >
            <Card>
              <div className="flex items-center justify-between">
                <SectionTitle count="Hari-H">Data Acara &amp; Pasangan</SectionTitle>
                <div className="flex items-center gap-2">
                  {isCoupleDirty && (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      • Belum disimpan
                    </span>
                  )}
                  <span className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <Heart size={16} />
                  </span>
                </div>
              </div>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                Perubahan nama pengantin, tanggal, dan venue di sini akan otomatis memperbarui hitungan mundur di Dasbor dan seluruh dokumen perencanaan secara <em>real-time</em>.
              </p>

              <form onSubmit={handleSaveCouple} className="space-y-4 mt-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Panggilan CPP (Pria)" hint="Nama sapaan calon pengantin pria.">
                    <Input
                      value={cppNickname}
                      onChange={(e) => setCppNickname(e.target.value)}
                      placeholder="Rizky"
                      required
                    />
                  </Field>
                  <Field label="Nama Lengkap CPP" hint="Nama lengkap dan gelar (jika ada).">
                    <Input
                      value={cppFullName}
                      onChange={(e) => setCppFullName(e.target.value)}
                      placeholder="Rizky Ramadhan"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Panggilan CPW (Wanita)" hint="Nama sapaan calon pengantin wanita.">
                    <Input
                      value={cpwNickname}
                      onChange={(e) => setCpwNickname(e.target.value)}
                      placeholder="Reina"
                      required
                    />
                  </Field>
                  <Field label="Nama Lengkap CPW" hint="Nama lengkap dan gelar (jika ada).">
                    <Input
                      value={cpwFullName}
                      onChange={(e) => setCpwFullName(e.target.value)}
                      placeholder="Reina Nurulita"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <Field
                    label="Tanggal Pernikahan (Hari-H)"
                    hint="Menentukan hitungan mundur dasbor."
                  >
                    <Input
                      type="date"
                      value={weddingDate}
                      onChange={(e) => setWeddingDate(e.target.value)}
                      required
                    />
                  </Field>
                  <Field
                    label="Target Total Anggaran (Rp)"
                    hint="Target dana pernikahan keseluruhan."
                  >
                    <Input
                      type="number"
                      step={500000}
                      value={targetBudget}
                      onChange={(e) => setTargetBudget(e.target.value)}
                      required
                    />
                  </Field>
                </div>

                <Field
                  label="Nama Tempat / Venue"
                  hint="Contoh: Gedung PINDAD, Bandung atau nama ballroom hotel."
                >
                  <Input
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Gedung PINDAD, Bandung"
                  />
                </Field>

                <div className="flex items-center gap-3 pt-3">
                  <Button type="submit" loading={savingCouple} icon={savedCouple ? Check : Save}>
                    {savedCouple ? "Tersimpan!" : "Simpan Data Acara"}
                  </Button>
                  {savedCouple && (
                    <span className="text-xs text-sage-600 dark:text-sage-300 flex items-center gap-1.5">
                      <Check size={14} /> Berhasil disinkronkan ke seluruh perangkat
                    </span>
                  )}
                </div>
              </form>
            </Card>
          </motion.div>
        )}

        {/* ===================== TAB 2: AKUN PASANGAN (SKEMA 2 AKUN) ===================== */}
        {activeTab === "pasangan" && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="space-y-6"
          >
            <Card>
              <div className="flex items-center justify-between">
                <SectionTitle count="Skema 2 Akun">Kolaborasi Akun Pengantin (CPP &amp; CPW)</SectionTitle>
                <span className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <Users size={16} />
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                Rizky dan Reina memiliki akun masing-masing untuk masuk ke aplikasi. Seluruh catatan tamu, ceklis vendor, dan anggaran tersinkronisasi otomatis saat terhubung.
              </p>

              {reinaMsg && (
                <div
                  className={`mt-4 p-3.5 rounded-2xl text-xs flex items-start gap-2.5 ${
                    reinaMsg.type === "success"
                      ? "bg-sage-500/10 text-sage-800 dark:text-sage-200 border border-sage-500/20"
                      : "bg-rose-500/10 text-rose-800 dark:text-rose-200 border border-rose-500/20"
                  }`}
                >
                  {reinaMsg.type === "success" ? <Check size={16} className="shrink-0 text-sage-600" /> : <AlertTriangle size={16} className="shrink-0 text-rose-600" />}
                  <span className="leading-relaxed">{reinaMsg.message}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                {/* Kartu CPP (Rizky) */}
                <div className="p-4 rounded-3xl bg-canvas-sunken/60 dark:bg-night-sunken/60 border border-line dark:border-night-line flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300">
                        CPP (Pengantin Pria)
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-sage-600 dark:text-sage-400 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-sage-500" /> Aktif
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Avatar name={cppUser?.name || "Rizky"} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">{cppUser?.name || "Rizky Ramadhan"}</p>
                        <p className="text-xs text-ink-muted truncate">@{cppUser?.username || "admin"}</p>
                        <p className="text-[11px] text-ink-faint truncate">{cppUser?.email || "admin@wedding.local"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-line/60 dark:border-night-line/60 text-[11px] text-ink-faint">
                    {user?.id === cppUser?.id ? "Sedang login di perangkat ini" : "Terdaftar di database"}
                  </div>
                </div>

                {/* Kartu CPW (Reina) */}
                <div className="p-4 rounded-3xl bg-canvas-sunken/60 dark:bg-night-sunken/60 border border-line dark:border-night-line flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300">
                        CPW (Pengantin Wanita)
                      </span>
                      {cpwUser ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-sage-600 dark:text-sage-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-sage-500" /> Siap Digunakan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Belum Didaftarkan
                        </span>
                      )}
                    </div>

                    {cpwUser ? (
                      <div className="flex items-center gap-3">
                        <Avatar name={cpwUser?.name || "Reina"} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">{cpwUser.name}</p>
                          <p className="text-xs text-ink-muted truncate">@{cpwUser.username}</p>
                          <p className="text-[11px] text-ink-faint truncate">{cpwUser.email}</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold text-sm">Akun Reina Belum Dibuat</p>
                        <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                          Daftarkan akun Reina agar dia dapat membuka dan mengelola Wedding Planner dari HP-nya sendiri.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-line/60 dark:border-night-line/60">
                    {cpwUser ? (
                      <p className="text-[11px] text-ink-faint">
                        {user?.id === cpwUser.id ? "Sedang login di perangkat ini" : "Reina bisa login dengan akun ini"}
                      </p>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={UserPlus}
                        className="w-full"
                        onClick={() => setShowCreateReina(true)}
                      >
                        Daftarkan Akun Reina
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Modal / Inline Buat Akun Reina jika belum ada */}
              {showCreateReina && !cpwUser && (
                <div className="mt-5 p-4 rounded-3xl bg-rose-500/5 border border-rose-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-xs text-rose-700 dark:text-rose-300">
                      Pendaftaran Cepat Akun Reina (CPW)
                    </p>
                    <button
                      onClick={() => setShowCreateReina(false)}
                      className="text-xs text-ink-faint hover:text-ink"
                    >
                      Batal
                    </button>
                  </div>
                  <form onSubmit={handleCreateReina} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Username Reina" hint="Dipakai saat login di HP Reina.">
                        <Input
                          value={reinaForm.username}
                          onChange={(e) => setReinaForm({ ...reinaForm, username: e.target.value })}
                          required
                        />
                      </Field>
                      <Field label="Nama Lengkap" hint="Nama tampilan.">
                        <Input
                          value={reinaForm.name}
                          onChange={(e) => setReinaForm({ ...reinaForm, name: e.target.value })}
                          required
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Email" hint="Email akun Reina.">
                        <Input
                          type="email"
                          value={reinaForm.email}
                          onChange={(e) => setReinaForm({ ...reinaForm, email: e.target.value })}
                          required
                        />
                      </Field>
                      <Field label="Kata Sandi Awal" hint="Dapat diubah oleh Reina di menu Pengaturan.">
                        <Input
                          value={reinaForm.password}
                          onChange={(e) => setReinaForm({ ...reinaForm, password: e.target.value })}
                          required
                        />
                      </Field>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Button type="submit" loading={creatingReina} icon={UserPlus}>
                        Buat &amp; Aktifkan Akun Reina
                      </Button>
                      <Button variant="ghost" onClick={() => setShowCreateReina(false)}>
                        Tutup
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </Card>

            {/* Kartu 2: Akun Panitia & Wedding Organizer (Hak Akses Terbatas) */}
            <Card>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <SectionTitle count="Tim Hari-H">Akun Panitia &amp; Wedding Organizer (WO)</SectionTitle>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                      Hak Akses Terbatas
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                    Buat akun khusus untuk tim penerima tamu meja resepsi, koordinator Hari-H, dan WO. Akun ini disetel aman: <strong>tanpa akses ke Anggaran, Cashflow, maupun Pencatatan Angpao</strong>.
                  </p>
                </div>
                {!showCreatePanitia && (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={UserPlus}
                    className="shrink-0 self-start sm:self-center"
                    onClick={() => setShowCreatePanitia(true)}
                  >
                    + Tambah Akun Panitia
                  </Button>
                )}
              </div>

              {/* Status Alert Message */}
              {panitiaMsg && (
                <div
                  className={`mt-4 p-3.5 rounded-2xl text-xs flex items-start gap-2.5 ${
                    panitiaMsg.type === "success"
                      ? "bg-sage-500/10 text-sage-800 dark:text-sage-200 border border-sage-500/20"
                      : "bg-rose-500/10 text-rose-800 dark:text-rose-200 border border-rose-500/20"
                  }`}
                >
                  {panitiaMsg.type === "success" ? (
                    <Check size={16} className="shrink-0 text-sage-600 mt-0.5" />
                  ) : (
                    <AlertTriangle size={16} className="shrink-0 text-rose-600 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{panitiaMsg.message}</span>
                </div>
              )}

              {/* Form Tambah Akun Panitia / WO */}
              {showCreatePanitia && (
                <div className="mt-5 p-4 sm:p-5 rounded-3xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
                        <Shield size={16} />
                      </span>
                      <div>
                        <h4 className="font-semibold text-xs text-ink">Pendaftaran Akun Panitia / WO Baru</h4>
                        <p className="text-[11px] text-ink-muted">Akun ini hanya dapat mengakses operasional Hari-H.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCreatePanitia(false)}
                      className="text-xs text-ink-faint hover:text-ink px-2 py-1 rounded-lg"
                    >
                      Batal
                    </button>
                  </div>

                  <form onSubmit={handleCreatePanitia} className="space-y-4">
                    {/* Role Selector */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPanitiaForm({ ...panitiaForm, app_role: "panitia" })}
                        className={`p-3 rounded-2xl text-left border transition-all ${
                          panitiaForm.app_role === "panitia"
                            ? "bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20"
                            : "bg-surface dark:bg-night-surface border-line dark:border-night-line text-ink-muted hover:border-amber-500/30"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-xs flex items-center gap-1.5">
                            <Users size={14} className="text-amber-600" /> Panitia Meja &amp; Acara
                          </span>
                          {panitiaForm.app_role === "panitia" && <Check size={14} className="text-amber-600" />}
                        </div>
                        <p className="text-[11px] text-ink-faint">
                          Penerima tamu meja resepsi, scan barcode, pagar ayu &amp; logistik.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPanitiaForm({ ...panitiaForm, app_role: "wo" })}
                        className={`p-3 rounded-2xl text-left border transition-all ${
                          panitiaForm.app_role === "wo"
                            ? "bg-violet-500/15 border-violet-500/40 text-violet-900 dark:text-violet-200 ring-2 ring-violet-500/20"
                            : "bg-surface dark:bg-night-surface border-line dark:border-night-line text-ink-muted hover:border-violet-500/30"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-xs flex items-center gap-1.5">
                            <Shield size={14} className="text-violet-600" /> Wedding Organizer (WO)
                          </span>
                          {panitiaForm.app_role === "wo" && <Check size={14} className="text-violet-600" />}
                        </div>
                        <p className="text-[11px] text-ink-faint">
                          Koordinator rundown timeline, PIC penjemputan, &amp; briefing vendor.
                        </p>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Username Login" hint="Contoh: panitia-meja1, wo-leader">
                        <Input
                          value={panitiaForm.username}
                          onChange={(e) => setPanitiaForm({ ...panitiaForm, username: e.target.value })}
                          placeholder="panitia-meja1"
                          required
                        />
                      </Field>
                      <Field label="Nama Lengkap / Jabatan" hint="Contoh: Meja Resepsi 1 (Siti)">
                        <Input
                          value={panitiaForm.name}
                          onChange={(e) => setPanitiaForm({ ...panitiaForm, name: e.target.value })}
                          placeholder="Siti - Meja Tamu Utama"
                          required
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Email Akun" hint="Opsional (otomatis terisi bila dikosongkan)">
                        <Input
                          type="email"
                          value={panitiaForm.email}
                          onChange={(e) => setPanitiaForm({ ...panitiaForm, email: e.target.value })}
                          placeholder="panitia1@wedding.local"
                        />
                      </Field>
                      <Field label="Kata Sandi Awal" hint="Minimal 6 karakter untuk masuk">
                        <Input
                          value={panitiaForm.password}
                          onChange={(e) => setPanitiaForm({ ...panitiaForm, password: e.target.value })}
                          placeholder="panitia2028"
                          required
                        />
                      </Field>
                    </div>

                    <div className="p-3 rounded-2xl bg-surface/60 dark:bg-night-surface/60 border border-line dark:border-night-line flex items-center gap-2.5 text-[11px] text-ink-muted">
                      <Lock size={15} className="shrink-0 text-amber-600" />
                      <span>
                        Akun ini otomatis <strong>diblokir</strong> dari menu Anggaran, Mutasi Kas, dan Pencatatan Angpao &amp; Kado.
                      </span>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <Button type="submit" loading={creatingPanitia} icon={UserPlus}>
                        Buat &amp; Aktifkan Akun Panitia
                      </Button>
                      <Button variant="ghost" type="button" onClick={() => setShowCreatePanitia(false)}>
                        Tutup
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Daftar Akun Panitia & WO Terdaftar */}
              <div className="mt-5 space-y-3">
                <p className="text-[11px] font-semibold text-ink-faint uppercase tracking-wider">
                  Daftar Petugas Panitia &amp; WO Terdaftar ({committeeUsers.length})
                </p>

                {committeeUsers.length === 0 ? (
                  <div className="p-5 rounded-3xl bg-canvas-sunken/40 dark:bg-night-sunken/40 border border-dashed border-line dark:border-night-line text-center">
                    <p className="text-xs font-medium text-ink-muted">Belum ada akun panitia atau WO yang didaftarkan.</p>
                    <p className="text-[11px] text-ink-faint mt-1">
                      Klik tombol <strong>"+ Tambah Akun Panitia"</strong> di atas jika ingin membagikan akun petugas meja resepsi atau koordinator rundown acara.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {committeeUsers.map((u) => {
                      const isWoRole = u.app_role === "wo";
                      const isDeleting = deletingUserId === u.id;
                      return (
                        <div
                          key={u.id}
                          className="p-3.5 rounded-3xl bg-canvas-sunken/50 dark:bg-night-sunken/50 border border-line dark:border-night-line flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isWoRole
                                    ? "bg-violet-500/15 text-violet-700 dark:text-violet-300"
                                    : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                }`}
                              >
                                {isWoRole ? "Wedding Organizer (WO)" : "Panitia Meja / Acara"}
                              </span>
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => handleDeleteUser(u.id, u.name || u.username)}
                                className="p-1 text-ink-faint hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-500/10"
                                title="Cabut akses akun ini"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            <div className="flex items-center gap-3">
                              <Avatar name={u.name || u.username} size="sm" />
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-xs truncate">{u.name || u.username}</p>
                                <p className="text-[11px] text-ink-muted truncate">@{u.username}</p>
                                {u.email && !u.email.endsWith("@panitia.local") && (
                                  <p className="text-[10px] text-ink-faint truncate">{u.email}</p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-line/60 dark:border-night-line/60 flex items-center justify-between text-[10px] text-ink-faint">
                            <span className="flex items-center gap-1 text-amber-700 dark:text-amber-300">
                              <Lock size={11} /> Tanpa Akses Budget
                            </span>
                            <span>Hari-H &amp; Resepsi Aktif</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* ===================== TAB 3: UNDANGAN & WHATSAPP ===================== */}
        {activeTab === "undangan" && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="space-y-6"
          >
            <Card>
              <div className="flex items-center justify-between">
                <SectionTitle count="Integrasi">Undangan Eksternal &amp; WhatsApp</SectionTitle>
                <div className="flex items-center gap-2">
                  {isInvitationDirty && (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      • Belum disimpan
                    </span>
                  )}
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Send size={16} />
                  </span>
                </div>
              </div>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                Karena undangan dibuat di website eksternal, cukup masukkan URL dasarnya di bawah ini. Tombol <strong>"Kirim WA"</strong> di halaman Tamu akan otomatis menyusun tautan personal dan mengisi pesan WhatsApp.
              </p>

              <div className="space-y-5 mt-5">
                <Field
                  label="URL Dasar Website Undangan"
                  hint="Contoh: https://undangan.me/rizky-reina (link tiap tamu otomatis ditambahkan ?to=Nama+Tamu)."
                >
                  <Input
                    type="url"
                    value={invitationUrl}
                    onChange={(e) => setInvitationUrl(e.target.value)}
                    placeholder="https://undangan.me/rizky-reina"
                  />
                </Field>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-ink dark:text-stone-200">
                      Template Pesan WhatsApp
                    </label>
                    <button
                      type="button"
                      onClick={() => setWaTemplate(DEFAULT_WA_TEMPLATE)}
                      className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                    >
                      <RotateCcw size={12} /> Reset bawaan
                    </button>
                  </div>

                  {/* Tombol Sisipkan Variabel Cepat */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    <span className="text-[11px] text-ink-faint mr-1">Sisipkan tag:</span>
                    <button
                      type="button"
                      onClick={() => insertVariable("{nama}")}
                      className="px-2.5 py-1 rounded-xl text-xs font-mono bg-canvas-sunken dark:bg-night-sunken hover:bg-rose-500/10 hover:text-rose-600 transition"
                      title="Sisipkan nama tamu"
                    >
                      + {"{nama}"}
                    </button>
                    <button
                      type="button"
                      onClick={() => insertVariable("{link}")}
                      className="px-2.5 py-1 rounded-xl text-xs font-mono bg-canvas-sunken dark:bg-night-sunken hover:bg-rose-500/10 hover:text-rose-600 transition"
                      title="Sisipkan link undangan personal"
                    >
                      + {"{link}"}
                    </button>
                    <button
                      type="button"
                      onClick={() => insertVariable("{pax}")}
                      className="px-2.5 py-1 rounded-xl text-xs font-mono bg-canvas-sunken dark:bg-night-sunken hover:bg-rose-500/10 hover:text-rose-600 transition"
                      title="Sisipkan jumlah pax"
                    >
                      + {"{pax}"}
                    </button>
                    <button
                      type="button"
                      onClick={() => insertVariable("{venue}")}
                      className="px-2.5 py-1 rounded-xl text-xs font-mono bg-canvas-sunken dark:bg-night-sunken hover:bg-rose-500/10 hover:text-rose-600 transition"
                      title="Sisipkan lokasi venue"
                    >
                      + {"{venue}"}
                    </button>
                    <button
                      type="button"
                      onClick={() => insertVariable("{meja}")}
                      className="px-2.5 py-1 rounded-xl text-xs font-mono bg-canvas-sunken dark:bg-night-sunken hover:bg-rose-500/10 hover:text-rose-600 transition"
                      title="Sisipkan nomor atau nama meja tamu"
                    >
                      + {"{meja}"}
                    </button>
                  </div>

                  <textarea
                    id="wa-template-textarea"
                    rows={7}
                    value={waTemplate}
                    onChange={(e) => setWaTemplate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-canvas-sunken dark:bg-night-sunken border border-line dark:border-night-line text-sm text-ink dark:text-stone-100 placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all font-sans leading-relaxed"
                  />
                </div>

                {/* Tombol Toggle Pratinjau Balon WA (Collapsible agar tidak memakan layar) */}
                <div className="pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={showWaPreview ? EyeOff : Eye}
                    onClick={() => setShowWaPreview((v) => !v)}
                  >
                    {showWaPreview ? "Tutup Pratinjau Balon WA" : "Lihat Pratinjau Balon WA"}
                  </Button>
                </div>

                {/* SIMULASI BALON CHAT WHATSAPP RINGKAS */}
                {showWaPreview && (
                  <div className="rounded-3xl overflow-hidden border border-[#25D366]/20 bg-[#ECE5DD] dark:bg-[#0b141a] p-4 shadow-sm">
                    {/* Header bar mini WhatsApp */}
                    <div className="flex items-center gap-2.5 pb-2.5 mb-2.5 border-b border-black/10 dark:border-white/10 text-xs text-ink dark:text-stone-100">
                      <div className="w-7 h-7 rounded-full bg-[#128C7E] text-white grid place-items-center font-bold text-xs">
                        R&amp;R
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-xs text-[#075E54] dark:text-stone-100 truncate">
                          {coupleNameDisplay(couple)}
                        </p>
                        <p className="text-[10px] text-ink-faint">online</p>
                      </div>
                    </div>

                    {/* Chat Bubble Outgoing */}
                    <div className="flex justify-end">
                      <div className="max-w-md rounded-2xl rounded-tr-xs bg-[#E7FFDB] dark:bg-[#005c4b] p-3 text-xs text-stone-900 dark:text-stone-100 shadow-sm leading-relaxed whitespace-pre-line relative">
                        {samplePreviewText}
                        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-stone-500 dark:text-stone-300">
                          <span>10:30</span>
                          <CheckCheck size={14} className="text-[#34B7F1]" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <Button onClick={handleSaveInvitation} loading={savingSettings} icon={savedSettings ? Check : Save}>
                    {savedSettings ? "Tersimpan!" : "Simpan Pengaturan Undangan"}
                  </Button>
                  {savedSettings && (
                    <span className="text-xs text-sage-600 dark:text-sage-300 flex items-center gap-1.5">
                      <Check size={14} /> Tersinkron otomatis
                    </span>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ===================== TAB 4: PERINGATAN & ALERTS ===================== */}
        {activeTab === "alerts" && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="space-y-6"
          >
            <Card>
              <div className="flex items-center justify-between">
                <SectionTitle count="Notifikasi & Peringatan">Pusat Peringatan (Alerts)</SectionTitle>
                <div className="flex items-center gap-2">
                  {isAlertsDirty && (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      • Belum disimpan
                    </span>
                  )}
                  <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Bell size={16} />
                  </span>
                </div>
              </div>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                Atur kapan dan bagaimana aplikasi memberikan peringatan otomatis mengenai tenggat vendor, batas anggaran, dan tindak lanjut RSVP tamu.
              </p>

              <div className="space-y-4 mt-5">
                {/* 1. Tenggat Vendor */}
                <div className="p-4 rounded-3xl bg-canvas-sunken/60 dark:bg-night-sunken/60 border border-line dark:border-night-line space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">Peringatan Tenggat Waktu Vendor</p>
                      <p className="text-xs text-ink-muted mt-0.5">
                        Tampilkan spanduk peringatan merah di halaman vendor dan dasbor.
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={alertVendorDeadline}
                      onChange={setAlertVendorDeadline}
                    />
                  </div>

                  {alertVendorDeadline && (
                    <div className="pt-2 border-t border-line/60 dark:border-night-line/60 flex items-center justify-between text-xs">
                      <span className="text-ink-muted">Batas hari peringatan mendesak:</span>
                      <select
                        value={alertVendorDays}
                        onChange={(e) => setAlertVendorDays(Number(e.target.value))}
                        className="px-3 py-1.5 rounded-xl bg-canvas dark:bg-night-card border border-line dark:border-night-line text-ink dark:text-stone-100 text-xs font-semibold focus-ring"
                      >
                        <option value={3}>H-3 hari sebelum tenggat</option>
                        <option value={7}>H-7 hari (1 minggu)</option>
                        <option value={14}>H-14 hari (2 minggu)</option>
                        <option value={30}>H-30 hari (1 bulan)</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* 2. Peringatan Pembengkakan Anggaran */}
                <div className="p-4 rounded-3xl bg-canvas-sunken/60 dark:bg-night-sunken/60 border border-line dark:border-night-line flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">Peringatan Pembengkakan Anggaran</p>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Beri tanda peringatan merah jika realisasi biaya suatu pos melebihi alokasi awal.
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={alertBudgetOverrun}
                    onChange={setAlertBudgetOverrun}
                  />
                </div>

                {/* 3. Pengingat RSVP Tamu */}
                <div className="p-4 rounded-3xl bg-canvas-sunken/60 dark:bg-night-sunken/60 border border-line dark:border-night-line flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">Pengingat Follow-up Tamu Prioritas</p>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Beri highlight pada tamu prioritas A (Must Invite) yang belum konfirmasi kehadiran.
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={alertRsvpReminder}
                    onChange={setAlertRsvpReminder}
                  />
                </div>

                {/* 4. Notifikasi Browser Web Push */}
                <div className="p-4 rounded-3xl bg-canvas-sunken/60 dark:bg-night-sunken/60 border border-line dark:border-night-line flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">Notifikasi Perangkat (Browser Notification)</p>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Status izin:{" "}
                      <span className="font-semibold">
                        {notifPermission === "granted"
                          ? "✓ Diizinkan"
                          : notifPermission === "denied"
                          ? "✗ Diblokir"
                          : "Belum Diaktifkan"}
                      </span>
                    </p>
                  </div>
                  {notifPermission !== "granted" ? (
                    <Button size="sm" variant="outline" onClick={requestNotif}>
                      Aktifkan Notifikasi
                    </Button>
                  ) : (
                    <Badge tone="sage">Aktif</Badge>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button onClick={handleSaveAlerts} loading={savingAlerts} icon={savedAlerts ? Check : Save}>
                    {savedAlerts ? "Tersimpan!" : "Simpan Pengaturan Alerts"}
                  </Button>
                  {savedAlerts && (
                    <span className="text-xs text-sage-600 dark:text-sage-300 flex items-center gap-1.5">
                      <Check size={14} /> Preferensi tersimpan
                    </span>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ===================== TAB 5: TAMPILAN & TEMA ===================== */}
        {activeTab === "tampilan" && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="space-y-6"
          >
            <Card>
              <SectionTitle>Mode Tampilan</SectionTitle>
              <button
                onClick={toggle}
                className="w-full flex items-center gap-4 mt-4 p-3 -mx-3 rounded-2xl hover:bg-canvas-sunken dark:hover:bg-night-sunken transition-colors text-left focus-ring"
              >
                <span className="p-2.5 rounded-2xl bg-canvas-sunken dark:bg-night-sunken text-ink-muted shrink-0">
                  <ThemeIcon size={19} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium">
                    {isDark ? "Mode gelap (Dark Mode)" : "Mode terang (Light Mode)"}
                  </span>
                  <span className="block text-xs text-ink-faint mt-0.5">
                    {followsSystem ? "Mengikuti setelan sistem operasi perangkat" : "Dipilih manual"}
                  </span>
                </span>
                <span
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                    isDark ? "bg-rose-600" : "bg-line-strong dark:bg-night-line"
                  }`}
                >
                  <motion.span
                    animate={{ x: isDark ? 22 : 3 }}
                    transition={{ type: "spring", stiffness: 500, damping: 32 }}
                    className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm"
                  />
                </span>
              </button>
            </Card>

            <Card>
              <SectionTitle count="Palet Warna">Tema Estetika Pernikahan</SectionTitle>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                Antarmuka dirancang dengan palet warna khusus pernikahan romantis dan elegan:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <div className="p-3 rounded-2xl border border-line dark:border-night-line bg-canvas-sunken/40 dark:bg-night-sunken/40 flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#b94460] shadow-sm shrink-0" />
                  <div>
                    <p className="text-xs font-semibold">Tapestry Rose</p>
                    <p className="text-[10px] text-ink-faint">Warna utama</p>
                  </div>
                </div>
                <div className="p-3 rounded-2xl border border-line dark:border-night-line bg-canvas-sunken/40 dark:bg-night-sunken/40 flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#d3a466] shadow-sm shrink-0" />
                  <div>
                    <p className="text-xs font-semibold">Warm Brass</p>
                    <p className="text-[10px] text-ink-faint">Aksen emas</p>
                  </div>
                </div>
                <div className="p-3 rounded-2xl border border-line dark:border-night-line bg-canvas-sunken/40 dark:bg-night-sunken/40 flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#3d7a64] shadow-sm shrink-0" />
                  <div>
                    <p className="text-xs font-semibold">Sage Velvet</p>
                    <p className="text-[10px] text-ink-faint">Status selesai</p>
                  </div>
                </div>
                <div className="p-3 rounded-2xl border border-line dark:border-night-line bg-canvas-sunken/40 dark:bg-night-sunken/40 flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#1e1a22] dark:bg-stone-200 shadow-sm shrink-0" />
                  <div>
                    <p className="text-xs font-semibold">Night Velvet</p>
                    <p className="text-[10px] text-ink-faint">Latar gelap</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ===================== TAB 6: PREWEDDING & GALERI ===================== */}
        {activeTab === "prewedding" && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="space-y-6"
          >
            <Card>
              <div className="flex items-center justify-between">
                <SectionTitle count={photos.length ? `${photos.length} foto` : null}>
                  Prewedding &amp; Galeri
                </SectionTitle>
                {isGalleryDirty && (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    • Belum disimpan
                  </span>
                )}
              </div>

              <div className="space-y-4 mt-4">
                <Field
                  label="Tautan Google Drive"
                  hint={
                    drive
                      ? isDriveFolder(drive)
                        ? "Tautan folder — foto di dalamnya dapat ditambahkan di halaman Galeri."
                        : "Tautan berkas dikenali."
                      : "Boleh tautan berkas atau folder Google Drive. Kosongkan jika belum ada."
                  }
                >
                  <div className="flex gap-2">
                    <Input
                      type="url"
                      value={drive}
                      onChange={(e) => setDrive(e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/…"
                      className="flex-1"
                    />
                    {driveOpen && (
                      <a
                        href={driveOpen}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Buka Google Drive"
                        className="shrink-0 grid place-items-center px-3.5 rounded-2xl border border-line dark:border-night-line text-ink-muted hover:text-ink dark:hover:text-stone-100 transition-colors"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </Field>

                <Field label="Judul galeri" hint="Muncul sebagai judul bagian foto di dasbor utama.">
                  <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Momen Prewedding Rizky & Reina"
                  />
                </Field>

                <ToggleRow
                  icon={Check}
                  label="Sudah sesi prewedding"
                  hint="Aktifkan setelah sesi foto selesai agar bagian galeri muncul di dasbor."
                  checked={preweddingDone}
                  onChange={setPreweddingDone}
                />

                <ToggleRow
                  icon={ImageIcon}
                  label="Tampilkan galeri di dasbor"
                  hint="Matikan jika ingin foto hanya terlihat saat membuka halaman Galeri."
                  checked={showOnDashboard}
                  onChange={setShowOnDashboard}
                />

                <div className="flex items-center gap-3 pt-1">
                  <Button onClick={handleSaveGallery} loading={savingGallery} icon={savedGallery ? Check : Save}>
                    {savedGallery ? "Tersimpan" : "Simpan Pengaturan Galeri"}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ===================== TAB 7: EKSPOR & CADANGAN ===================== */}
        {activeTab === "cadangan" && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="space-y-6"
          >
            <Card>
              <SectionTitle count="Excel • JSON • PDF">Ekspor &amp; Cadangan Data</SectionTitle>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                Unduh berkas spreadsheet Excel untuk dibagikan ke Wedding Organizer atau simpan berkas cadangan database untuk arsip.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <div className="p-3.5 rounded-2xl bg-canvas-sunken/60 dark:bg-night-sunken/60 border border-line dark:border-night-line flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium text-xs">
                      <FileSpreadsheet size={16} />
                      <span>Excel / CSV Daftar Tamu</span>
                    </div>
                    <p className="text-xs text-ink-muted mt-1">
                      {guests.length} tamu, kontak WhatsApp, status RSVP, dan pihak.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Download}
                    className="mt-3 w-full"
                    onClick={exportGuestsCsv}
                  >
                    Unduh CSV Tamu
                  </Button>
                </div>

                <div className="p-3.5 rounded-2xl bg-canvas-sunken/60 dark:bg-night-sunken/60 border border-line dark:border-night-line flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium text-xs">
                      <FileSpreadsheet size={16} />
                      <span>Excel / CSV Anggaran</span>
                    </div>
                    <p className="text-xs text-ink-muted mt-1">
                      {budgets.length} pos anggaran, alokasi target, dan realisasi biaya.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Download}
                    className="mt-3 w-full"
                    onClick={exportBudgetsCsv}
                  >
                    Unduh CSV Anggaran
                  </Button>
                </div>

                <div className="p-3.5 rounded-2xl bg-canvas-sunken/60 dark:bg-night-sunken/60 border border-line dark:border-night-line flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium text-xs">
                      <FileSpreadsheet size={16} />
                      <span>Excel / CSV Vendor</span>
                    </div>
                    <p className="text-xs text-ink-muted mt-1">
                      {vendors.length} vendor, PIC, nomor WhatsApp, biaya, dan tenggat waktu.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Download}
                    className="mt-3 w-full"
                    onClick={exportVendorsCsv}
                  >
                    Unduh CSV Vendor
                  </Button>
                </div>

                <div className="p-3.5 rounded-2xl bg-canvas-sunken/60 dark:bg-night-sunken/60 border border-line dark:border-night-line flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium text-xs">
                      <FileSpreadsheet size={16} />
                      <span>Excel / CSV Seserahan</span>
                    </div>
                    <p className="text-xs text-ink-muted mt-1">
                      Checklist {seserahan.length} item seserahan &amp; hantaran CPP/CPW.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Download}
                    className="mt-3 w-full"
                    onClick={exportSeserahanCsv}
                  >
                    Unduh CSV Seserahan
                  </Button>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-line dark:border-night-line flex flex-col sm:flex-row gap-3">
                <Button
                  variant="secondary"
                  icon={FileJson}
                  className="flex-1"
                  onClick={exportFullBackupJson}
                >
                  Unduh Cadangan Penuh (.json)
                </Button>
                <Button
                  variant="outline"
                  icon={Printer}
                  onClick={printReport}
                >
                  Cetak / Simpan PDF
                </Button>
              </div>
            </Card>

            {/* Pulihkan Data dari Cadangan JSON */}
            <Card>
              <div className="flex items-center justify-between">
                <SectionTitle count="Pemulihan">Pulihkan Data dari Berkas (.json)</SectionTitle>
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Upload size={16} />
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                Punya berkas snapshot cadangan JSON yang pernah diunduh sebelumnya? Anda dapat memeriksanya di sini.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleRestoreFile}
              />

              <div className="mt-4">
                <Button
                  variant="outline"
                  icon={Upload}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Pilih Berkas Cadangan (.json)
                </Button>
              </div>

              {restoreStatus && (
                <div className="mt-4 p-4 rounded-2xl bg-canvas-sunken dark:bg-night-sunken border border-line dark:border-night-line text-xs">
                  {restoreStatus.type === "confirm" ? (
                    <div>
                      <div className="flex items-center gap-2 text-sage-600 dark:text-sage-400 font-semibold mb-1">
                        <Check size={16} /> Berkas Cadangan Terverifikasi
                      </div>
                      <p className="text-ink-muted">
                        Waktu ekspor: <strong>{restoreStatus.date}</strong>
                      </p>
                      <p className="text-ink-muted mt-0.5">
                        Ringkasan isi: {restoreStatus.summary}
                      </p>
                      <p className="text-[11px] text-ink-faint mt-2">
                        Data aman dan siap dipakai untuk pemulihan sewaktu-waktu.
                      </p>
                    </div>
                  ) : (
                    <div className="text-rose-600 flex items-center gap-2">
                      <AlertTriangle size={15} />
                      <span>{restoreStatus.message}</span>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* ===================== TAB 8: KATA SANDI & KEAMANAN ===================== */}
        {activeTab === "keamanan" && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="space-y-6"
          >
            <Card>
              <SectionTitle>Profil Pengguna Aktif</SectionTitle>
              <div className="flex items-center gap-4 mt-4">
                <Avatar name={displayName} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="font-display font-semibold truncate text-base">{displayName}</p>
                  <p className="text-xs text-ink-muted truncate mt-0.5">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {isSuperuser && (
                      <Badge tone="plum">
                        Super admin
                      </Badge>
                    )}
                    <Badge tone="gray">
                      ID: {user?.id}
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" icon={LogOut} onClick={logout}>
                  Keluar
                </Button>
              </div>
            </Card>

            {/* Ganti Kata Sandi */}
            <Card>
              <div className="flex items-center justify-between">
                <SectionTitle count="Keamanan">Ubah Kata Sandi (Password)</SectionTitle>
                <span className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <KeyRound size={16} />
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                Perbarui kata sandi akun login Anda. Pastikan minimal 8 karakter.
              </p>

              <form onSubmit={handleUpdatePassword} className="space-y-4 mt-4 max-w-md">
                <Field label="Kata Sandi Baru" hint="Minimal 8 karakter.">
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </Field>

                <Field label="Konfirmasi Kata Sandi Baru">
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </Field>

                {passStatus && (
                  <div
                    className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
                      passStatus.type === "success"
                        ? "bg-sage-500/10 text-sage-700 dark:text-sage-300 border border-sage-500/20"
                        : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20"
                    }`}
                  >
                    {passStatus.type === "success" ? <Check size={14} /> : <AlertTriangle size={14} />}
                    <span>{passStatus.message}</span>
                  </div>
                )}

                <Button type="submit" loading={passSaving} icon={KeyRound}>
                  Perbarui Kata Sandi
                </Button>
              </form>
            </Card>
          </motion.div>
        )}

        {/* ===================== TAB: TEMPAT SAMPAH (RECYCLE BIN) ===================== */}
        {activeTab === "sampah" && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="space-y-6"
          >
            <Card>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <SectionTitle count={`${trashItems?.length || 0} item`}>
                  Tempat Sampah (Recycle Bin)
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
        )}

        {/* ===================== TAB 9: SISTEM & PWA ===================== */}
        {activeTab === "sistem" && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="space-y-6"
          >
            {/* Status Real-Time Collaboration */}
            <Card>
              <SectionTitle count="PocketBase">Status Kolaborasi &amp; Database</SectionTitle>
              <div className="flex items-center gap-3 mt-4 p-3.5 rounded-2xl bg-canvas-sunken/60 dark:bg-night-sunken/60 border border-line dark:border-night-line">
                <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Radio size={18} className={isLiveConnected ? "animate-pulse" : ""} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-xs text-ink dark:text-stone-100">
                      {isLiveConnected ? "⚡ Real-Time Live Aktif" : "Mode Standby / Polling"}
                    </p>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-[11px] text-ink-muted mt-0.5">
                    {lastLiveUpdate
                      ? `Sinkron terakhir: ${new Date(lastLiveUpdate).toLocaleTimeString("id-ID")}`
                      : "Terhubung ke server PocketBase"}
                  </p>
                </div>
                <Button variant="ghost" size="sm" icon={RefreshCw} onClick={reload}>
                  Muat Ulang
                </Button>
              </div>

              <div className="mt-4 divide-y divide-line dark:divide-night-line text-xs">
                <KeyValue label="Target Anggaran" value={formatRupiah(couple?.target_budget || 0)} />
                <KeyValue label="Tanggal Pernikahan" value={formatDateId(couple?.wedding_date)} />
                <KeyValue label="Venue Acara" value={couple?.venue || "-"} />
                <KeyValue label="Basis Data" value="PocketBase • SQLite" mono />
              </div>
            </Card>

            {/* Aplikasi PWA & Perangkat */}
            <Card>
              <SectionTitle>Aplikasi &amp; PWA</SectionTitle>
              <div className="flex items-center gap-4 mt-4 p-4 rounded-3xl bg-canvas-sunken/60 dark:bg-night-sunken/60 border border-line dark:border-night-line">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 p-2 shadow-soft grid place-items-center shrink-0 border border-white/20">
                  <img
                    src="/logo-transparent.png"
                    alt="Logo Wedding Rings"
                    className="w-full h-full object-contain filter drop-shadow"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-sm truncate">Wedding Planner</p>
                  <p className="text-xs text-ink-muted">Rizky &amp; Reina • Versi PWA 1.0</p>
                  <p className="text-[11px] text-ink-faint mt-0.5">Mendukung Android, iPhone, iPad &amp; Desktop</p>
                </div>
                <div className="shrink-0">
                  <PWAInstallButton />
                </div>
              </div>

              <PWAInstallBanner className="mt-4" />

              {/* Tombol Bersihkan Cache */}
              <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-line dark:border-night-line text-xs">
                <div>
                  <p className="font-medium">Bersihkan Cache &amp; Refresh PWA</p>
                  <p className="text-ink-faint text-[11px] mt-0.5">
                    Hapus penyimpanan offline lokal dan muat ulang versi terbaru dari server.
                  </p>
                </div>
                <Button variant="outline" size="sm" icon={RotateCcw} onClick={clearCacheAndReload}>
                  Bersihkan Cache
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </Page>
  );
}

/* ========================================================================== */

function coupleNameDisplay(couple) {
  if (couple?.cpp_nickname && couple?.cpw_nickname) {
    return `${couple.cpp_nickname} & ${couple.cpw_nickname}`;
  }
  return "Rizky & Reina";
}

function ToggleRow({ icon: Icon, label, hint, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-center gap-4 p-3 -mx-3 rounded-2xl hover:bg-canvas-sunken dark:hover:bg-night-sunken transition-colors text-left focus-ring"
    >
      <span className="p-2.5 rounded-2xl bg-canvas-sunken dark:bg-night-sunken text-ink-muted shrink-0">
        <Icon size={18} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-ink-faint mt-0.5 leading-relaxed">{hint}</span>
      </span>
      <span
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
          checked ? "bg-rose-600" : "bg-line-strong dark:bg-night-line"
        }`}
      >
        <motion.span
          animate={{ x: checked ? 22 : 3 }}
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm"
        />
      </span>
    </button>
  );
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 focus-ring ${
        checked ? "bg-rose-600" : "bg-line-strong dark:bg-night-line"
      }`}
    >
      <motion.span
        animate={{ x: checked ? 22 : 3 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm"
      />
    </button>
  );
}

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

