import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Wallet,
  FileCheck2,
  CalendarCheck,
  Users,
  Gift,
  Menu,
  X,
  Heart,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { useWedding } from "../lib/weddingData";
import { useAuth } from "../lib/auth";
import { initials } from "../lib/format";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/budget", label: "Sangjit & Budget", icon: Wallet },
  { to: "/administration", label: "Administrasi", icon: FileCheck2 },
  { to: "/vendors", label: "Vendor & Countdown", icon: CalendarCheck },
  { to: "/guests", label: "Daftar Tamu", icon: Users },
  { to: "/seserahan", label: "Seserahan", icon: Gift },
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const { couple, reload, loading } = useWedding();
  const { user, logout } = useAuth();

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  const coupleName =
    couple?.cpp_nickname && couple?.cpw_nickname
      ? `${couple.cpp_nickname} & ${couple.cpw_nickname}`
      : "Wedding Planner";

  const nav = (
    <nav className="flex flex-col gap-1 p-3">
      {NAV.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-white shadow-sm shadow-primary/30"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`
            }
          >
            <Icon size={19} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-darksurface">
        <div className="flex items-center gap-3 p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="w-10 h-10 rounded-2xl bg-primary text-white grid place-items-center font-bold">
            <Heart size={18} />
          </div>
          <div className="min-w-0">
            <p className="font-bold truncate">{coupleName}</p>
            <p className="text-xs text-gray-400">17 Februari 2028</p>
          </div>
        </div>
        {nav}
        <div className="mt-auto p-3 space-y-1">
          <div className="flex items-center gap-3 px-3.5 py-3 mb-1 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-bold shrink-0">
              {initials(user?.name || user?.email || "PB")}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{user?.name || "Pemilik"}</p>
              <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={toggleDark}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {dark ? "☀️" : "🌙"} Mode {dark ? "Terang" : "Gelap"}
          </button>
          <button
            onClick={reload}
            disabled={loading}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} /> Muat ulang data
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
          >
            <LogOut size={17} /> Keluar
          </button>
        </div>
      </aside>

      {/* Sidebar mobile */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            className="absolute left-0 top-0 h-full w-64 bg-white dark:bg-darksurface shadow-xl flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary text-white grid place-items-center">
                  <Heart size={18} />
                </div>
                <p className="font-bold">{coupleName}</p>
              </div>
              <button onClick={() => setOpen(false)}><X size={20} /></button>
            </div>
            {nav}
            <div className="mt-auto p-3">
              <button
                onClick={() => { setOpen(false); logout(); }}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
              >
                <LogOut size={17} /> Keluar
              </button>
            </div>
          </motion.aside>
        </div>
      )}

      {/* Konten */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between p-4 bg-white/80 dark:bg-darksurface/80 backdrop-blur border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
              <Menu size={20} />
            </button>
            <p className="font-bold">{coupleName}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-bold">
            {initials(coupleName.replace("&", ""))}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        <footer className="px-6 py-6 text-center text-xs text-gray-400">
          Wedding Planner • Rizky & Reina • {loading ? "memuat…" : "tersinkron PocketBase"}
        </footer>
      </div>
    </div>
  );
}
