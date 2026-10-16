import { useMemo, useState, useRef, memo } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon,
  ExternalLink,
  Plus,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  FolderOpen,
  Sparkles,
  RefreshCw,
  Upload,
} from "lucide-react";
import {
  Page,
  PageHeader,
  Card,
  Button,
  Badge,
  Loading,
  ErrorState,
  EmptyState,
  SectionTitle,
  Field,
} from "../components/ui";
import { useWedding } from "../lib/weddingData";
import pb from "../lib/pocketbase";
import { splitLinks, toDirectImageUrl, guessAltFromUrl, isDriveFolder } from "../lib/photos";

const EASE = [0.22, 1, 0.36, 1];

/**
 * Galeri prewedding.
 * Foto dapat ditambahkan dengan:
 *   - Unggah berkas foto langsung dari HP / laptop
 *   - Menempel tautan berkas Google Drive (…/file/d/<ID>/view)
 *   - Menempel tautan folder Google Drive (…/folders/<ID>)
 *   - URL gambar langsung (https://…/foto.jpg)
 */
export default function Gallery() {
  const { photos, gallerySummary, loading, error, reload, addLog } = useWedding();
  const [showForm, setShowForm] = useState(false);
  const [links, setLinks] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [preview, setPreview] = useState(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef(null);

  const reduce = useReducedMotion();

  const renderable = useMemo(() => photos.filter((p) => p.isRenderable), [photos]);
  const driveFolders = useMemo(
    () => (gallerySummary.driveLink && isDriveFolder(gallerySummary.driveLink) ? gallerySummary.driveLink : ""),
    [gallerySummary.driveLink]
  );

  if (loading) return <Loading label="Memuat galeri…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const handleFilesUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingFiles(true);
    setFormError("");

    let successCount = 0;
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("image", file);
        formData.append("alt", file.name.replace(/\.[^/.]+$/, ""));
        formData.append("sort_order", photos.length + successCount);
        if (photos.length === 0 && successCount === 0) {
          formData.append("is_cover", true);
        }

        await pb.collection("gallery_photos").create(formData);
        successCount++;
      }

      if (successCount > 0) {
        await addLog(`Mengunggah ${successCount} foto langsung ke galeri`, "document");
        await reload();
      }
    } catch (err) {
      console.error(err);
      setFormError(err?.response?.message || err?.message || "Gagal mengunggah foto langsung.");
    } finally {
      setUploadingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError("");

    const list = splitLinks(links);
    if (list.length === 0) {
      setFormError("Tempel minimal satu tautan foto.");
      return;
    }

    setBusy(true);
    try {
      // Simpan satu per satu agar satu tautan yang salah tidak menggagalkan
      // seluruh proses. Kesalahan dikumpulkan dan dilaporkan di akhir.
      let added = 0;
      const failed = [];

      for (const url of list) {
        const src = toDirectImageUrl(url);
        if (!src) {
          failed.push(url);
          continue;
        }
        await pb.collection("gallery_photos").create({
          source_url: url,
          alt: guessAltFromUrl(url),
          sort_order: photos.length + added,
        });
        added += 1;
      }

      if (added > 0) {
        await addLog(`Menambahkan ${added} foto prewedding ke galeri`, "document");
        await reload();
      }

      if (failed.length > 0) {
        setFormError(
          `${failed.length} tautan tidak dikenali: ${failed.slice(0, 2).join(", ")}${
            failed.length > 2 ? "…" : ""
          }`
        );
      } else {
        setLinks("");
        setShowForm(false);
      }
    } catch (err) {
      setFormError(err?.response?.message || err?.message || "Gagal menyimpan foto.");
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = async (photo) => {
    try {
      await pb.collection("gallery_photos").delete(photo.id);
      await addLog(`Menghapus satu foto prewedding dari galeri`, "document");
      await reload();
    } catch (err) {
      console.error(err);
    }
  };

  const makeCover = async (photo) => {
    try {
      // Hanya satu foto yang boleh menjadi sampul: bersihkan dulu yang lain.
      for (const p of photos) {
        if (p.is_cover && p.id !== photo.id) {
          await pb.collection("gallery_photos").update(p.id, { is_cover: false });
        }
      }
      await pb.collection("gallery_photos").update(photo.id, { is_cover: true });
      await reload();
    } catch (err) {
      console.error(err);
    }
  };

  const openPreview = (photo) => {
    const index = renderable.findIndex((p) => p.id === photo.id);
    setPreview(index >= 0 ? index : 0);
  };

  const stepPreview = (delta) => {
    setPreview((current) => {
      const next = (current + delta + renderable.length) % renderable.length;
      return next;
    });
  };

  const hasPhotos = photos.length > 0;

  return (
    <Page>
      <PageHeader
        eyebrow="Prewedding"
        title="Galeri foto"
        subtitle={
          gallerySummary.preweddingDone
            ? "Semua momen prewedding tersimpan di satu tempat."
            : "Belum ada sesi prewedding. Foto akan muncul di dasbor setelah ditambahkan."
        }
        icon={ImageIcon}
        action={
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFilesUpload}
            />
            <Button
              variant="outline"
              size="sm"
              icon={Upload}
              loading={uploadingFiles}
              onClick={() => fileInputRef.current?.click()}
              title="Unggah berkas foto langsung dari HP atau Laptop"
            >
              {uploadingFiles ? "Mengunggah..." : "Unggah Foto"}
            </Button>
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={reload}>
              Muat ulang
            </Button>
            <Button size="sm" icon={Plus} onClick={() => setShowForm((s) => !s)}>
              Tautan Drive
            </Button>
          </div>
        }
      />

      {/* Formulir tambah foto */}
      <AnimatePresence initial={false}>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="overflow-hidden"
          >
            <Card>
              <div className="flex items-center justify-between mb-2">
                <SectionTitle>Tambah Foto Prewedding</SectionTitle>
                <Badge tone="sky">Upload Langsung &amp; Drive</Badge>
              </div>

              {/* Pilihan 1: Unggah Berkas Langsung */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-sky-400/30 bg-sky-500/5 text-center mb-4">
                <div className="w-9 h-9 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 grid place-items-center mx-auto mb-2">
                  <Upload size={18} />
                </div>
                <p className="text-sm font-semibold text-ink dark:text-stone-100">
                  Unggah Berkas Foto Langsung
                </p>
                <p className="text-xs text-ink-faint mt-0.5 max-w-sm mx-auto">
                  Pilih foto dari HP atau komputer untuk disimpan langsung ke server aplikasi.
                </p>
                <Button
                  type="button"
                  size="sm"
                  icon={Upload}
                  loading={uploadingFiles}
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3"
                >
                  {uploadingFiles ? "Mengunggah..." : "Pilih Berkas Foto..."}
                </Button>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-line dark:border-night-line" />
                <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-ink-faint font-semibold">
                  atau tempel tautan Google Drive
                </span>
                <div className="flex-grow border-t border-line dark:border-night-line" />
              </div>

              <form onSubmit={submit} className="mt-2 space-y-4">
                <Field
                  label="Tautan foto atau folder Google Drive"
                  hint="Tempel beberapa tautan sekaligus — pisahkan dengan baris baru atau spasi."
                >
                  <textarea
                    rows={4}
                    value={links}
                    onChange={(e) => setLinks(e.target.value)}
                    placeholder={"https://drive.google.com/file/d/…/view\nhttps://drive.google.com/folders/…"}
                    className="field resize-none font-mono text-[12.5px]"
                  />
                </Field>

                {formError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400">{formError}</p>
                )}

                <div className="flex items-center gap-2">
                  <Button type="submit" size="sm" loading={busy} icon={Plus}>
                    Simpan tautan Drive
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowForm(false);
                      setFormError("");
                    }}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tautan folder Drive (bila ada) */}
      {driveFolders && (
        <Card className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="p-3 rounded-2xl bg-brass-400/16 text-brass-600 dark:text-brass-300 shrink-0">
            <FolderOpen size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Folder Google Drive</p>
            <p className="text-xs text-ink-muted truncate mt-0.5">{gallerySummary.driveLink}</p>
          </div>
          <a
            href={gallerySummary.driveLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-ink text-canvas dark:bg-stone-100 dark:text-night text-[13px] font-medium shrink-0 active:scale-[0.97] transition-transform"
          >
            Buka folder <ExternalLink size={14} />
          </a>
        </Card>
      )}

      {/* Kisi foto */}
      {!hasPhotos ? (
        <Card>
          <EmptyState
            icon={ImageIcon}
            message="Galeri masih kosong."
            hint="Unggah berkas foto prewedding langsung dari HP/Laptop atau tempel tautan dari Google Drive."
            action={
              <div className="flex items-center gap-2 mt-2">
                <Button
                  size="sm"
                  icon={Upload}
                  loading={uploadingFiles}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Unggah Foto
                </Button>
                <Button variant="outline" size="sm" icon={Plus} onClick={() => setShowForm(true)}>
                  Tautan Drive
                </Button>
              </div>
            }
          />
        </Card>
      ) : (
        <Card>
          <SectionTitle count={`${photos.length} foto`}>
            {gallerySummary.title || "Momen prewedding"}
          </SectionTitle>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
            {photos.map((photo, index) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                index={index}
                reduce={reduce}
                onOpen={() => openPreview(photo)}
                onRemove={() => removePhoto(photo)}
                onCover={() => makeCover(photo)}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Penampil layar penuh */}
      <AnimatePresence>
        {preview !== null && renderable[preview] && (
          <Lightbox
            photo={renderable[preview]}
            total={renderable.length}
            index={preview}
            onClose={() => setPreview(null)}
            onPrev={() => stepPreview(-1)}
            onNext={() => stepPreview(1)}
          />
        )}
      </AnimatePresence>
    </Page>
  );
}

/* ========================================================================== */

const PhotoCard = memo(function PhotoCard({ photo, index, reduce, onOpen, onRemove, onCover }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.3, ease: EASE }}
      className="relative group aspect-[4/5] rounded-2xl overflow-hidden bg-canvas-sunken dark:bg-night-sunken contain-paint cv-card"
    >
      {photo.isRenderable ? (
        <button onClick={onOpen} className="absolute inset-0 w-full h-full focus-ring">
          <img
            src={photo.src}
            alt={photo.alt}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-glide group-hover:scale-[1.05]"
          />
        </button>
      ) : (
        <a
          href={photo.openUrl || photo.source_url}
          target="_blank"
          rel="noreferrer"
          className="absolute inset-0 grid place-items-center text-center p-3"
        >
          <span className="text-xs text-ink-muted flex flex-col items-center gap-2">
            <FolderOpen size={20} />
            Buka di Drive
          </span>
        </a>
      )}

      {photo.is_cover && (
        <Badge tone="amber" className="absolute top-2 left-2 !bg-brass-400/90 !text-white">
          <Sparkles size={10} /> Sampul
        </Badge>
      )}

      {/* Kendali muncul saat hover / fokus di perangkat berkemampuan hover saja */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Opsi foto"
          className="p-1.5 rounded-lg bg-ink/60 text-white backdrop-blur-sm"
        >
          <Star size={13} />
        </button>
        <button
          onClick={onRemove}
          aria-label="Hapus foto"
          className="p-1.5 rounded-lg bg-ink/60 text-white backdrop-blur-sm hover:bg-rose-600"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {menuOpen && (
        <div className="absolute top-10 right-2 z-10 rounded-xl bg-canvas-card dark:bg-night-card border border-line dark:border-night-line shadow-lift p-1 text-xs">
          <button
            onClick={() => {
              onCover();
              setMenuOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-canvas-sunken dark:hover:bg-night-sunken whitespace-nowrap"
          >
            <Sparkles size={12} /> Jadikan sampul
          </button>
        </div>
      )}
    </motion.div>
  );
});

function Lightbox({ photo, total, index, onClose, onPrev, onNext }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] bg-ink/95 dark:bg-black/95 backdrop-blur-sm flex flex-col"
      onClick={onClose}
    >
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 text-white"
        style={{ paddingTop: "calc(var(--safe-top) + 0.75rem)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-medium truncate">
          {photo.alt}
          <span className="text-white/50 ml-2 tabular-nums">
            {index + 1}/{total}
          </span>
        </p>
        <div className="flex items-center gap-2">
          <a
            href={photo.openUrl || photo.source_url}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Buka di Drive"
          >
            <ExternalLink size={18} />
          </a>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative flex items-center justify-center px-2">
        {total > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            aria-label="Foto sebelumnya"
            className="absolute left-2 sm:left-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        <AnimatePresence mode="wait">
          <motion.img
            key={photo.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.2, ease: EASE }}
            src={photo.fullSrc || photo.src}
            alt={photo.alt}
            decoding="async"
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full object-contain rounded-xl"
          />
        </AnimatePresence>

        {total > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            aria-label="Foto berikutnya"
            className="absolute right-2 sm:right-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      <div style={{ paddingBottom: "calc(var(--safe-bottom) + 1rem)" }} />
    </motion.div>
  );
}
