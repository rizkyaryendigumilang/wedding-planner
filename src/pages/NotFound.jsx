import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Page, Card, Button } from "../components/ui";

export default function NotFound() {
  const reduce = useReducedMotion();

  return (
    <Page>
      <Card className="text-center py-16">
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="flex justify-center mb-5"
        >
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-rose-600 to-rose-700 p-2.5 shadow-glow grid place-items-center shrink-0 border border-white/20">
            <img
              src="/logo-transparent.png"
              alt="Logo Wedding Rings"
              className="w-full h-full object-contain filter drop-shadow"
            />
          </div>
        </motion.div>

        <h1 className="font-display text-2xl font-semibold">Halaman tidak ditemukan</h1>
        <p className="text-sm text-ink-muted mt-2">
          Menu yang Anda tuju belum tersedia atau sudah dipindahkan.
        </p>

        <Link to="/" className="inline-block mt-6">
          <Button icon={ArrowLeft}>Kembali ke dasbor</Button>
        </Link>
      </Card>
    </Page>
  );
}
