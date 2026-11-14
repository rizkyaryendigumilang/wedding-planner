import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Home, Clock, Users, Wallet } from "lucide-react";
import { Page, Card, Button } from "../components/ui";
import { LOGO_URL } from "../lib/icons";

export default function NotFound() {
  const reduce = useReducedMotion();
  const navigate = useNavigate();

  return (
    <Page>
      <Card className="text-center py-12 sm:py-16 max-w-lg mx-auto shadow-lift border-line dark:border-night-line">
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="flex justify-center mb-5"
        >
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-rose-600 to-rose-700 p-2.5 shadow-glow grid place-items-center shrink-0 border border-white/20">
            <img
              src={LOGO_URL}
              alt="Logo Wedding Rings"
              className="w-full h-full object-contain filter drop-shadow"
            />
          </div>
        </motion.div>

        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block mb-1">
          Galat 404 • Tidak Ditemukan
        </span>
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-stone-50">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted mt-2 max-w-sm mx-auto leading-relaxed">
          Tautan yang Anda tuju mungkin sudah dipindahkan atau salah ketik. Silakan pilih menu utama di bawah ini:
        </p>

        {/* Pintasan Cepat */}
        <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto my-6 text-left">
          <Link
            to="/"
            className="p-3 rounded-2xl bg-canvas-sunken dark:bg-night-sunken hover:bg-rose-500/10 transition flex items-center gap-2 text-xs font-semibold text-ink dark:text-stone-200"
          >
            <Home size={16} className="text-rose-600" />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/rundown"
            className="p-3 rounded-2xl bg-canvas-sunken dark:bg-night-sunken hover:bg-rose-500/10 transition flex items-center gap-2 text-xs font-semibold text-ink dark:text-stone-200"
          >
            <Clock size={16} className="text-rose-600" />
            <span>Itinerary</span>
          </Link>
          <Link
            to="/guests"
            className="p-3 rounded-2xl bg-canvas-sunken dark:bg-night-sunken hover:bg-rose-500/10 transition flex items-center gap-2 text-xs font-semibold text-ink dark:text-stone-200"
          >
            <Users size={16} className="text-rose-600" />
            <span>Daftar Tamu</span>
          </Link>
          <Link
            to="/budget"
            className="p-3 rounded-2xl bg-canvas-sunken dark:bg-night-sunken hover:bg-rose-500/10 transition flex items-center gap-2 text-xs font-semibold text-ink dark:text-stone-200"
          >
            <Wallet size={16} className="text-rose-600" />
            <span>Anggaran</span>
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Button variant="neutral" size="sm" icon={ArrowLeft} onClick={() => navigate(-1)}>
            Kembali
          </Button>
          <Button as={Link} to="/" variant="primary" size="sm" icon={Home}>
            Ke Beranda
          </Button>
        </div>
      </Card>
    </Page>
  );
}
