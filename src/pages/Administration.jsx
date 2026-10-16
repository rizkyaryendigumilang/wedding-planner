import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  FileCheck2,
  Check,
  Search,
  ShieldCheck,
  ClipboardList,
  Users,
} from "lucide-react";
import {
  Page,
  PageHeader,
  Card,
  StatCard,
  ProgressBar,
  Loading,
  ErrorState,
  Badge,
  EmptyState,
  SectionTitle,
  Input,
} from "../components/ui";
import { useWedding } from "../lib/weddingData";
import pb from "../lib/pocketbase";
import { pct } from "../lib/format";

const EASE = [0.22, 1, 0.36, 1];

export default function Administration() {
  const { administrations, adminSummary, loading, error, reload, addLog } = useWedding();
  const [query, setQuery] = useState("");
  const reduce = useReducedMotion();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? administrations.filter(
          (a) => a.item.toLowerCase().includes(q) || a.section.toLowerCase().includes(q)
        )
      : administrations;
  }, [administrations, query]);

  const sections = useMemo(() => {
    const map = new Map();
    for (const a of filtered) {
      if (!map.has(a.section)) map.set(a.section, []);
      map.get(a.section).push(a);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const toggleDoc = async (item, side) => {
    const field = side === "CPP" ? "cpp_complete" : "cpw_complete";
    await pb.collection("administrations").update(item.id, { [field]: !item[field] });
    await addLog(
      `Dokumen "${item.item}" (${side}) ditandai ${!item[field] ? "selesai" : "belum"}`,
      "document"
    );
    reload();
  };

  const toggleProgress = async (item) => {
    const next = item.progress === "Sudah" ? "Belum" : "Sudah";
    await pb.collection("administrations").update(item.id, { progress: next });
    await addLog(`"${item.item}" ditandai ${next}`, "document");
    reload();
  };

  if (loading) return <Loading label="Memuat administrasi…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const docPct = pct(adminSummary.docsDone, adminSummary.docsTotal || 1);

  return (
    <Page>
      <PageHeader
        eyebrow="Kelengkapan"
        title="Administrasi & dokumen"
        subtitle="Berkas legal CPP dan CPW, plus daftar periksa persiapan pernikahan."
        icon={FileCheck2}
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total item"
          value={adminSummary.total}
          sub={`${adminSummary.done} selesai`}
          icon={ClipboardList}
          tone="neutral"
          delay={0}
        />
        <StatCard
          label="Selesai"
          value={`${pct(adminSummary.done, adminSummary.total || 1).toFixed(0)}%`}
          sub="dari keseluruhan"
          icon={ShieldCheck}
          tone="sage"
          delay={0.05}
        />
        <StatCard
          label="Dokumen legal"
          value={`${adminSummary.docsDone}/${adminSummary.docsTotal}`}
          sub="CPP & CPW lengkap"
          icon={FileCheck2}
          tone="sky"
          delay={0.1}
        />
        <StatCard
          label="Daftar periksa"
          value={`${adminSummary.progressDone}/${adminSummary.progressTotal}`}
          sub="item non-dokumen"
          icon={Users}
          tone="amber"
          delay={0.15}
        />
      </section>

      <Card>
        <SectionTitle
          action={
            <Badge tone={docPct === 100 ? "sage" : "plum"}>
              {docPct.toFixed(0)}%
            </Badge>
          }
        >
          Progres kelengkapan berkas
        </SectionTitle>
        <div className="mt-4">
          <ProgressBar value={docPct} tone="bg-sky-500" height="h-2.5" />
        </div>
        <p className="text-xs text-ink-muted mt-3">
          {adminSummary.docsDone} dari {adminSummary.docsTotal} dokumen sudah lengkap di kedua pihak.
        </p>
      </Card>

      <div className="relative">
        <Search
          size={17}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari dokumen atau item persiapan…"
          className="!pl-11"
          aria-label="Cari administrasi"
        />
      </div>

      {sections.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileCheck2}
            message="Tidak ada item yang cocok."
            hint="Coba kata kunci lain atau hapus isi kolom pencarian."
          />
        </Card>
      ) : (
        sections.map(([section, items], sectionIndex) => {
          const done = items.filter(
            (i) => (i.is_document && i.cpp_complete && i.cpw_complete) || i.progress === "Sudah"
          ).length;
          const sectionPct = pct(done, items.length);

          return (
            <motion.div
              key={section}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: Math.min(sectionIndex * 0.04, 0.24),
                duration: 0.35,
                ease: EASE,
              }}
            >
              <Card>
                <SectionTitle
                  count={`${done}/${items.length}`}
                  action={
                    <div className="w-24 sm:w-36">
                      <ProgressBar value={sectionPct} height="h-1.5" />
                    </div>
                  }
                >
                  {section}
                </SectionTitle>

                <ul className="mt-4 -mx-2 divide-y divide-line/70 dark:divide-night-line/70">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center gap-3 px-2 py-3 rounded-2xl hover:bg-canvas-sunken/50 dark:hover:bg-night-sunken/50 transition-colors"
                    >
                      <span className="flex-1 min-w-[12rem] text-sm">{item.item}</span>

                      {item.details && (
                        <span className="hidden md:block text-xs text-ink-faint max-w-[16rem] truncate">
                          {item.details}
                        </span>
                      )}

                      {item.is_document ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <SideToggle
                            label="CPP"
                            done={Boolean(item.cpp_complete)}
                            onClick={() => toggleDoc(item, "CPP")}
                          />
                          <SideToggle
                            label="CPW"
                            done={Boolean(item.cpw_complete)}
                            onClick={() => toggleDoc(item, "CPW")}
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => toggleProgress(item)}
                          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors focus-ring ${
                            item.progress === "Sudah"
                              ? "bg-sage-500/14 text-sage-700 dark:text-sage-300"
                              : "bg-canvas-sunken text-ink-muted dark:bg-night-sunken dark:text-stone-400"
                          }`}
                        >
                          {item.progress === "Sudah" && <Check size={13} />}
                          {item.progress === "Sudah" ? "Sudah" : item.progress || "Belum"}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          );
        })
      )}
    </Page>
  );
}

/** Tombol centang per pihak (CPP / CPW). */
function SideToggle({ label, done, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={done}
      aria-label={`Tandai ${label} ${done ? "belum lengkap" : "lengkap"}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-colors focus-ring ${
        done
          ? "bg-sage-500/14 text-sage-700 dark:text-sage-300"
          : "bg-canvas-sunken text-ink-faint dark:bg-night-sunken dark:text-stone-500"
      }`}
    >
      {done ? <Check size={13} /> : <span className="w-[13px] h-[13px] rounded-full border border-current opacity-50" />}
      {label}
    </button>
  );
}
