import {
  LayoutDashboard,
  Wallet,
  FileCheck2,
  CalendarCheck,
  Users,
  Gift,
  Image,
  Settings,
  Clock,
  UserCheck,
  Coins,
  Moon,
  Sun,
  Bell,
  Palette,
  Upload,
  Save,
  Trash2,
} from "lucide-react";

/**
 * Ikon modul dipakai di tiga tempat sekaligus: bilah navigasi, header halaman,
 * dan kartu ringkasan dashboard. Didaftarkan sekali di sini supaya tidak ada
 * halaman yang memakai ikon berbeda untuk modul yang sama.
 */
export const MODULE_ICONS = {
  dashboard: LayoutDashboard,
  budget: Wallet,
  administration: FileCheck2,
  vendors: CalendarCheck,
  guests: Users,
  seserahan: Gift,
  gallery: Image,
  settings: Settings,
  rundown: Clock,
  reception: UserCheck,
  gifts: Coins,
};

/**
 * Ikon non-modul, supaya tidak ada lagi karakter emoji di antarmuka.
 * Semua dari Lucide agar gaya garisnya konsisten.
 */
export const UI_ICONS = {
  dark: Moon,
  light: Sun,
  bell: Bell,
  theme: Palette,
  upload: Upload,
  save: Save,
  remove: Trash2,
};

/**
 * Path aset statis yang otomatis mengikuti base URL deployment Vite (misal: /wedding/).
 * Menghindari URL absolut domain root (/logo-transparent.png) yang memicu 404 pada subpath.
 */
const BASE = import.meta.env?.BASE_URL || "/";
export const LOGO_URL = `${BASE}logo-transparent.png`;
export const APP_ICON_URL = `${BASE}apple-touch-icon.png`;
