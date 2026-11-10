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
  Landmark,
  Tags,
  LifeBuoy,
} from "lucide-react";
import { formatUserRole } from "../lib/helpdesk";
import HelpdeskModal from "../components/HelpdeskModal";
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
  ToggleSwitch,
  ToggleRow,
} from "../components/ui";
import RekeningQrisTab from "./settings/RekeningQrisTab";
import CategoriesAdatTab from "./settings/CategoriesAdatTab";
import TimezoneThemeTab from "./settings/TimezoneThemeTab";
import TrashTab from "./settings/TrashTab";
import { Avatar } from "../components/Avatar";
import { PWAInstallButton, PWAInstallBanner } from "../components/PWAInstallPrompt";
import { useWedding, DEFAULT_WA_TEMPLATE } from "../lib/weddingData";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import { useLang } from "../lib/i18n";
import {
  formatDateId,
  formatDateTime,
  formatRupiah,
  formatDateConfigured,
} from "../lib/format";
import {
  formatBankAccountsForWa,
} from "../lib/masterData";
import { isDriveFolder, toDriveOpenUrl } from "../lib/photos";
import { exportToCsv, exportToJson, printReport } from "../lib/export";
import { printMasterGuidebook } from "../lib/weddingMasterGuidebook";
import { LOGO_URL } from "../lib/icons";
import pb from "../lib/pocketbase";
import { toast } from "sonner";
import {
  getCoupleDisplayName,
  getCppNickname,
  getCpwNickname,
  getCoupleInitials,
  getCoupleSlug,
} from "../lib/couple";

const EASE = [0.22, 1, 0.36, 1];

const TABS = [
  { id: "acara", label: "Acara & Pasangan", icon: Heart },
  { id: "pasangan", label: "Akun & Hak Akses", icon: Users },
  { id: "rekening", label: "Rekening & QRIS", icon: Landmark },
  { id: "kategori", label: "Kategori & Adat", icon: Tags },
  { id: "undangan", label: "Undangan & WA", icon: Send },
  { id: "alerts", label: "Peringatan", icon: Bell },
  { id: "tampilan", label: "Tampilan & Waktu", icon: Palette },
  { id: "prewedding", label: "Prewedding & Galeri", icon: ImageIcon },
  { id: "cadangan", label: "Ekspor & Cadangan", icon: FileSpreadsheet },
  { id: "sampah", label: "Tempat Sampah", icon: Trash2 },
  { id: "keamanan", label: "Kata Sandi", icon: ShieldCheck },
  { id: "demo", label: "Kontrol Demo", icon: Shield },
  { id: "sistem", label: "Sistem & PWA", icon: Laptop },
];

function generatePanitiaPassword(username) {
  const cleanBase = (username || "panitia").replace(/[^a-z0-9]/gi, "").toLowerCase();
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    const pin = 100 + (arr[0] % 900);
    return `${cleanBase}${pin}`;
  }
  return `${cleanBase}2028`;
}

