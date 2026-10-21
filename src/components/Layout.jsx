import { useState, useMemo } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, LogOut, MoreHorizontal, X, Pencil } from "lucide-react";
import { useWedding } from "../lib/weddingData";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import { MODULE_ICONS, UI_ICONS, LOGO_URL } from "../lib/icons";
import { Avatar } from "./Avatar";
import { PWAInstallButton, PWAInstallFloatingBanner } from "./PWAInstallPrompt";

const WEDDING_DATE = "2028-02-17";

export default function Layout() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { couple, reload, loading, isLiveConnected } = useWedding();
  const { user, logout, isSuperuser, isPanitia } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();
  const location = useLocation();

  const ThemeIcon = isDark ? UI_ICONS.light : UI_ICONS.dark;

  const coupleName =
    couple?.cpp_nickname && couple?.cpw_nickname
      ? `${couple.cpp_nickname} & ${couple.cpw_nickname}`
      : "Wedding Planner";

  const navItems = useMemo(() => {
    if (isPanitia) {
      return [
        { to: "/", label: "Dasbor", icon: "dashboard", end: true },
        { to: "/rundown", label: "Itinerary", icon: "rundown" },
        { to: "/reception", label: "Meja Tamu", icon: "reception" },
        { to: "/guests", label: "Tamu", icon: "guests" },
        { to: "/vendors", label: "Vendor", icon: "vendors" },
        { to: "/gallery", label: "Galeri", icon: "gallery" },
        { to: "/settings", label: "Pengaturan", icon: "settings" },
      ];
    }
    return [
      { to: "/", label: "Dasbor", icon: "dashboard", end: true },
      { to: "/rundown", label: "Itinerary", icon: "rundown" },
      { to: "/reception", label: "Meja Tamu", icon: "reception" },
      { to: "/budget", label: "Anggaran", icon: "budget" },
      { to: "/gifts", label: "Kado & Angpao", icon: "gifts" },
      { to: "/guests", label: "Tamu", icon: "guests" },
      { to: "/vendors", label: "Vendor", icon: "vendors" },
      { to: "/administration", label: "Administrasi", icon: "administration" },
      { to: "/seserahan", label: "Seserahan", icon: "seserahan" },
      { to: "/gallery", label: "Galeri", icon: "gallery" },
      { to: "/settings", label: "Pengaturan", icon: "settings" },
    ];
  }, [isPanitia]);

  const bottomPrimary = useMemo(() => navItems.slice(0, 4), [navItems]);
  const bottomOverflow = useMemo(() => navItems.slice(4), [navItems]);

  const current = navItems.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)));

  const overflowActive = bottomOverflow.some((n) => location.pathname.startsWith(n.to));

  return (
    <div className="min-h-[100dvh] bg-canvas dark:bg-night text-ink dark:text-stone-100 flex">
      {/* ===================== Sidebar (desktop) ===================== */}
      <aside className="hidden lg:flex w-[16.5rem] shrink-0 flex-col border-r border-line dark:border-night-line bg-canvas-card dark:bg-night-card">
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 p-1.5 grid place-items-center shadow-glow shrink-0 border border-white/20">
            <img
              src={LOGO_URL}
              alt="Logo Wedding Rings"
              className="w-full h-full object-contain filter drop-shadow"
            />
          </div>
          <div className="min-w-0">
            <p className="font-display font-semibold truncate text-ink dark:text-stone-50">
              {coupleName}
            </p>
            <p className="text-[11px] text-ink-faint">17 Februari 2028</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto scroll-area">
          {navItems.map((item) => (
            <NavItem key={item.to} item={item} />
          ))}
        </nav>

        <div className="p-3 space-y-0.5 border-t border-line dark:border-night-line">
          <Link
            to="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-canvas-sunken dark:hover:bg-night-sunken transition-colors"
          >
            <Avatar name={user?.name || user?.email} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium truncate">
                {user?.name || "Pemilik"}
              </span>
              <span className="block text-[11px] text-ink-faint truncate">
                {isSuperuser ? "Super admin" : user?.email}
              </span>
            </span>
            <Pencil size={13} className="text-ink-faint" />
          </Link>

          <SidebarAction
            icon={<ThemeIcon size={17} />}
            label={isDark ? "Mode terang" : "Mode gelap"}
            onClick={toggleTheme}
          />
          <SidebarAction
            icon={<RefreshCw size={17} className={loading ? "animate-spin" : ""} />}
            label="Muat ulang data"
            onClick={reload}
            disabled={loading}
          />
          <div className="pt-1 pb-1">
            <PWAInstallButton className="w-full justify-center" />
          </div>
          <SidebarAction
            icon={<LogOut size={17} />}
            label="Keluar"
            onClick={logout}
            tone="danger"
          />
        </div>
      </aside>

      {/* ===================== Area konten ===================== */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header ringkas (seluler & tablet) */}
        <header className="lg:hidden sticky top-0 z-30 bg-canvas/85 dark:bg-night/85 backdrop-blur-xl border-b border-line dark:border-night-line">
          <div
            className="flex items-center gap-3 px-4 pb-3"
            style={{ paddingTop: "calc(var(--safe-top) + 0.75rem)" }}
          >
            <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 p-1.5 grid place-items-center shadow-glow shrink-0 border border-white/20">
              <img
                src={LOGO_URL}
                alt="Logo"
                className="w-full h-full object-contain filter drop-shadow"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[15px] font-semibold truncate leading-tight">
                {current?.label || coupleName}
              </p>
              <p className="text-[11px] text-ink-faint truncate">
                {current ? coupleName : "Wedding Planner"}
              </p>
            </div>
            <button
              onClick={toggleTheme}
              aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
              className="p-2 rounded-xl text-ink-muted hover:bg-canvas-sunken dark:hover:bg-night-sunken transition-colors focus-ring"
            >
              <ThemeIcon size={18} />
            </button>
            <Link
              to="/settings"
              aria-label="Pengaturan"
              className="shrink-0 rounded-full focus-ring"
            >
              <Avatar name={user?.name || user?.email} size="sm" />
            </Link>
          </div>
        </header>

        <main
          className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8"
          style={{ paddingBottom: "calc(var(--nav-height) + var(--safe-bottom) + 1.5rem)" }}
        >
          <Outlet />
        </main>

        <footer className="hidden lg:flex items-center justify-center gap-2 px-8 pb-6 text-center text-[11px] text-ink-faint">
          <img src={LOGO_URL} alt="Logo" className="w-4 h-4 object-contain inline-block opacity-75" />
          <span>
            Wedding Planner • Rizky &amp; Reina •{" "}
            {loading ? "menyinkronkan…" : isLiveConnected ? "⚡ sinkron live real-time" : "tersinkron dengan PocketBase"}
          </span>
        </footer>
      </div>

      {/* ===================== Bilah navigasi bawah ===================== */}
      <nav
        aria-label="Navigasi utama"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass"
        style={{ paddingBottom: "var(--safe-bottom)" }}
      >
        <div
          className="grid grid-cols-5 items-stretch px-1"
          style={{ height: "var(--nav-height)" }}
        >
          {bottomPrimary.map((item) => (
            <BottomNavItem key={item.to} item={item} />
          ))}

          <button
            onClick={() => setSheetOpen(true)}
            aria-label="Menu lainnya"
            className={`relative flex flex-col items-center justify-center gap-1 transition-colors focus-ring ${
              overflowActive ? "text-rose-600 dark:text-rose-300" : "text-ink-faint"
            }`}
          >
            <MoreHorizontal size={21} strokeWidth={1.9} />
            <span className="text-[10px] font-medium">Lainnya</span>
          </button>
        </div>
      </nav>

      {/* ===================== Lembar "Lainnya" ===================== */}
      <AnimatePresence>
        {sheetOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex items-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-ink/45 dark:bg-black/60 backdrop-blur-[2px]"
              onClick={() => setSheetOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(_, info) => {
                // Seret ke bawah lebih dari 100px atau flick cepat (velocity > 200) = tutup
                if (info.offset.y > 100 || info.velocity.y > 200) setSheetOpen(false);
              }}
              className="relative w-full bg-canvas-card dark:bg-night-card rounded-t-4xl border-t border-line dark:border-night-line shadow-lift"
              style={{ paddingBottom: "calc(var(--safe-bottom) + 1rem)" }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <span className="w-9 h-1 rounded-full bg-line-strong dark:bg-night-line" />
              </div>

              <div className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-rose-600 to-rose-700 p-1 shadow-glow grid place-items-center shrink-0 border border-white/20">
                    <img
                      src={LOGO_URL}
                      alt="Logo"
                      className="w-full h-full object-contain filter drop-shadow"
                    />
                  </div>
                  <p className="font-display font-semibold">Menu lainnya</p>
                </div>
                <button
                  onClick={() => setSheetOpen(false)}
                  aria-label="Tutup"
                  className="p-2 rounded-xl text-ink-muted hover:bg-canvas-sunken dark:hover:bg-night-sunken focus-ring"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-3 pb-2 grid grid-cols-1 gap-0.5">
                {bottomOverflow.map((item) => (
                  <SheetItem key={item.to} item={item} onNavigate={() => setSheetOpen(false)} />
                ))}
              </div>

              <div className="px-5 pt-3 mt-2 border-t border-line dark:border-night-line space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint pt-2">
                  Akun
                </p>
                <Link
                  to="/settings"
                  onClick={() => setSheetOpen(false)}
                  className="flex items-center gap-4 py-3 text-sm text-ink dark:text-stone-200"
                >
                  <Avatar name={user?.name || user?.email} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium truncate">
                      {user?.name || "Pemilik"}
                    </span>
                    <span className="block text-xs text-ink-faint truncate">
                      {user?.email}
                    </span>
                  </span>
                </Link>
                <SheetAction
                  icon={<ThemeIcon size={18} />}
                  label={isDark ? "Mode terang" : "Mode gelap"}
                  onClick={() => {
                    toggleTheme();
                    setSheetOpen(false);
                  }}
                />
                <SheetAction
                  icon={<RefreshCw size={18} />}
                  label="Muat ulang data"
                  disabled={loading}
                  onClick={async () => {
                    await reload();
                    setSheetOpen(false);
                  }}
                />
                <div className="pt-2 pb-1">
                  <PWAInstallButton className="w-full justify-center" />
                </div>
                <SheetAction
                  icon={<LogOut size={18} />}
                  label="Keluar"
                  tone="danger"
                  onClick={() => {
                    setSheetOpen(false);
                    logout();
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating 1-Klik Install Banner (muncul otomatis jika belum terpasang) */}
      <PWAInstallFloatingBanner />
    </div>
  );
}

/* ========================================================================== */

function NavItem({ item }) {
  const Icon = MODULE_ICONS[item.icon];
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13.5px] font-medium transition-colors ${
          isActive
            ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
            : "text-ink-muted hover:bg-canvas-sunken dark:hover:bg-night-sunken hover:text-ink dark:hover:text-stone-100"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {/* Penanda aktif: satu garis tipis, bukan blok warna penuh. */}
          {isActive && (
            <motion.span
              layoutId="sidebar-active"
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-rose-600"
            />
          )}
          <Icon size={18} strokeWidth={isActive ? 2.2 : 1.9} />
          <span className="truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

function BottomNavItem({ item }) {
  const Icon = MODULE_ICONS[item.icon];
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `relative flex flex-col items-center justify-center gap-1 transition-colors duration-150 ${
          isActive ? "text-rose-600 dark:text-rose-300" : "text-ink-faint"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <motion.span
            animate={{ scale: isActive ? 1.06 : 1, y: isActive ? -1 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="flex"
          >
            <Icon size={21} strokeWidth={isActive ? 2.3 : 1.9} />
          </motion.span>
          <span className="text-[10px] font-medium leading-none">{item.label}</span>
          {isActive && (
            <motion.span
              layoutId="bottom-active"
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className="absolute top-0 w-8 h-[2.5px] rounded-full bg-rose-600 dark:bg-rose-400"
            />
          )}
        </>
      )}
    </NavLink>
  );
}

function SheetItem({ item, onNavigate }) {
  const Icon = MODULE_ICONS[item.icon];
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-4 px-3 py-3 rounded-2xl text-sm font-medium transition-colors ${
          isActive
            ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
            : "text-ink dark:text-stone-200 hover:bg-canvas-sunken dark:hover:bg-night-sunken"
        }`
      }
    >
      <span className="p-2 rounded-xl bg-canvas-sunken dark:bg-night-sunken">
        <Icon size={18} strokeWidth={1.9} />
      </span>
      {item.label}
    </NavLink>
  );
}

function SheetAction({ icon, label, onClick, tone, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-4 px-3 py-3 rounded-2xl text-sm font-medium transition-colors disabled:opacity-50 ${
        tone === "danger"
          ? "text-rose-600 dark:text-rose-300 hover:bg-rose-500/10"
          : "text-ink dark:text-stone-200 hover:bg-canvas-sunken dark:hover:bg-night-sunken"
      }`}
    >
      <span className="p-2 rounded-xl bg-canvas-sunken dark:bg-night-sunken">{icon}</span>
      {label}
    </button>
  );
}

function SidebarAction({ icon, label, onClick, disabled, tone }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13px] font-medium transition-colors disabled:opacity-50 focus-ring ${
        tone === "danger"
          ? "text-rose-600 dark:text-rose-300 hover:bg-rose-500/10"
          : "text-ink-muted hover:bg-canvas-sunken dark:hover:bg-night-sunken hover:text-ink dark:hover:text-stone-100"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export { WEDDING_DATE };
