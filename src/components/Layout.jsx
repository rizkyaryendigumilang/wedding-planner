import { useEffect, useState, useMemo, useRef } from "react";
import { Link, NavLink, useLocation, useOutlet } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { RefreshCw, LogOut, MoreHorizontal, X, Pencil, AlertTriangle, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { useWedding } from "../lib/weddingData";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import { MODULE_ICONS, UI_ICONS, LOGO_URL } from "../lib/icons";
import { Avatar } from "./Avatar";
import { getCoupleDisplayName } from "../lib/couple";
import { EASE_EXPO_OUT, EASE_POWER_IN } from "../lib/motion";

const WEDDING_DATE = "2028-02-17";

export default function Layout() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { couple, reload, loading, isLiveConnected } = useWedding();
  const { user, logout, isSuperuser, isPanitia, isDemo, demoDaysLeft } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();
  const location = useLocation();

  const ThemeIcon = isDark ? UI_ICONS.light : UI_ICONS.dark;

  const coupleDisplayName = useMemo(
    () => getCoupleDisplayName(couple, user),
    [couple, user]
  );
  const coupleName = coupleDisplayName;

  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" && typeof navigator.onLine === "boolean"
      ? navigator.onLine
      : true
  );

  // REC-03: Deteksi status jaringan & notifikasi offline
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Koneksi pulih — Sinkronisasi langsung aktif kembali.");
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Koneksi terputus — Mode offline aktif (data tersimpan di perangkat).");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // REC-05: Shortcut keyboard global (Escape untuk menutup menu lembar bawah)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSheetOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Judul tab browser mengikuti nama CPP & CPW akun aktif secara otomatis.
  useEffect(() => {
    document.title =
      coupleDisplayName && coupleDisplayName !== "Wedding Planner"
        ? `Wedding Planner — ${coupleDisplayName}`
        : "Wedding Planner";
  }, [coupleDisplayName]);

  const navItems = useMemo(() => {
    if (isPanitia) {
      return [
        { to: "/", label: "Dashboard", icon: "dashboard", end: true },
        { to: "/rundown", label: "Itinerary", icon: "rundown" },
        { to: "/reception", label: "Meja Tamu", icon: "reception" },
        { to: "/guests", label: "Tamu", icon: "guests" },
        { to: "/vendors", label: "Vendor", icon: "vendors" },
        { to: "/gallery", label: "Galeri", icon: "gallery" },
        { to: "/settings", label: "Pengaturan", icon: "settings" },
      ];
    }
    return [
      { to: "/", label: "Dashboard", icon: "dashboard", end: true },
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

  const reduce = useReducedMotion();
  const outlet = useOutlet();

  // REC-06: Direction-Aware Navigation Index Tracking (Sorvo Motion Architecture)
  const prevPathRef = useRef(location.pathname);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (location.pathname !== prevPathRef.current) {
      const getIndex = (path) => {
        const idx = navItems.findIndex((n) => (n.end ? path === n.to : path.startsWith(n.to)));
        return idx === -1 ? 999 : idx;
      };
      const prevIndex = getIndex(prevPathRef.current);
      const currentIndex = getIndex(location.pathname);
      setDirection(currentIndex >= prevIndex ? 1 : -1);
      prevPathRef.current = location.pathname;
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [location.pathname, navItems]);

  const pageVariants = useMemo(
    () => ({
      enter: (dir) =>
        reduce
          ? { opacity: 1, x: 0, scale: 1 }
          : {
              opacity: 0,
              x: dir > 0 ? 24 : -24,
              scale: 0.985,
            },
      center: {
        opacity: 1,
        x: 0,
        scale: 1,
        transition: {
          duration: reduce ? 0 : 0.45,
          ease: EASE_EXPO_OUT,
        },
      },
      exit: (dir) =>
        reduce
          ? { opacity: 0 }
          : {
              opacity: 0,
              x: dir > 0 ? -16 : 16,
              scale: 0.985,
              transition: {
                duration: 0.18,
                ease: EASE_POWER_IN,
              },
            },
    }),
    [reduce]
  );

  return (
    <div className="min-h-[100dvh] bg-canvas dark:bg-night text-ink dark:text-stone-100 flex flex-col lg:flex-row">
      {/* Aksesibilitas: Lewati langsung ke konten utama */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:rounded-2xl focus:bg-rose-600 focus:text-white focus:font-semibold focus:text-xs focus:shadow-lift focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition"
      >
        Lewati ke konten utama
      </a>

      {/* Banner status offline (REC-03) */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            role="status"
            aria-live="polite"
            className="w-full bg-amber-500 dark:bg-amber-600 text-stone-900 font-medium text-xs px-4 py-2 flex items-center justify-center gap-2 text-center sticky top-0 z-50 shadow-sm"
          >
            <WifiOff size={14} className="shrink-0" />
            <span>Mode Offline: Tidak terhubung ke internet. Data tetap aman dan disimpan di perangkat.</span>
          </motion.div>
        )}
      </AnimatePresence>

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

        {isDemo && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 sm:mt-6 rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 flex items-center gap-3 text-sm">
            <AlertTriangle size={16} className="shrink-0 text-amber-600 dark:text-amber-300" />
            <p className="flex-1 text-amber-800 dark:text-amber-200">
              <span className="font-semibold">Akun Demo</span> — data contoh, kadaluarsa dalam{" "}
              <span className="font-semibold">{demoDaysLeft ?? 0} hari</span>. Daftar akun sendiri
              untuk data pribadi.
            </p>
          </div>
        )}

        <main
          id="main-content"
          tabIndex="-1"
          className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8 focus:outline-none overflow-x-hidden"
          style={{ paddingBottom: "calc(var(--nav-height) + var(--safe-bottom) + 1.5rem)" }}
        >
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={location.pathname}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full flex-1"
            >
              {outlet}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="hidden lg:flex items-center justify-center gap-2 px-8 pb-6 text-center text-[11px] text-ink-faint">
          <img src={LOGO_URL} alt="Logo" className="w-4 h-4 object-contain inline-block opacity-75" />
          <span>
            Wedding Planner
            {coupleDisplayName && coupleDisplayName !== "Wedding Planner" ? ` • ${coupleDisplayName}` : ""}{" "}
            • {loading ? "menyinkronkan…" : isLiveConnected ? "tersinkron langsung" : "tersimpan di server"}
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
              transition={{ duration: 0.24, ease: EASE_EXPO_OUT }}
              className="absolute inset-0 bg-ink/50 dark:bg-black/70 backdrop-blur-sm"
              onClick={() => setSheetOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.08, bottom: 0.5 }}
              onDragEnd={(_, info) => {
                // Seret ke bawah lebih dari 80px atau flick cepat (velocity > 250) = tutup
                if (info.offset.y > 80 || info.velocity.y > 250) setSheetOpen(false);
              }}
              className="relative w-full max-h-[88dvh] flex flex-col bg-canvas-card dark:bg-night-card rounded-t-4xl border-t border-line dark:border-night-line shadow-lift overscroll-contain glass-specular"
              style={{ paddingBottom: "calc(var(--safe-bottom) + 1rem)" }}
            >
              <div className="flex justify-center pt-3 pb-2.5 cursor-grab active:cursor-grabbing touch-none select-none shrink-0">
                <span className="w-10 h-1.5 rounded-full bg-line-strong/70 dark:bg-night-line" />
              </div>

              <div className="overflow-y-auto flex-1 scroll-area px-1">
                <div className="flex items-center justify-between px-4 py-3">
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

                <div className="px-2 pb-2 grid grid-cols-1 gap-0.5">
                  {bottomOverflow.map((item) => (
                    <SheetItem key={item.to} item={item} onNavigate={() => setSheetOpen(false)} />
                  ))}
                </div>

                <div className="px-4 pt-3 mt-2 border-t border-line dark:border-night-line space-y-1">
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
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
            ? "text-rose-700 dark:text-rose-300 font-semibold"
            : "text-ink-muted hover:bg-canvas-sunken/60 dark:hover:bg-night-sunken/60 hover:text-ink dark:hover:text-stone-100"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {/* Elastic Stretchy Sliding Pill (Sorvo technique) */}
          {isActive && (
            <>
              <motion.span
                layoutId="sidebar-active-pill"
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 30, // sedikit melar elastis sebelum mengunci sempurna
                }}
                className="absolute inset-0 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 pointer-events-none"
              />
              <motion.span
                layoutId="sidebar-active-bar"
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 32,
                }}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3.5px] h-5 rounded-full bg-rose-600 dark:bg-rose-400 pointer-events-none"
              />
            </>
          )}
          <span className="relative z-10 flex items-center gap-3 min-w-0">
            <Icon size={18} strokeWidth={isActive ? 2.2 : 1.9} className="shrink-0" />
            <span className="truncate">{item.label}</span>
          </span>
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
          {isActive && (
            <motion.span
              layoutId="bottom-active"
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="absolute top-0 w-8 h-[2.5px] rounded-full bg-rose-600 dark:bg-rose-400"
            />
          )}
          <motion.span
            animate={{ scale: isActive ? 1.08 : 1, y: isActive ? -1 : 0 }}
            transition={{ type: "spring", stiffness: 450, damping: 28 }}
            className="flex"
          >
            <Icon size={21} strokeWidth={isActive ? 2.3 : 1.9} />
          </motion.span>
          <span className="text-[10px] font-medium leading-none">{item.label}</span>
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
