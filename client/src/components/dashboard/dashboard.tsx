"use client";

import { Presentation } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { ErrorState, ExportLink, FilterMenu, PageHead } from "@/components/ui";
import { fmt } from "@/lib/format";
import { query } from "@/lib/api";
import { useJson } from "@/lib/hooks";
import { Kpis, KpiSkeleton } from "./kpis";

const BONE = (
  <div className={"min-w-0 rounded-2xl border border-line bg-shell p-1.5"}>
    <div
      className={
        "h-[220px] rounded-md bg-[linear-gradient(90deg,var(--ground),var(--panel-2),var(--ground))] bg-[length:200%_100%] animate-shimmer"
      }
    />
  </div>
);
const chart = (name: "MonthChart" | "CategoryPie" | "PhasePie") =>
  dynamic<any>(() => import("./charts").then((m) => m[name]), {
    ssr: false,
    loading: () => BONE,
  });
const MonthChart = chart("MonthChart");
const CategoryPie = chart("CategoryPie");
const PhasePie = chart("PhasePie");

const full = "col-span-12 animate-rise";
const half = "col-span-12 lg:col-span-6 animate-rise";
const delay = (i) => ({ animationDelay: `${160 + i * 45}ms` });
const list = (values = [], label = (v) => v) =>
  values.map((v) => ({ value: v, label: label(v) }));

export function Dashboard() {
  const [filters, setFilters] = useState({
    area: [] as string[],
    month: "",
    category: [] as string[],
    asset: [] as string[],
  });
  const [nonce, setNonce] = useState(0);
  const options = useJson("/api/options", nonce);
  const { data, error, busy } = useJson(
    `/api/dashboard?${query(filters)}`,
    nonce,
  );
  const assets = options.data?.asset ?? [];
  const inShop = (a) => !filters.area.length || filters.area.includes(a.area);
  const set = (key, value) =>
    setFilters((f) => {
      const next = { ...f, [key]: value };
      if (key === "area" && value.length)
        next.asset = f.asset.filter((id) =>
          value.includes(assets.find((a) => a.id === id)?.area),
        );
      return next;
    });
  const flip = (key, value) =>
    set(
      key,
      filters[key].includes(value)
        ? filters[key].filter((v) => v !== value)
        : [...filters[key], value],
    );
  const retry = () => setNonce((n) => n + 1);
  const fields = [
    {
      key: "area",
      label: "Shop",
      multi: true,
      placeholder: "Select shops",
      options: options.data && list(options.data.area),
    },
    {
      key: "month",
      label: "Month",
      placeholder: "All months",
      options: options.data && list(options.data.month, fmt.monthLong),
    },
    {
      key: "category",
      label: "Category",
      multi: true,
      placeholder: "Select categories",
      options: options.data && list(options.data.category),
    },
    {
      key: "asset",
      label: "Machine",
      multi: true,
      placeholder: "Select machines",
      options:
        options.data &&
        assets
          .filter(inShop)
          .map((a) => ({ value: a.id, label: `${a.id} · ${a.name}` })),
    },
  ];

  return (
    <>
      <PageHead
        title="Operational Excellence Dashboard"
        sub={
          data
            ? `${fmt.day(data.period.start)} – ${fmt.day(data.period.end)}`
            : "Loading…"
        }
      >
        <div className="flex items-center gap-3">
          <p className="text-[13px] text-muted empty:hidden" role="status">
            {busy && data ? "Updating…" : ""}
          </p>
          <FilterMenu
            fields={fields}
            value={filters}
            onChange={set}
            onClear={() =>
              setFilters({ area: [], month: "", category: [], asset: [] })
            }
            align="right"
          />
          <ExportLink
            href={`/api/dashboard/export?${query(filters)}`}
            label="Export PowerPoint"
            Icon={Presentation}
          />
        </div>
      </PageHead>

      <main
        className={`px-[clamp(16px,2.5vw,28px)] pt-2 pb-10 transition-opacity ${busy && data ? "opacity-70" : ""}`}
        aria-busy={busy}
      >
        {error && !data ? (
          <ErrorState title="Can’t reach the CMMS server">
            <p>
              The dashboard reads from the FastAPI service on port 8000. Start
              it with{" "}
              <code className="font-mono text-[0.86em]">uvicorn main:app</code>{" "}
              in the server folder, then retry.
            </p>
            <button
              type="button"
              className={
                "inline-flex items-center justify-center gap-2 rounded-md bg-btn text-on-btn font-semibold whitespace-nowrap hover:bg-btn-hover disabled:opacity-60 disabled:cursor-progress disabled:hover:bg-btn min-h-10 px-4"
              }
              onClick={retry}
            >
              Retry
            </button>
          </ErrorState>
        ) : !data ? (
          <div role="status" aria-label="Loading dashboard">
            <KpiSkeleton />
            <div className="grid grid-cols-12 gap-3">
              <div className={full}>{BONE}</div>
              <div className={half}>{BONE}</div>
              <div className={half}>{BONE}</div>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <p
                className={
                  "mb-4 px-3.5 py-2.5 rounded-md border border-danger-line bg-danger-bg text-danger-ink"
                }
                role="alert"
              >
                Couldn’t refresh: {error.message}. Showing the last loaded view.{" "}
                <button
                  type="button"
                  className={
                    "text-accent font-semibold underline underline-offset-3 decoration-1 hover:decoration-2"
                  }
                  onClick={retry}
                >
                  Retry
                </button>
              </p>
            )}
            <Kpis
              kpi={data.kpi}
              monthly={data.monthly}
              month={filters.month}
              total={data.kpi.assets_total}
            />
            <div className="grid grid-cols-12 gap-3">
              <div className={full} style={delay(0)}>
                <MonthChart
                  rows={data.monthly}
                  selected={filters.month}
                  onPick={(m) => set("month", filters.month === m ? "" : m)}
                />
              </div>
              <div className={half} style={delay(1)}>
                <CategoryPie
                  rows={data.categories}
                  order={
                    options.data?.category ??
                    data.categories.map((c) => c.name).sort()
                  }
                  selected={filters.category}
                  onPick={(c) => flip("category", c)}
                />
              </div>
              <div className={half} style={delay(2)}>
                <PhasePie phases={data.kpi.phases} />
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
