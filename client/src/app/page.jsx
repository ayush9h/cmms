"use client";

import { Presentation } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { FilterMenu } from "./filters";
import { fmt, query, useJson } from "./lib";
import { Kpis, KpiSkeleton } from "./kpis";
import { ErrorState, ExportLink, PageHead, banner, btn, cx, link, pageMain, panel, skeleton } from "./ui";

const chart = (name) => dynamic(() => import("./charts").then((m) => m[name]), { ssr: false, loading: () => <div className={skeleton} /> });
const MonthChart = chart("MonthChart");
const CategoryPie = chart("CategoryPie");
const PhasePie = chart("PhasePie");

const full = cx(panel, "col-span-12 animate-rise");
const half = cx(panel, "col-span-12 lg:col-span-6 animate-rise");
const delay = (i) => ({ animationDelay: `${160 + i * 45}ms` });
const list = (values = [], label = (v) => v) => values.map((v) => ({ value: v, label: label(v) }));

export default function Dashboard() {
  const [filters, setFilters] = useState({ area: [], month: "", category: [], asset: [] });
  const [nonce, setNonce] = useState(0);
  const options = useJson("/api/options", nonce);
  const { data, error, busy } = useJson(`/api/dashboard?${query(filters)}`, nonce);
  const assets = options.data?.asset ?? [];
  const inShop = (a) => !filters.area.length || filters.area.includes(a.area);
  const set = (key, value) =>
    setFilters((f) => {
      const next = { ...f, [key]: value };
      if (key === "area" && value.length) next.asset = f.asset.filter((id) => value.includes(assets.find((a) => a.id === id)?.area));
      return next;
    });
  const flip = (key, value) => set(key, filters[key].includes(value) ? filters[key].filter((v) => v !== value) : [...filters[key], value]);
  const retry = () => setNonce((n) => n + 1);
  const fields = [
    { key: "area", label: "Shop", multi: true, placeholder: "Select shops", options: options.data && list(options.data.area) },
    { key: "month", label: "Month", placeholder: "All months", options: options.data && list(options.data.month, fmt.monthLong) },
    { key: "category", label: "Category", multi: true, placeholder: "Select categories", options: options.data && list(options.data.category) },
    { key: "asset", label: "Machine", multi: true, placeholder: "Select machines", options: options.data && assets.filter(inShop).map((a) => ({ value: a.id, label: `${a.id} · ${a.name}` })) },
  ];

  return (
    <>
      <PageHead title="Reliability dashboard" sub={data ? `${fmt.day(data.period.start)} – ${fmt.day(data.period.end)}` : "Loading…"}>
        <div className="flex items-center gap-3">
          <p className="text-[13px] text-muted empty:hidden" role="status">{busy && data ? "Updating…" : ""}</p>
          <FilterMenu fields={fields} value={filters} onChange={set} onClear={() => setFilters({ area: [], month: "", category: [], asset: [] })} align="right" />
          <ExportLink href={`/api/dashboard/export?${query(filters)}`} label="Export PowerPoint" Icon={Presentation} />
        </div>
      </PageHead>

      <main className={cx(pageMain, busy && data && "opacity-70")} aria-busy={busy}>
        {error && !data ? (
          <ErrorState title="Can’t reach the CMMS server">
            <p>The dashboard reads from the FastAPI service on port 8000. Start it with <code className="font-mono text-[0.86em]">uvicorn main:app</code> in the server folder, then retry.</p>
            <button type="button" className={btn} onClick={retry}>Retry</button>
          </ErrorState>
        ) : !data ? (
          <div role="status" aria-label="Loading dashboard">
            <KpiSkeleton />
            <div className="grid grid-cols-12 gap-5">
              <div className={full}><div className={skeleton} /></div>
              <div className={half}><div className={skeleton} /></div>
              <div className={half}><div className={skeleton} /></div>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <p className={banner} role="alert">
                Couldn’t refresh: {error.message}. Showing the last loaded view.{" "}
                <button type="button" className={link} onClick={retry}>Retry</button>
              </p>
            )}
            <Kpis kpi={data.kpi} monthly={data.monthly} month={filters.month} total={data.kpi.assets_total} />
            <div className="grid grid-cols-12 gap-5">
              <section className={full} style={delay(0)} aria-labelledby="month-h">
                <MonthChart rows={data.monthly} selected={filters.month} onPick={(m) => set("month", filters.month === m ? "" : m)} />
              </section>
              <section className={half} style={delay(1)} aria-labelledby="cat-h">
                <CategoryPie rows={data.categories} order={options.data?.category ?? data.categories.map((c) => c.name).sort()} selected={filters.category} onPick={(c) => flip("category", c)} />
              </section>
              <section className={half} style={delay(2)} aria-labelledby="phase-h">
                <PhasePie phases={data.kpi.phases} />
              </section>
            </div>
          </>
        )}
      </main>
    </>
  );
}