/** Masa berlaku demo: ISO timestamp `days` hari dari sekarang. */
function demoExpiryIso(days) {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

/** Menandai akun demo nonaktif dengan masa berlaku yang sudah lewat. */
function demoExpiredIso() {
  return new Date(Date.now() - 60_000).toISOString();
}

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
    rundowns,
    gifts,
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
  const { user, logout, isSuperuser, isAdmin, displayName, isPanitia } = useAuth();
  const { isDark, toggle, followsSystem } = useTheme();
  const { lang, setLang, t } = useLang();
  const [userSelectedLang, setUserSelectedLang] = useState(null);
  const selectedLang = userSelectedLang ?? lang;
  const reduce = useReducedMotion();

  const handleApplyLanguage = () => {
    setLang(selectedLang);
    setUserSelectedLang(null);
    if (selectedLang === "id") {
      toast.success(t("Bahasa berhasil diterapkan: Bahasa Indonesia"));
    } else {
      toast.success(t("Language applied successfully: English"));
    }
  };

  const [rawActiveTab, setActiveTab] = useState("acara");
  const [helpdeskModalOpen, setHelpdeskModalOpen] = useState(false);
  const activeTab =
    isPanitia && (rawActiveTab === "pasangan" || rawActiveTab === "cadangan" || rawActiveTab === "sampah" || rawActiveTab === "rekening" || rawActiveTab === "demo")
      ? "acara"
      : rawActiveTab === "demo" && !isAdmin
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

  // --- Form 2: Akun Pasangan Dinamis (Skema 2 Akun) ---
  const [partnerUsers, setPartnerUsers] = useState([]);
  const [partnerModal, setPartnerModal] = useState({
    open: false,
    role: "CPW",
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [creatingPartner, setCreatingPartner] = useState(false);
  const [partnerMsg, setPartnerMsg] = useState(null);

  // --- Reset Sandi Darurat Panitia ---
  const [resetPasswordModal, setResetPasswordModal] = useState({
    open: false,
    user: null,
    newPassword: "",
    isSubmitting: false,
  });

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

  // --- Kontrol Akun Demo (khusus admin) ---
  const [demoActionId, setDemoActionId] = useState(null);
  // Waktu acuan untuk status demo. Diambil di effect agar render tetap murni.
  const [nowTs, setNowTs] = useState(0);

  // Penanda waktu status akun demo (diperbarui tiap menit).
  useEffect(() => {
    const tick = () => setNowTs(Date.now());
    tick();
    const timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
  }, []);

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
  }|${JSON.stringify(settings?.bank_accounts || [])}|${settings?.qris_image_url || ""}|${
    JSON.stringify(settings?.custom_budget_categories || [])
  }|${JSON.stringify(settings?.custom_vendor_categories || [])}|${settings?.event_timezone || "Asia/Jakarta"}|${
    settings?.date_format_style || "formal"
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
    ? TABS.filter((t) => !["pasangan", "cadangan", "sampah", "demo", "rekening"].includes(t.id))
    : isAdmin
      ? TABS
      : TABS.filter((t) => t.id !== "demo");

  const tabDirtyMap = {
    acara: isCoupleDirty,
    undangan: isInvitationDirty,
    alerts: isAlertsDirty,
    prewedding: isGalleryDirty,
  };

  const isAnyDirty =
    isCoupleDirty ||
    isInvitationDirty ||
    isAlertsDirty ||
    isGalleryDirty;

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
      toast.success("Data calon pengantin & acara berhasil disimpan!");
      setTimeout(() => setSavedCouple(false), 2400);
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan data acara: " + (err?.message || err));
    } finally {
      setSavingCouple(false);
    }
  };

  // 2. Buat Akun Pasangan Dinamis (CPP / CPW)
  const openCreatePartner = (role) => {
    const isCpp = role === "CPP";
    const partnerName = isCpp
      ? couple?.cpp_full_name || couple?.cpp_nickname || "Calon Pengantin Pria"
      : couple?.cpw_full_name || couple?.cpw_nickname || "Calon Pengantin Wanita";
    const nick = (isCpp ? couple?.cpp_nickname : couple?.cpw_nickname) || (isCpp ? "cpp" : "cpw");
    const cleanNick = nick.toLowerCase().replace(/[^a-z0-9]/gi, "") || (isCpp ? "cpp" : "cpw");

    setPartnerModal({
      open: true,
      role,
      name: partnerName,
      username: cleanNick,
      email: `${cleanNick}@wedding.local`,
      password: `${cleanNick}123`,
    });
    setPartnerMsg(null);
  };

  const handleCreatePartner = async (e) => {
    e.preventDefault();
    setCreatingPartner(true);
    setPartnerMsg(null);
    try {
      const cleanUsername = partnerModal.username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");
      if (!cleanUsername) throw new Error("Username wajib diisi.");
      if (!partnerModal.password || partnerModal.password.length < 6) {
        throw new Error("Kata sandi minimal 6 karakter.");
      }

      await pb.collection("users").create({
        username: cleanUsername,
        name: partnerModal.name.trim() || cleanUsername,
        email: partnerModal.email.trim(),
        password: partnerModal.password,
        passwordConfirm: partnerModal.password,
        partner_role: partnerModal.role,
        app_role: "owner",
        couple: couple?.id || null,
      });

      const roleLabel = partnerModal.role === "CPP" ? "Calon Pengantin Pria (CPP)" : "Calon Pengantin Wanita (CPW)";
      setPartnerMsg({
        type: "success",
        message: `Akun ${roleLabel} "${partnerModal.name}" berhasil dibuat! Username: "${cleanUsername}", Password: "${partnerModal.password}". Berikan kredensial ini kepada pasangan Anda untuk masuk.`,
      });
      await refreshUsers();
      setPartnerModal((prev) => ({ ...prev, open: false }));
      if (addLog) {
        addLog(`Akun pasangan (${partnerModal.name} - ${partnerModal.role}) berhasil didaftarkan`, "info");
      }
    } catch (err) {
      setPartnerMsg({
        type: "error",
        message: err?.message || "Gagal membuat akun pasangan.",
      });
    } finally {
      setCreatingPartner(false);
    }
  };

  // 2b. Reset Kata Sandi Darurat Panitia (Akses Hari-H)
  const handleOpenResetPassword = (targetUser) => {
    const generatedPassword = generatePanitiaPassword(targetUser.username);
    setResetPasswordModal({
      open: true,
      user: targetUser,
      newPassword: generatedPassword,
      isSubmitting: false,
    });
  };

  const handleSaveResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPasswordModal.user) return;
    const { user: targetUser, newPassword } = resetPasswordModal;
    if (!newPassword || newPassword.length < 6) {
      toast.error("Kata sandi minimal 6 karakter.");
      return;
    }
    setResetPasswordModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      await pb.collection("users").update(targetUser.id, {
        password: newPassword,
        passwordConfirm: newPassword,
      });
      if (addLog) {
        addLog(`Reset kata sandi darurat untuk akun panitia: ${targetUser.name || targetUser.username}`, "warning");
      }
      toast.success(`Kata sandi "${targetUser.name || targetUser.username}" berhasil direset ke: ${newPassword}`);
      if (navigator.clipboard) {
        navigator.clipboard.writeText(newPassword).catch(() => {});
      }
      setResetPasswordModal({ open: false, user: null, newPassword: "", isSubmitting: false });
    } catch (err) {
      toast.error("Gagal mereset kata sandi: " + (err.message || err));
      setResetPasswordModal((prev) => ({ ...prev, isSubmitting: false }));
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
      toast.info(`Akun "${userName}" telah dihapus.`);
      if (addLog) {
        addLog(`Akun panitia (${userName}) telah dihapus`, "warning");
      }
    } catch (err) {
      toast.error("Gagal menghapus akun: " + (err?.message || err));
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
      toast.success("Tautan & template undangan WhatsApp berhasil disimpan!");
      setTimeout(() => setSavedSettings(false), 2400);
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan template: " + (err?.message || err));
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
      toast.success("Preferensi pengingat & notifikasi berhasil disimpan!");
      setTimeout(() => setSavedAlerts(false), 2400);
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan preferensi alert: " + (err?.message || err));
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
      { key: "name", label: t("Nama Tamu") },
      { key: "category", label: t("Kategori") },
      { key: "side", label: "Pihak" },
      { key: "priority", label: t("Prioritas") },
      { key: "pax", label: t("Jumlah Pax") },
      { key: "status", label: t("Status RSVP") },
      { key: "phone", label: t("No. WhatsApp") },
      { key: "invitation_sent", label: "Sudah Kirim Undangan", format: (v) => (v ? "Ya" : "Belum") },
      { key: "invitation_url", label: "Link Undangan Personal" },
      { key: "notes", label: "Catatan" },
    ];
    const couplePrefix = couple?.cpp_nickname && couple?.cpw_nickname ? `${couple.cpp_nickname}_${couple.cpw_nickname}` : "Pernikahan";
    exportToCsv(`Daftar_Tamu_${couplePrefix}.csv`, headers, guests);
  };

  const exportBudgetsCsv = () => {
    const couplePrefix = couple?.cpp_nickname && couple?.cpw_nickname ? `${couple.cpp_nickname}_${couple.cpw_nickname}` : "Pernikahan";
    const headers = [
      { key: "category", label: t("Kategori") },
      { key: "item", label: "Nama Pos / Item" },
      { key: "allocated", label: "Alokasi Target (Rp)", format: (v) => v || 0 },
      { key: "actual", label: "Realisasi (Rp)", format: (v) => v || 0 },
      { key: "selisih", label: "Selisih (Rp)", format: (_, r) => (r.allocated || 0) - (r.actual || 0) },
      { key: "paid_by", label: "Ditanggung Oleh" },
      { key: "notes", label: "Catatan" },
    ];
    exportToCsv(`Rencana_Anggaran_${couplePrefix}.csv`, headers, budgets);
  };

  const exportVendorsCsv = () => {
    const couplePrefix = couple?.cpp_nickname && couple?.cpw_nickname ? `${couple.cpp_nickname}_${couple.cpw_nickname}` : "Pernikahan";
    const headers = [
      { key: "category", label: t("Kategori") },
      { key: "name", label: "Nama Vendor" },
      { key: "contact", label: "Kontak / PIC" },
      { key: "phone", label: "No. HP / WA" },
      { key: "cost", label: "Biaya (Rp)", format: (v) => v || 0 },
      { key: "due_date", label: "Tenggat Waktu" },
      { key: "done", label: "Status Selesai", format: (v) => (v ? "Selesai" : "Belum") },
      { key: "notes", label: "Catatan" },
    ];
    exportToCsv(`Daftar_Vendor_${couplePrefix}.csv`, headers, vendors);
  };

  const exportSeserahanCsv = () => {
    const couplePrefix = couple?.cpp_nickname && couple?.cpw_nickname ? `${couple.cpp_nickname}_${couple.cpw_nickname}` : "Pernikahan";
    const headers = [
      { key: "side", label: "Pihak (CPP/CPW)" },
      { key: "box_number", label: "Nomor Kotak" },
      { key: "title", label: "Nama Barang / Item" },
      { key: "purchased", label: "Sudah Dibeli", format: (v) => (v ? "Sudah" : "Belum") },
      { key: "packed", label: "Sudah Dihias/Bungkus", format: (v) => (v ? "Sudah" : "Belum") },
      { key: "cost", label: "Biaya (Rp)", format: (v) => v || 0 },
      { key: "notes", label: "Catatan" },
    ];
    exportToCsv(`Daftar_Seserahan_${couplePrefix}.csv`, headers, seserahan);
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
      rundowns,
      gifts,
      logs,
    };
    const couplePrefix = couple?.cpp_nickname && couple?.cpw_nickname ? `${couple.cpp_nickname}_${couple.cpw_nickname}` : "Pernikahan";
    const dateStr = new Date().toISOString().slice(0, 10);
    exportToJson(`Backup_${couplePrefix}_${dateStr}.json`, snapshotData);
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
          summary: `Tamu: ${parsed.guests?.length || 0}, Anggaran: ${parsed.budgets?.length || 0}, Vendor: ${parsed.vendors?.length || 0}, Rundown: ${parsed.rundowns?.length || 0}, Kado: ${parsed.gifts?.length || 0}`,
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

  const coupleName = getCoupleDisplayName(couple, user, "Calon Pengantin");
  const cppNicknameResolved = getCppNickname(couple, user);
  const cpwNicknameResolved = getCpwNickname(couple, user);
  const coupleSlug = getCoupleSlug(couple, user);
  const coupleInitials = getCoupleInitials(couple, user);

  const formattedBankAccounts = formatBankAccountsForWa(settings?.bank_accounts || []);
  const activeDateFormatStyle = settings?.date_format_style || "formal";

  const samplePreviewText = (waTemplate || DEFAULT_WA_TEMPLATE)
    .replace(/\{nama\}/g, "Bapak Budi Santoso")
    .replace(/\{link\}/g, `${invitationUrl || `https://undangan.me/${coupleSlug}`}?to=Budi+Santoso`)
    .replace(/\{pax\}/g, "2 pax")
    .replace(/\{venue\}/g, venue || couple?.venue || "Gedung Resepsi")
    .replace(/\{meja\}/g, "Meja 05 (VIP)")
    .replace(/\{pengantin\}/g, coupleName)
    .replace(/\{cpp\}/g, cppNicknameResolved)
    .replace(/\{cpw\}/g, cpwNicknameResolved)
    .replace(/\{tanggal\}/g, weddingDate ? formatDateConfigured(weddingDate, activeDateFormatStyle) : "Hari Bahagia")
    .replace(/\{rekening\}/g, formattedBankAccounts);

  // Cari akun pasangan untuk Skema 2 Akun
  const cppNickLower = (cppNicknameResolved || "").toLowerCase();
  const cpwNickLower = (cpwNicknameResolved || "").toLowerCase();

  const cppUser = partnerUsers.find(
    (u) =>
      u.partner_role === "CPP" ||
      (cppNickLower && (u.name || "").toLowerCase().includes(cppNickLower)) ||
      (cppNickLower && (u.username || "").toLowerCase() === cppNickLower) ||
      u.username === "cpp" ||
      (u.username === "admin" && !u.partner_role)
  );
  const cpwUser = partnerUsers.find(
    (u) =>
      u.partner_role === "CPW" ||
      (cpwNickLower && (u.name || "").toLowerCase().includes(cpwNickLower)) ||
      (cpwNickLower && (u.username || "").toLowerCase() === cpwNickLower) ||
      u.username === "cpw"
  );

  // Akun Panitia & Wedding Organizer (Hak Akses Terbatas)
  const committeeUsers = partnerUsers.filter(
    (u) =>
      (u.app_role === "panitia" || u.app_role === "wo") &&
      u.id !== cppUser?.id &&
      u.id !== cpwUser?.id &&
      u.id !== user?.id
  );

  const driveOpen = toDriveOpenUrl(drive);

  // --- Kontrol Akun Demo (admin) ---
  // Akun demo dibatasi 7 hari. Admin dapat mengaktifkan kembali, memperpanjang,
  // atau menonaktifkan lebih awal. Penegakan tetap di server: aturan koleksi
  // hanya meloloskan data bila `demo_expires_at` masih di masa depan.
  const demoUsers = partnerUsers.filter((u) => u.is_demo);

  const applyDemoExpiry = async (target, expiresAt, successMessage) => {
    setDemoActionId(target.id);
    try {
      await pb.collection("users").update(target.id, {
        is_demo: true,
        demo_expires_at: expiresAt,
      });
      toast.success(successMessage);
      await refreshUsers();
    } catch (err) {
      console.error("Gagal memperbarui status demo:", err);
      toast.error("Gagal memperbarui status demo: " + (err?.message || "Terjadi kesalahan"));
    } finally {
      setDemoActionId(null);
    }
  };

  const handleDemoActivate = (target, days = 7) =>
    applyDemoExpiry(
      target,
      demoExpiryIso(days),
      `Akun demo "${target.name || target.username}" aktif selama ${days} hari.`
    );

  const handleDemoDisable = (target) =>
    applyDemoExpiry(
      target,
      demoExpiredIso(),
      `Akun demo "${target.name || target.username}" dinonaktifkan.`
    );

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
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
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
              <span>{t(tab.label)}</span>
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
                Perubahan nama pengantin, tanggal, dan venue di sini akan otomatis memperbarui hitungan mundur di Dashboard dan seluruh dokumen perencanaan secara langsung.
              </p>

              <form onSubmit={handleSaveCouple} className="space-y-4 mt-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Panggilan CPP (Pria)" hint="Nama sapaan calon pengantin pria.">
                    <Input
                      value={cppNickname}
                      onChange={(e) => setCppNickname(e.target.value)}
                      placeholder="Contoh: Dimas"
                      required
                    />
                  </Field>
                  <Field label="Nama Lengkap CPP" hint="Nama lengkap dan gelar (jika ada).">
                    <Input
                      value={cppFullName}
                      onChange={(e) => setCppFullName(e.target.value)}
                      placeholder="Contoh: Dimas Pratama, S.T."
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Panggilan CPW (Wanita)" hint="Nama sapaan calon pengantin wanita.">
                    <Input
                      value={cpwNickname}
                      onChange={(e) => setCpwNickname(e.target.value)}
                      placeholder="Contoh: Annisa"
                      required
                    />
                  </Field>
                  <Field label="Nama Lengkap CPW" hint="Nama lengkap dan gelar (jika ada).">
                    <Input
                      value={cpwFullName}
                      onChange={(e) => setCpwFullName(e.target.value)}
                      placeholder="Contoh: Annisa Larasati, S.Ked."
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <Field
                    label="Tanggal Pernikahan (Hari-H)"
                    hint="Menentukan hitungan mundur dashboard."
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
                {(couple?.cpp_nickname || "Calon Pengantin Pria")} dan {(couple?.cpw_nickname || "Calon Pengantin Wanita")} memiliki akun masing-masing untuk masuk ke aplikasi. Seluruh catatan tamu, ceklis vendor, dan anggaran tersinkronisasi otomatis saat terhubung.
              </p>

              {partnerMsg && (
                <div
                  className={`mt-4 p-3.5 rounded-2xl text-xs flex items-start gap-2.5 ${
                    partnerMsg.type === "success"
                      ? "bg-sage-500/10 text-sage-800 dark:text-sage-200 border border-sage-500/20"
                      : "bg-rose-500/10 text-rose-800 dark:text-rose-200 border border-rose-500/20"
                  }`}
                >
                  {partnerMsg.type === "success" ? <Check size={16} className="shrink-0 text-sage-600" /> : <AlertTriangle size={16} className="shrink-0 text-rose-600" />}
                  <span className="leading-relaxed">{partnerMsg.message}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                {/* Kartu CPP (Calon Pengantin Pria) */}
                <div className="p-4 rounded-3xl bg-canvas-sunken/60 dark:bg-night-sunken/60 border border-line dark:border-night-line flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300">
                        CPP (Pengantin Pria)
                      </span>
                      {cppUser ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-sage-600 dark:text-sage-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-sage-500" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Belum Didaftarkan
                        </span>
                      )}
                    </div>

                    {cppUser ? (
                      <div className="flex items-center gap-3">
                        <Avatar name={cppUser?.name || couple?.cpp_nickname || "CPP"} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">{cppUser?.name || couple?.cpp_full_name || couple?.cpp_nickname || "Calon Pengantin Pria"}</p>
                          <p className="text-xs text-ink-muted truncate">@{cppUser?.username}</p>
                          <p className="text-[11px] text-ink-faint truncate">{cppUser?.email}</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold text-sm">Akun {couple?.cpp_nickname || "CPP"} Belum Dibuat</p>
                        <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                          Daftarkan akun {couple?.cpp_nickname || "Calon Pengantin Pria"} agar dapat mengelola Wedding Planner dari perangkatnya sendiri.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-line/60 dark:border-night-line/60">
                    {cppUser ? (
                      <p className="text-[11px] text-ink-faint">
                        {user?.id === cppUser?.id ? "Sedang login di perangkat ini" : "Terdaftar di database"}
                      </p>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={UserPlus}
                        className="w-full"
                        onClick={() => openCreatePartner("CPP")}
                      >
                        Daftarkan Akun {couple?.cpp_nickname || "CPP"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Kartu CPW (Calon Pengantin Wanita) */}
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
                        <Avatar name={cpwUser?.name || couple?.cpw_nickname || "CPW"} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">{cpwUser.name || couple?.cpw_full_name || couple?.cpw_nickname || "Calon Pengantin Wanita"}</p>
                          <p className="text-xs text-ink-muted truncate">@{cpwUser.username}</p>
                          <p className="text-[11px] text-ink-faint truncate">{cpwUser.email}</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold text-sm">Akun {couple?.cpw_nickname || "CPW"} Belum Dibuat</p>
                        <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                          Daftarkan akun {couple?.cpw_nickname || "Calon Pengantin Wanita"} agar dia dapat membuka dan mengelola Wedding Planner dari HP-nya sendiri.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-line/60 dark:border-night-line/60">
                    {cpwUser ? (
                      <p className="text-[11px] text-ink-faint">
                        {user?.id === cpwUser.id ? "Sedang login di perangkat ini" : "Dapat login di perangkat pasangan"}
                      </p>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={UserPlus}
                        className="w-full"
                        onClick={() => openCreatePartner("CPW")}
                      >
                        Daftarkan Akun {couple?.cpw_nickname || "CPW"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Modal / Inline Buat Akun Pasangan Dinamis */}
              {partnerModal.open && (
                <div className="mt-5 p-4 rounded-3xl bg-rose-500/5 border border-rose-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-xs text-rose-700 dark:text-rose-300">
                      Pendaftaran Cepat Akun {partnerModal.role === "CPP" ? (couple?.cpp_nickname || "CPP") : (couple?.cpw_nickname || "CPW")} ({partnerModal.role})
                    </p>
                    <button
                      onClick={() => setPartnerModal((prev) => ({ ...prev, open: false }))}
                      className="text-xs text-ink-faint hover:text-ink"
                    >
                      Batal
                    </button>
                  </div>
                  <form onSubmit={handleCreatePartner} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label={`Username ${partnerModal.role}`} hint="Dipakai saat masuk ke aplikasi.">
                        <Input
                          value={partnerModal.username}
                          onChange={(e) => setPartnerModal({ ...partnerModal, username: e.target.value })}
                          required
                        />
                      </Field>
                      <Field label="Nama Lengkap" hint="Nama tampilan profil.">
                        <Input
                          value={partnerModal.name}
                          onChange={(e) => setPartnerModal({ ...partnerModal, name: e.target.value })}
                          required
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Email" hint="Email login akun.">
                        <Input
                          type="email"
                          value={partnerModal.email}
                          onChange={(e) => setPartnerModal({ ...partnerModal, email: e.target.value })}
                          required
                        />
                      </Field>
                      <Field label="Kata Sandi Awal" hint="Dapat diubah mandiri di menu Pengaturan.">
                        <Input
                          value={partnerModal.password}
                          onChange={(e) => setPartnerModal({ ...partnerModal, password: e.target.value })}
                          required
                        />
                      </Field>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Button type="submit" loading={creatingPartner} icon={UserPlus}>
                        Buat &amp; Aktifkan Akun {partnerModal.role}
                      </Button>
                      <Button variant="ghost" onClick={() => setPartnerModal((prev) => ({ ...prev, open: false }))}>
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
                        className={`p-3 rounded-2xl text-left border transition-colors duration-150 ${
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
                        className={`p-3 rounded-2xl text-left border transition-colors duration-150 ${
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
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenResetPassword(u)}
                                  className="px-2 py-1 text-ink-muted hover:text-amber-600 transition-colors rounded-lg hover:bg-amber-500/10 flex items-center gap-1 text-[11px] font-medium"
                                  title="Reset Kata Sandi Akun Panitia (Akses Darurat Hari-H)"
                                >
                                  <KeyRound size={13} />
                                  <span className="hidden sm:inline">Reset Sandi</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isDeleting}
                                  onClick={() => handleDeleteUser(u.id, u.name || u.username)}
                                  className="p-1.5 text-ink-faint hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-500/10"
                                  title="Cabut akses akun ini"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
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

            {/* Modal Reset Sandi Darurat Panitia */}
            {resetPasswordModal.open && resetPasswordModal.user && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-canvas dark:bg-night border border-line dark:border-night-line rounded-3xl max-w-md w-full p-6 shadow-2xl">
                  <div className="flex items-center justify-between pb-3 border-b border-line dark:border-night-line mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-600">
                        <KeyRound size={16} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">Reset Kata Sandi Panitia</h3>
                        <p className="text-[11px] text-ink-muted">Akses darurat hari-H</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResetPasswordModal({ open: false, user: null, newPassword: "", isSubmitting: false })}
                      className="text-ink-muted hover:text-ink text-xs p-1"
                    >
                      Batal
                    </button>
                  </div>

                  <form onSubmit={handleSaveResetPassword} className="space-y-4">
                    <div className="p-3 rounded-2xl bg-canvas-sunken/60 dark:bg-night-sunken/60 border border-line dark:border-night-line text-xs">
                      <p className="text-ink-muted">
                        Akun: <strong>{resetPasswordModal.user.name || resetPasswordModal.user.username}</strong> (@{resetPasswordModal.user.username})
                      </p>
                      <p className="text-[11px] text-ink-faint mt-1 leading-relaxed">
                        Masukkan kata sandi baru untuk akun ini. Kata sandi lama akan langsung diganti dan otomatis disalin ke papan klip.
                      </p>
                    </div>

                    <Field label="Kata Sandi Baru" hint="Minimal 6 karakter.">
                      <Input
                        value={resetPasswordModal.newPassword}
                        onChange={(e) =>
                          setResetPasswordModal((prev) => ({ ...prev, newPassword: e.target.value }))
                        }
                        required
                      />
                    </Field>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setResetPasswordModal({ open: false, user: null, newPassword: "", isSubmitting: false })}
                      >
                        Batal
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        loading={resetPasswordModal.isSubmitting}
                        icon={Check}
                      >
                        Simpan &amp; Salin Sandi
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ===================== TAB REKENING & QRIS (FITUR 1) ===================== */}
        {activeTab === "rekening" && (
          <RekeningQrisTab
            settings={settings}
            saveSettings={saveSettings}
            cppNicknameResolved={cppNicknameResolved}
            cpwNicknameResolved={cpwNicknameResolved}
            reduce={reduce}
            t={t}
          />
        )}

        {/* ===================== TAB KATEGORI & ADAT (FITUR 3) ===================== */}
        {activeTab === "kategori" && (
          <CategoriesAdatTab
            settings={settings}
            saveSettings={saveSettings}
            reduce={reduce}
            t={t}
          />
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
                  hint={`Contoh: https://undangan.me/${coupleSlug} (link tiap tamu otomatis ditambahkan ?to=Nama+Tamu).`}
                >
                  <Input
                    type="url"
                    value={invitationUrl}
                    onChange={(e) => setInvitationUrl(e.target.value)}
                    placeholder={`https://undangan.me/${coupleSlug}`}
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
                      onClick={() => insertVariable("{pengantin}")}
                      className="px-2.5 py-1 rounded-xl text-xs font-mono bg-canvas-sunken dark:bg-night-sunken hover:bg-rose-500/10 hover:text-rose-600 transition"
                      title="Sisipkan nama kedua mempelai"
                    >
                      + {"{pengantin}"}
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
                    <button
                      type="button"
                      onClick={() => insertVariable("{rekening}")}
                      className="px-2.5 py-1 rounded-xl text-xs font-mono bg-canvas-sunken dark:bg-night-sunken hover:bg-rose-500/10 hover:text-rose-600 transition"
                      title="Sisipkan nomor rekening bank & amplop digital"
                    >
                      + {"{rekening}"}
                    </button>
                  </div>

                  <textarea
                    id="wa-template-textarea"
                    rows={7}
                    value={waTemplate}
                    onChange={(e) => setWaTemplate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-canvas-sunken dark:bg-night-sunken border border-line dark:border-night-line text-sm text-ink dark:text-stone-100 placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-colors font-sans leading-relaxed"
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
                        {coupleInitials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-xs text-[#075E54] dark:text-stone-100 truncate">
                          {coupleName}
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
                <SectionTitle count="Notifikasi & Peringatan">Pusat Peringatan</SectionTitle>
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
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">Peringatan Tenggat Waktu Vendor</p>
                      <p className="text-xs text-ink-muted mt-0.5">
                        Tampilkan spanduk peringatan merah di halaman vendor dan dashboard.
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={alertVendorDeadline}
                      onChange={setAlertVendorDeadline}
                      aria-label="Peringatan Tenggat Waktu Vendor"
                    />
                  </div>

                  {alertVendorDeadline && (
                    <div className="pt-3 border-t border-line/60 dark:border-night-line/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <span className="text-ink-muted font-medium">Batas hari peringatan mendesak:</span>
                      <select
                        value={alertVendorDays}
                        onChange={(e) => setAlertVendorDays(Number(e.target.value))}
                        className="px-3.5 py-1.5 rounded-xl bg-canvas dark:bg-night-card border border-line dark:border-night-line text-ink dark:text-stone-100 text-xs font-semibold focus-ring cursor-pointer shadow-xs"
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
                <div className="p-4 rounded-3xl bg-canvas-sunken/60 dark:bg-night-sunken/60 border border-line dark:border-night-line flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">Peringatan Pembengkakan Anggaran</p>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Beri tanda peringatan merah jika realisasi biaya suatu pos melebihi alokasi awal.
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={alertBudgetOverrun}
                    onChange={setAlertBudgetOverrun}
                    aria-label="Peringatan Pembengkakan Anggaran"
                  />
                </div>

                {/* 3. Pengingat RSVP Tamu */}
                <div className="p-4 rounded-3xl bg-canvas-sunken/60 dark:bg-night-sunken/60 border border-line dark:border-night-line flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">Pengingat Follow-up Tamu Prioritas</p>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Beri highlight pada tamu prioritas A (Must Invite) yang belum konfirmasi kehadiran.
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={alertRsvpReminder}
                    onChange={setAlertRsvpReminder}
                    aria-label="Pengingat Follow-up Tamu Prioritas"
                  />
                </div>

                {/* 4. Notifikasi Perangkat */}
                <div className="p-4 rounded-3xl bg-canvas-sunken/60 dark:bg-night-sunken/60 border border-line dark:border-night-line flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">Notifikasi Perangkat</p>
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

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-line/60 dark:border-night-line/60">
                  <div className="text-xs text-ink-faint">
                    {isAlertsDirty ? (
                      <span className="text-amber-600 dark:text-amber-400 font-medium">• Perubahan belum disimpan</span>
                    ) : (
                      <span>Pengaturan notifikasi otomatis aktif</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {savedAlerts && (
                      <span className="text-xs text-sage-600 dark:text-sage-300 flex items-center gap-1.5">
                        <Check size={14} /> Preferensi tersimpan
                      </span>
                    )}
                    <Button onClick={handleSaveAlerts} loading={savingAlerts} icon={savedAlerts ? Check : Save}>
                      {savedAlerts ? t("Tersimpan!") : t("Simpan Pengaturan")}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ===================== TAB 5: TAMPILAN & TEMA ===================== */}
        {activeTab === "tampilan" && (
          <TimezoneThemeTab
            settings={settings}
            saveSettings={saveSettings}
            weddingDate={weddingDate}
            isDark={isDark}
            toggle={toggle}
            followsSystem={followsSystem}
            lang={lang}
            setLang={setLang}
            userSelectedLang={userSelectedLang}
            setUserSelectedLang={setUserSelectedLang}
            handleApplyLanguage={handleApplyLanguage}
            reduce={reduce}
            t={t}
          />
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
                  label={t("Tautan Google Drive")}
                  hint={
                    drive
                      ? isDriveFolder(drive)
                        ? t("Tautan folder — foto di dalamnya dapat ditambahkan di halaman Galeri.")
                        : t("Tautan berkas dikenali.")
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

                <Field label={t("Judul galeri")} hint={t("Muncul sebagai judul bagian foto di dashboard utama.")}>
                  <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={`Momen Prewedding ${coupleName}`}
                  />
                </Field>

                <ToggleRow
                  icon={Check}
                  label={t("Sudah sesi prewedding")}
                  hint={t("Aktifkan setelah sesi foto selesai agar bagian galeri muncul di dashboard.")}
                  checked={preweddingDone}
                  onChange={setPreweddingDone}
                />

                <ToggleRow
                  icon={ImageIcon}
                  label={t("Tampilkan galeri di dashboard")}
                  hint={t("Matikan jika ingin foto hanya terlihat saat membuka halaman Galeri.")}
                  checked={showOnDashboard}
                  onChange={setShowOnDashboard}
                />

                <div className="flex items-center gap-3 pt-1">
                  <Button onClick={handleSaveGallery} loading={savingGallery} icon={savedGallery ? Check : Save}>
                    {savedGallery ? t("Tersimpan") : t("Simpan Pengaturan Galeri")}
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
                  variant="primary"
                  icon={Printer}
                  className="flex-1"
                  onClick={() => printMasterGuidebook({ couple, rundowns, vendors, guests, settings, user })}
                  title="Cetak atau Simpan Buku Panduan Pernikahan Lengkap ke PDF"
                >
                  Buku Panduan Pernikahan (PDF)
                </Button>
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
                  title="Cetak ringkasan lembar kerja"
                >
                  Cetak Ringkasan
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

        {/* ===================== TAB: KONTROL AKUN DEMO (ADMIN) ===================== */}
        {activeTab === "demo" && isAdmin && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="space-y-6"
          >
            <Card>
              <div className="flex items-center justify-between gap-3">
                <SectionTitle count={`${demoUsers.length} akun`}>Kontrol Akun Demo</SectionTitle>
                <span className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <Shield size={16} />
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                Akun demo otomatis kehilangan akses data setelah masa berlakunya habis. Dari sini
                admin dapat mengaktifkan kembali, memperpanjang, atau menonaktifkan lebih awal.
                Masa berlaku baru diterapkan pada server begitu akun tersebut memuat ulang sesinya.
              </p>

              <div className="mt-4 space-y-3">
                {demoUsers.length === 0 ? (
                  <EmptyState
                    icon={Shield}
                    message="Belum ada akun demo"
                    hint="Akun dengan penanda demo akan muncul di sini setelah dibuat."
                  />
                ) : (
                  demoUsers.map((demo) => {
                    const expiresAt = demo.demo_expires_at ? new Date(demo.demo_expires_at).getTime() : NaN;
                    const isExpired = !Number.isFinite(expiresAt) || expiresAt < nowTs;
                    const daysLeft = isExpired ? 0 : Math.ceil((expiresAt - nowTs) / 86_400_000);

                    return (
                      <div
                        key={demo.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-2xl border border-canvas-border dark:border-night-border bg-canvas-sunken/40 dark:bg-night-sunken/40"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Avatar name={demo.name || demo.username || demo.email} size="md" />
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {demo.name || demo.username || "Akun Demo"}
                            </p>
                            <p className="text-xs text-ink-muted truncate mt-0.5">
                              @{demo.username || "-"} · {demo.email}
                            </p>
                            <p className="text-[11px] text-ink-muted mt-1">
                              Berlaku sampai {formatDateTime(demo.demo_expires_at)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge tone={isExpired ? "rose" : "sage"}>
                            {isExpired ? "Nonaktif" : `Aktif · ${daysLeft} hari`}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            icon={RotateCcw}
                            loading={demoActionId === demo.id}
                            onClick={() => handleDemoActivate(demo, 7)}
                          >
                            Aktifkan 7 hari
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            icon={RefreshCw}
                            disabled={demoActionId === demo.id}
                            onClick={() => handleDemoActivate(demo, 30)}
                          >
                            +30 hari
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={Lock}
                            disabled={demoActionId === demo.id || isExpired}
                            onClick={() => handleDemoDisable(demo)}
                          >
                            Nonaktifkan
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* ===================== TAB: TEMPAT SAMPAH (RECYCLE BIN) ===================== */}
        {activeTab === "sampah" && (
          <TrashTab
            trashItems={trashItems}
            restoreFromTrash={restoreFromTrash}
            permanentDeleteFromTrash={permanentDeleteFromTrash}
            emptyTrash={emptyTrash}
            reduce={reduce}
          />
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
                    src={LOGO_URL}
                    alt="Logo Wedding Rings"
                    className="w-full h-full object-contain filter drop-shadow"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-sm truncate">Wedding Planner</p>
                  <p className="text-xs text-ink-muted">{coupleName} • Versi PWA 1.0</p>
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

            {/* Pusat Bantuan & Laporkan Kendala (VPS Helpdesk SSO Handoff) */}
            <Card>
              <SectionTitle count="SSO Helpdesk">Bantuan &amp; Laporkan Kendala</SectionTitle>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                Mengalami kendala teknis, bug antarmuka, atau memerlukan bantuan pengelolaan pernikahan?
                Buka tiket langsung ke sistem VPS Helpdesk terpusat tanpa harus login atau registrasi ulang.
              </p>

              <div className="mt-4 p-4 rounded-3xl bg-canvas-sunken/60 dark:bg-night-sunken/60 border border-line dark:border-night-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 grid place-items-center shrink-0 border border-rose-500/20">
                    <LifeBuoy size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink dark:text-stone-100 flex items-center gap-2">
                      <span>Buat Tiket Dukungan Baru</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        SSO JIT
                      </span>
                    </p>
                    <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
                      Sesi akun <strong className="text-ink dark:text-stone-200">{user?.name || user?.username || "Pengguna"}</strong> ({formatUserRole(user)}) dan tautan halaman aktif akan otomatis diteruskan ke formulir tiket baru.
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  icon={LifeBuoy}
                  onClick={() => setHelpdeskModalOpen(true)}
                  className="shrink-0 whitespace-nowrap self-start sm:self-auto"
                >
                  Bantuan / Lapor Kendala
                </Button>
              </div>

              <div className="mt-3 flex items-center gap-2 text-[11px] text-ink-faint">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Terhubung ke VPS Helpdesk: <code className="font-mono text-[10px] text-ink-muted">https://43.156.236.102/helpdesk</code></span>
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Modal Terpadu Laporkan Kendala / Bantuan */}
      <HelpdeskModal
        isOpen={helpdeskModalOpen}
        onClose={() => setHelpdeskModalOpen(false)}
        user={user}
      />
    </Page>
  );
}


