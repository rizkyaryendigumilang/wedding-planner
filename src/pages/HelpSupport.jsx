import { useState, useMemo } from "react";
import {
  LifeBuoy,
  Search,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Send,
  Star,
  Shield,
  HelpCircle,
} from "lucide-react";
import {
  Page,
  PageHeader,
  Card,
  SectionTitle,
  Button,
  Field,
} from "../components/ui";
import HelpdeskModal from "../components/HelpdeskModal";
import { laporkanKendalaKeHelpdesk } from "../lib/helpdesk";
import { toast } from "sonner";
import { triggerHaptic } from "../lib/haptic";

const FAQS = [
  {
    category: "Tamu & Undangan",
    q: "Bagaimana cara membagikan undangan pernikahan via WhatsApp otomatis?",
    a: "Buka menu Tamu, klik tombol opsi pada nama tamu, lalu pilih 'Kirim Undangan WhatsApp'. Sistem akan otomatis membuka WhatsApp dengan pesan personalisasi yang menyertakan nama tamu dan tautan konfirmasi RSVP.",
  },
  {
    category: "Tamu & Undangan",
    q: "Bagaimana cara mengimpor daftar tamu dari file Excel / CSV?",
    a: "Di menu Tamu, klik tombol 'Impor CSV'. Anda dapat mengunggah file CSV dengan kolom Nama, Pihak (CPP/CPW), Kategori, dan Nomor Meja. Sistem akan otomatis memasukkannya ke database dalam sekali klik.",
  },
  {
    category: "Keuangan & Anggaran",
    q: "Apakah data anggaran dan kado amplop saya bisa dilihat oleh panitia keluarga?",
    a: "Tidak. Secara default sistem menerapkan pembatasan hak akses (RBAC). Data Anggaran, Arus Kas, dan Hadiah/Amplop hanya dapat diakses oleh Pemilik (Owner) dan Pasangan Mempelai. Akun dengan peran 'Panitia' atau 'WO' otomatis tidak dapat melihat modul finansial ini.",
  },
  {
    category: "Resepsi Hari-H",
    q: "Bagaimana cara tim penerima tamu mencatat kehadiran di Meja Tamu?",
    a: "Gunakan menu Meja Tamu (Reception). Tim penerima tamu cukup mengetikkan 2-3 huruf nama tamu pada kotak pencarian cepat, lalu klik tombol 'Check-in' dan tandai apakah souvenir sudah diberikan atau belum.",
  },
  {
    category: "Sistem & Offline",
    q: "Apakah aplikasi tetap dapat digunakan jika internet di gedung resepsi terputus?",
    a: "Ya! Wedding Planner didukung teknologi PWA (Progressive Web App) dengan offline cache. Data yang sudah dibuka sebelumnya tetap dapat diakses di perangkat ponsel Anda, dan akan tersinkronisasi otomatis begitu internet kembali terhubung.",
  },
  {
    category: "Akun & Keamanan",
    q: "Bagaimana cara mengundang pasangan atau keluarga untuk ikut mengelola?",
    a: "Buka menu Pengguna & Tim (User Management), lalu klik 'Tambah Anggota Tim'. Anda dapat memilih peran (Pasangan, Panitia, atau Wedding Organizer) dan sistem akan menghasilkan username serta password sementara yang siap dikirim via WhatsApp.",
  },
];

