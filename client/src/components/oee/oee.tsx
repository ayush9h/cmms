"use client";

import { buttonVariants } from "@/components/ui/button";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { Card, ErrorState, FilterMenu, PageHead } from "@/components/ui";
import { query } from "@/lib/api";
import { fmt } from "@/lib/format";
import { useJson } from "@/lib/hooks";
import { METRICS, pct } from "./metrics";

const OeeChart = dynamic(() => import("./oee-chart").then((m) => m.OeeChart), {
  ssr: false,
  loading: () => (
    <div
      className={
        "h-[220px] rounded-sm bg-[linear-gradient(90deg,var(--ground),var(--panel-2),var(--ground))] bg-[length:200%_100%] animate-shimmer"
      }
    />
  ),
});
const BLANK = {
  area: [] as string[],
  month: "",
  asset: [] as string[],
  shift: [] as string[],
};
const VIEWS = [
  {
    key: "daily",
    label: "Day",
    x: "date",
    tick: (d) => fmt.day(d).replace(/ \d{4}$/, ""),
    title: fmt.day,
  },
  {
    key: "monthly",
    label: "Month",
    x: "month",
    tick: fmt.month,
    title: fmt.monthLong,
  },
  {
    key: "shifts",
    label: "Shift",
    x: "shift",
    tick: (s) => `Shift ${s}`,
    title: (s) => `Shift ${s}`,
  },
];
const GRID = "grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3";
const TICKS = Array.from({ length: 40 }, (_, i) => i);
const list = (values = [], label = (v) => v) =>
  values.map((v) => ({ value: v, label: label(v) }));

function Meter({ value, bar }: any) {
  const on = Math.round(((value ?? 0) / 100) * TICKS.length);
  return (
    <div className="flex gap-0.5 sm:gap-[3px] h-6" aria-hidden="true">
      {TICKS.map((i) => (
        <i
          key={i}
          className={`flex-1 rounded-full ${i < on ? bar : "bg-track"}`}
        />
      ))}
    </div>
  );
}

function Metric({ metric, kpi, index }: any) {
  return (
    <div
      className={
        "flex min-w-0 flex-col rounded-sm border border-line bg-shell p-1.5 animate-rise"
      }
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 min-h-8 px-2.5 pb-1.5">
        <h2 className="text-[13px] font-medium text-ink-2">{metric.label}</h2>
        <p className="hidden sm:block min-w-0 truncate text-xs text-muted">
          World class {pct(metric.world)}
        </p>
      </div>
      {/* flex-1 so a note that wraps to two lines cannot make one card taller */}
      <div className="grid min-w-0 flex-1 content-start gap-3 rounded-sm border border-line bg-panel shadow-card p-4">
        <p className="text-[clamp(24px,2.2vw,30px)] font-semibold leading-[1.1] tracking-[-0.03em] tabular-nums">
          {pct(kpi[metric.key])}
        </p>
        <Meter value={kpi[metric.key]} bar={metric.bar} />
        <p className="text-[12.5px] text-muted tabular-nums">
          {metric.note(kpi)}
        </p>
      </div>
    </div>
  );
}

