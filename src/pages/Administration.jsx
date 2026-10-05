import { useMemo, useState } from "react";
import { FileCheck2, Check, X as XIcon, Search, ShieldCheck, ClipboardList } from "lucide-react";
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
} from "../components/ui";
import { useWedding } from "../lib/weddingData";
import pb from "../lib/pocketbase";
import { pct } from "../lib/format";

export default function Administration() {
  const { administrations, adminSummary, loading, error, reload, addLog } = useWedding();
  const [query, setQuery] = useState("");

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
    return [...map.entries()];
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

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} />;

  return (
    <Page>
      <PageHeader
        title="Administrasi & Dokumen"
        subtitle="Kelengkapan berkas legal pernikahan CPP & CPW serta checklist persiapan."
        icon={FileCheck2}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Item"
          value={adminSummary.total}
          sub={`${sections.length} seksi persiapan`}
          icon={ClipboardList}
          tone="primary"
        />
        <StatCard
          label="Selesai"
          value={adminSummary.done}
          sub={`${pct(adminSummary.done, adminSummary.total).toFixed(0)}% dari keseluruhan`}
          icon={ShieldCheck}
          tone="green"
        />
        <StatCard
          label="Dokumen Legal"
          value={`${adminSummary.docsDone}/${adminSummary.docsTotal}`}
          sub="CPP & CPW lengkap"
          icon={FileCheck2}
          tone="blue"
        />
        <StatCard
          label="Checklist Persiapan"
          value={`${adminSummary.progressDone}/${adminSummary.progressTotal}`}
          sub="item non-dokumen"
          icon={ClipboardList}
          tone="amber"
        />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Progres Kelengkapan Berkas</h3>
          <Badge tone="purple">
            {pct(adminSummary.docsDone, adminSummary.docsTotal || 1).toFixed(0)}%
          </Badge>
        </div>
        <ProgressBar
          value={pct(adminSummary.docsDone, adminSummary.docsTotal || 1)}
          tone="bg-sky-500"
          height="h-3"
        />
      </Card>

      <div className="relative">
        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari dokumen atau item persiapan…"
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-darksurface text-sm"
        />
      </div>

      {sections.length === 0 ? (
        <Card>
          <EmptyState message="Tidak ada item administrasi yang cocok." icon={FileCheck2} />
        </Card>
      ) : (
        sections.map(([section, items]) => {
          const done = items.filter(
            (i) => (i.is_document && i.cpp_complete && i.cpw_complete) || i.progress === "Sudah"
          ).length;
          return (
            <Card key={section}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-semibold">{section}</h3>
                  <p className="text-xs text-gray-400">{items.length} item</p>
                </div>
                <div className="flex items-center gap-3 min-w-[160px]">
                  <ProgressBar value={pct(done, items.length)} height="h-1.5" />
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {done}/{items.length}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                {items.map((item) =>
                  item.is_document ? (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center gap-3 py-2.5 px-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    >
                      <span className="flex-1 min-w-[200px] text-sm">{item.item}</span>
                      <span className="text-xs text-gray-400 hidden sm:block">{item.details}</span>
                      <button
                        onClick={() => toggleDoc(item, "CPP")}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium ${
                          item.cpp_complete
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                        }`}
                      >
                        {item.cpp_complete ? <Check size={13} /> : <XIcon size={13} />} CPP
                      </button>
                      <button
                        onClick={() => toggleDoc(item, "CPW")}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium ${
                          item.cpw_complete
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                        }`}
                      >
                        {item.cpw_complete ? <Check size={13} /> : <XIcon size={13} />} CPW
                      </button>
                    </div>
                  ) : (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center gap-3 py-2.5 px-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    >
                      <span className="flex-1 min-w-[200px] text-sm">{item.item}</span>
                      <span className="text-xs text-gray-400 hidden sm:block">{item.details}</span>
                      <button
                        onClick={() => toggleProgress(item)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium ${
                          item.progress === "Sudah"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                        }`}
                      >
                        {item.progress === "Sudah" ? "Sudah" : item.progress || "Belum"}
                      </button>
                    </div>
                  )
                )}
              </div>
            </Card>
          );
        })
      )}
    </Page>
  );
}