export default function HelpSupport() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [expandedFaqIndex, setExpandedFaqIndex] = useState(null);
  const [isHelpdeskOpen, setIsHelpdeskOpen] = useState(false);

  // State Formulir Masukan (Feedback)
  const [rating, setRating] = useState(5);
  const [feedbackCategory, setFeedbackCategory] = useState("Ide Fitur Baru");
  const [feedbackText, setFeedbackText] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const categories = ["ALL", "Tamu & Undangan", "Keuangan & Anggaran", "Resepsi Hari-H", "Sistem & Offline", "Akun & Keamanan"];

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return FAQS.filter((item) => {
      if (selectedCategory !== "ALL" && item.category !== selectedCategory) {
        return false;
      }
      if (q) {
        return (
          item.q.toLowerCase().includes(q) ||
          item.a.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [searchQuery, selectedCategory]);

  const handleToggleFaq = (idx) => {
    triggerHaptic("selection");
    setExpandedFaqIndex(expandedFaqIndex === idx ? null : idx);
  };

  const handleSubmitFeedback = (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      toast.error("Mohon isi saran atau masukan Anda.");
      return;
    }

    setSubmittingFeedback(true);
    setTimeout(() => {
      toast.success("Terima kasih! Masukan Anda sangat berharga untuk pengembangan Wedding Planner.");
      setFeedbackText("");
      setSubmittingFeedback(false);
    }, 600);
  };

  return (
    <Page>
      <PageHeader
        title="Bantuan & Dukungan"
        subtitle="Temukan jawaban cepat, panduan penggunaan aplikasi, laporkan kendala ke helpdesk, atau kirim masukan"
        icon={LifeBuoy}
        action={
          <Button
            variant="primary"
            icon={MessageSquare}
            onClick={() => setIsHelpdeskOpen(true)}
          >
            Laporkan Kendala
          </Button>
        }
      />

      {/* Hero Bantuan & Pencarian Cepat */}
      <Card className="p-6 bg-gradient-to-br from-rose-500/10 via-canvas-card to-canvas-card dark:from-rose-950/20 dark:via-night-card dark:to-night-card border-rose-200/60 dark:border-rose-900/40 space-y-4">
        <div>
          <h2 className="font-display font-semibold text-xl text-ink dark:text-stone-100">
            Ada yang bisa kami bantu?
          </h2>
          <p className="text-xs text-ink-muted mt-1 max-w-xl">
            Cari pertanyaan atau kata kunci panduan seputar undangan, katering, susunan acara, hingga check-in resepsi.
          </p>
        </div>

        <div className="relative max-w-xl">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder="Ketik topik bantuan, misal: 'WhatsApp', 'Check-in', 'Offline'…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-night-card border border-line dark:border-night-line text-sm text-ink dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
          />
        </div>

        {/* Filter Kategori */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                triggerHaptic("selection");
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-canvas-sunken dark:bg-night-sunken text-ink-muted hover:text-ink"
              }`}
            >
              {cat === "ALL" ? "Semua Kategori" : cat}
            </button>
          ))}
        </div>
      </Card>

      {/* Accordion FAQ (Basis Pengetahuan) */}
      <Card className="space-y-4">
        <SectionTitle
          title={`Pertanyaan Umum (${filteredFaqs.length})`}
          subtitle="Jawaban terperinci untuk pertanyaan yang sering diajukan calon pengantin"
        />

        <div className="divide-y divide-line dark:divide-night-line">
          {filteredFaqs.length === 0 ? (
            <div className="py-8 text-center text-xs text-ink-muted">
              Tidak ditemukan jawaban yang cocok dengan pencarian Anda.
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isExpanded = expandedFaqIndex === idx;

              return (
                <div key={idx} className="py-3.5">
                  <button
                    type="button"
                    onClick={() => handleToggleFaq(idx)}
                    className="w-full flex items-center justify-between gap-4 text-left group"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <HelpCircle size={18} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 block mb-0.5">
                          {faq.category}
                        </span>
                        <h4 className="font-semibold text-sm text-ink dark:text-stone-100 group-hover:text-rose-600 transition">
                          {faq.q}
                        </h4>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp size={18} className="text-ink-muted shrink-0" />
                    ) : (
                      <ChevronDown size={18} className="text-ink-muted shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="mt-2.5 ml-7 text-xs text-ink-muted dark:text-stone-300 leading-relaxed pr-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Kartu Bantuan Darurat & Form Umpan Balik */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hubungi Tim Dukungan */}
        <Card className="space-y-4">
          <SectionTitle
            title="Pusat Bantuan & Helpdesk"
            subtitle="Perlu bantuan teknis khusus atau ingin melaporkan kendala pada sistem?"
          />

          <div className="p-4 rounded-2xl bg-canvas-sunken dark:bg-night-sunken border border-line dark:border-night-line text-xs space-y-2">
            <p className="font-semibold text-ink dark:text-stone-100 flex items-center gap-1.5">
              <Shield size={16} className="text-rose-600" />
              Sistem Tiket Terintegrasi
            </p>
            <p className="text-ink-muted leading-relaxed">
              Setiap laporan kendala otomatis dikirim ke server helpdesk terpusat beserta detail sesi dan URL halaman Anda, sehingga tim teknis dapat menyelesaikan masalah secara cepat.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <Button
              variant="primary"
              icon={LifeBuoy}
              onClick={() => setIsHelpdeskOpen(true)}
            >
              Kirim Tiket ke Helpdesk
            </Button>
            <Button
              variant="neutral"
              icon={Send}
              onClick={() => {
                laporkanKendalaKeHelpdesk({
                  subject: "Pertanyaan Umum dari Help Center",
                  description: "Pengguna ingin konsultasi teknis melalui Help Center",
                  category: "pertanyaan_fitur",
                });
              }}
            >
              Buka Portal Helpdesk Handoff
            </Button>
          </div>
        </Card>

        {/* Formulir Saran & Feedback */}
        <Card className="space-y-4">
          <SectionTitle
            title="Kirim Masukan & Ulasan"
            subtitle="Bantu kami membuat Wedding Planner semakin ramah bagi calon pengantin"
          />

          <form onSubmit={handleSubmitFeedback} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-ink dark:text-stone-200 mb-1.5">
                Rating Kepuasan Penggunaan:
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition"
                  >
                    <Star
                      size={20}
                      fill={star <= rating ? "currentColor" : "none"}
                    />
                  </button>
                ))}
              </div>
            </div>

            <Field label="Kategori Masukan">
              <select
                value={feedbackCategory}
                onChange={(e) => setFeedbackCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-canvas-sunken dark:bg-night-sunken border border-line dark:border-night-line text-xs text-ink dark:text-stone-200 focus:outline-none"
              >
                <option value="Ide Fitur Baru">Ide Fitur Baru</option>
                <option value="Masukan Tampilan (UI/UX)">Masukan Tampilan (UI/UX)</option>
                <option value="Kemudahan Penggunaan">Kemudahan Penggunaan</option>
                <option value="Pujian & Apresiasi">Pujian & Apresiasi</option>
              </select>
            </Field>

            <Field label="Saran & Masukan Anda">
              <textarea
                rows={3}
                placeholder="Ceritakan fitur apa yang Anda harapkan atau hal yang perlu ditingkatkan…"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-canvas-sunken dark:bg-night-sunken border border-line dark:border-night-line text-xs text-ink dark:text-stone-200 focus:outline-none resize-none"
              />
            </Field>

            <Button
              type="submit"
              variant="neutral"
              size="sm"
              loading={submittingFeedback}
            >
              Kirim Masukan
            </Button>
          </form>
        </Card>
      </div>

      {/* Modal Lapor Helpdesk */}
      <HelpdeskModal
        isOpen={isHelpdeskOpen}
        onClose={() => setIsHelpdeskOpen(false)}
      />
    </Page>
  );
}