export function Oee({ logged }: any) {
  const [filters, setFilters] = useState(BLANK);
  const [nonce, setNonce] = useState(0);
  const [view, setView] = useState(VIEWS[0]);
  const [picked, setPicked] = useState<any>(null);
  const options = useJson("/api/options", nonce);
  const { data, error, busy } = useJson(`/api/oee?${query(filters)}`, nonce);
  const assets = options.data?.asset ?? [];
  const set = (key, value) =>
    setFilters((f) => {
      const next = { ...f, [key]: value };
      if (key === "area" && value.length)
        next.asset = f.asset.filter((id) =>
          value.includes(assets.find((a) => a.id === id)?.area),
        );
      return next;
    });
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
      options:
        data &&
        list(
          data.monthly.map((m) => m.month),
          fmt.monthLong,
        ),
    },
    {
      key: "shift",
      label: "Shift",
      multi: true,
      placeholder: "All shifts",
      options: options.data && list(options.data.shift, (s) => `Shift ${s}`),
    },
    {
      key: "asset",
      label: "Machine",
      multi: true,
      placeholder: "Select machines",
      options:
        options.data &&
        assets
          .filter((a) => !filters.area.length || filters.area.includes(a.area))
          .map((a) => ({ value: a.id, label: `${a.id} · ${a.name}` })),
    },
  ];
  const [loggedId, loggedDate] = logged?.split("|") ?? [];
  const logged_rows = (data?.[view.key] ?? []).filter((r) => r.entries);
  const focus =
    picked === "all"
      ? null
      : (logged_rows.find((r) => r[view.x] === picked) ??
        logged_rows.at(-1) ??
        null);
  const kpi = focus ?? data?.kpi;

  return (
    <>
      <PageHead
        title="OEE"
        sub="Overall equipment effectiveness: Availability × Performance × Quality."
      >
        <div className="flex items-center gap-2.5">
          <p className="text-[13px] text-muted empty:hidden" role="status">
            {busy && data ? "Updating…" : ""}
          </p>
          <FilterMenu
            fields={fields}
            value={filters}
            onChange={set}
            onClear={() => setFilters(BLANK)}
            align="right"
          />
          <Link href="/oee/ppc" className={buttonVariants()}>
            PPC entry
          </Link>
        </div>
      </PageHead>

      <main
        className={`px-[clamp(16px,2.5vw,28px)] pt-2 pb-10 transition-opacity ${busy && data ? "opacity-70" : ""}`}
        aria-busy={busy}
      >
        {loggedId && (
          <p
            className={
              "mb-4 px-3.5 py-2.5 rounded-sm border border-ok-line bg-ok-bg text-ok-ink"
            }
            role="status"
          >
            Saved the PPC entry for <b>{loggedId}</b> from {fmt.day(loggedDate)}
            .{" "}
            <Link
              href="/oee/ppc"
              className={buttonVariants({ variant: "link", size: "inline" })}
            >
              Add another
            </Link>
          </p>
        )}
        {error && !data ? (
          <ErrorState title="Can’t load OEE">
            <p>{error.message}</p>
            <button type="button" className={buttonVariants()} onClick={retry}>
              Retry
            </button>
          </ErrorState>
        ) : !data ? (
          <div role="status" aria-label="Loading OEE">
            <div className={GRID}>
              {METRICS.map((m) => (
                <div
                  key={m.key}
                  className={
                    "min-w-0 rounded-sm border border-line bg-shell p-1.5"
                  }
                >
                  <div
                    className={
                      "h-[132px] rounded-sm bg-[linear-gradient(90deg,var(--ground),var(--panel-2),var(--ground))] bg-[length:200%_100%] animate-shimmer"
                    }
                  />
                </div>
              ))}
            </div>
            <div
              className={"min-w-0 rounded-sm border border-line bg-shell p-1.5"}
            >
              <div
                className={
                  "h-[220px] rounded-sm bg-[linear-gradient(90deg,var(--ground),var(--panel-2),var(--ground))] bg-[length:200%_100%] animate-shimmer"
                }
              />
            </div>
          </div>
        ) : (
          <>
            {error && (
              <p
                className={
                  "mb-4 px-3.5 py-2.5 rounded-sm border border-danger-line bg-danger-bg text-danger-ink"
                }
                role="alert"
              >
                Couldn’t refresh: {error.message}. Showing the last loaded view.{" "}
                <button
                  type="button"
                  className={buttonVariants({
                    variant: "link",
                    size: "inline",
                  })}
                  onClick={retry}
                >
                  Retry
                </button>
              </p>
            )}
            {!data.kpi.entries && (
              <p
                className={
                  "min-w-0 rounded-sm border border-line bg-panel shadow-card p-4 sm:p-5 mb-3 text-[13.5px] text-ink-2"
                }
              >
                No production or breakdowns are logged against a PPC entry for
                this selection. OEE is calculated for each shift that has
                production or a breakdown logged, on a machine with a{" "}
                <Link
                  href="/oee/ppc"
                  className={buttonVariants({
                    variant: "link",
                    size: "inline",
                  })}
                >
                  PPC entry
                </Link>{" "}
                covering that date.
              </p>
            )}
            {logged_rows.length > 0 && (
              <p
                className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2.5 px-1 text-[13px] text-muted"
                role="status"
              >
                {focus ? (
                  <>
                    <span>
                      Showing{" "}
                      <b className="font-semibold text-ink">
                        {view.title(focus[view.x])}
                      </b>
                      . Select a {view.label.toLowerCase()} in the chart to
                      change it.
                    </span>
                    <button
                      type="button"
                      className={buttonVariants({
                        variant: "link",
                        size: "inline",
                      })}
                      onClick={() => setPicked("all")}
                    >
                      Show the total
                    </button>
                  </>
                ) : (
                  <>
                    <span>
                      Showing{" "}
                      <b className="font-semibold text-ink">the total</b> for
                      this selection.
                    </span>
                    <button
                      type="button"
                      className={buttonVariants({
                        variant: "link",
                        size: "inline",
                      })}
                      onClick={() => setPicked(null)}
                    >
                      Show the latest {view.label.toLowerCase()}
                    </button>
                  </>
                )}
              </p>
            )}
            <div className={GRID}>
              {METRICS.map((m, i) => (
                <Metric key={m.key} metric={m} kpi={kpi} index={i} />
              ))}
            </div>

            <div className="grid gap-3">
              <Card
                id="oee-month-h"
                title={`OEE by ${view.label.toLowerCase()}`}
                meta={
                  <span className="flex flex-wrap justify-end gap-x-3.5 gap-y-1">
                    {METRICS.map((m) => (
                      <span
                        key={m.key}
                        className="inline-flex items-center gap-1.5"
                      >
                        <i
                          className="size-2.5 shrink-0 rounded-[3px] ring-1 ring-line"
                          style={{ background: m.color }}
                        />
                        {m.label}
                      </span>
                    ))}
                  </span>
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div
                    className="inline-grid grid-cols-3 gap-1 p-1 rounded-sm border border-line-strong bg-panel-2"
                    role="group"
                    aria-label="View OEE by"
                  >
                    {VIEWS.map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        aria-pressed={view.key === v.key}
                        onClick={() => {
                          setView(v);
                          setPicked(null);
                        }}
                        className={`h-8 px-4 rounded-sm text-sm font-semibold ${
                          view.key === v.key
                            ? "bg-panel text-ink shadow-card"
                            : "text-muted hover:text-ink"
                        }`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[13px] text-muted">
                    {view.key === "daily"
                      ? "Days with production or a breakdown logged, latest 31."
                      : view.key === "monthly"
                        ? "Each month totals its logged shifts."
                        : "Logged shifts grouped by shift."}
                  </p>
                </div>
                {data[view.key].some((r) => r.entries) ? (
                  <OeeChart
                    rows={data[view.key]}
                    xKey={view.x}
                    tick={view.tick}
                    title={view.title}
                    selected={focus?.[view.x]}
                    onPick={setPicked}
                  />
                ) : (
                  <p className="py-10 text-[13.5px] text-muted">
                    Nothing logged for this selection yet.
                  </p>
                )}
              </Card>
            </div>
          </>
        )}
      </main>
    </>
  );
}
