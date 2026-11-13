"use client";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ChevronDown, Pencil } from "lucide-react";
import { FileSpreadsheet, Wrench } from "lucide-react";
import Link from "next/link";
import { Fragment, useRef, useState } from "react";
import { PHASES } from "@/lib/constants";
import { fmt, plural } from "@/lib/format";
import { query } from "@/lib/api";
import { useDebounced, useJson } from "@/lib/hooks";
import {
  Card,
  ErrorState,
  ExportLink,
  FilterBar,
  FilterMenu,
  PageHead,
  Pager,
  Select,
} from "@/components/ui";

const keyOf = (r) => `${r.id}|${r.date}|${r.start}`;
const list = (values = []) => values.map((v) => ({ value: v, label: v }));
const iso = (d) => d.toLocaleDateString("en-CA");
const shift = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return iso(d);
};
const PRESETS = [
  {
    value: "today",
    label: "Today",
    range: () => [iso(new Date()), iso(new Date())],
  },
  {
    value: "7d",
    label: "Last 7 days",
    range: () => [shift(-6), iso(new Date())],
  },
  {
    value: "30d",
    label: "Last 30 days",
    range: () => [shift(-29), iso(new Date())],
  },
  {
    value: "month",
    label: "This month",
    range: () => [
      iso(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
      iso(new Date()),
    ],
  },
  { value: "custom", label: "Custom range", range: null },
];

export function BreakdownLog({ logged }: any) {
  const panel = useRef<any>(null);
  const [nonce, setNonce] = useState(0);
  const [q, setQ] = useState("");
  const [area, setArea] = useState<any[]>([]);
  const [category, setCategory] = useState<any[]>([]);
  const [asset, setAsset] = useState<any[]>([]);
  const [preset, setPreset] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<any>(null);
  const [size, setSize] = useState(25);
  const search = useDebounced(q.trim());
  const options = useJson("/api/options");
  const chosen = PRESETS.find((p) => p.value === preset);
  const [dateFrom, dateTo] = chosen?.range
    ? chosen.range()
    : preset === "custom"
      ? [from, to]
      : ["", ""];
  const badRange = Boolean(dateFrom && dateTo && dateFrom > dateTo);
  const params = query({
    q: search,
    area,
    category,
    asset,
    date_from: badRange ? "" : dateFrom,
    date_to: badRange ? "" : dateTo,
    page,
    page_size: size,
  });
  const { data, error, busy } = useJson(`/api/breakdowns?${params}`, nonce);
  const filtered = Boolean(
    search || area.length || category.length || asset.length || preset,
  );
  const machines = (options.data?.asset ?? [])
    .filter((a) => !area.length || area.includes(a.area))
    .map((a) => ({ value: a.id, label: `${a.id} · ${a.name}` }));
  const ready = Boolean(options.data);
  const dateInput =
    "absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted pointer-events-none";
  const fields = [
    {
      key: "date",
      label: "Date",
      control: (v, set) => (
        <div className="grid gap-2">
          <Select
            label="Date"
            hideLabel
            value={v ?? ""}
            placeholder="Any date"
            options={PRESETS}
            onChange={set}
          />
          {v === "custom" && (
            <div className="grid gap-2">
              <label className="relative">
                <span className={dateInput}>From</span>
                <input
                  className="h-10 pl-12"
                  type="date"
                  value={from}
                  max={to || undefined}
                  onChange={(e) => change(setFrom)(e.target.value)}
                />
              </label>
              <label className="relative">
                <span className={dateInput}>To</span>
                <input
                  className="h-10 pl-12"
                  type="date"
                  value={to}
                  min={from || undefined}
                  onChange={(e) => change(setTo)(e.target.value)}
                />
              </label>
            </div>
          )}
          {badRange && (
            <p className={"text-[13px] font-medium text-crit"} role="alert">
              “From” must be on or before “To”.
            </p>
          )}
        </div>
      ),
    },
    {
      key: "asset",
      label: "Machine",
      multi: true,
      placeholder: "Select machines",
      options: ready && machines,
    },
    {
      key: "area",
      label: "Shop",
      multi: true,
      placeholder: "Select shops",
      options: ready && list(options.data.area),
    },
    {
      key: "category",
      label: "Category",
      multi: true,
      placeholder: "Select categories",
      options: ready && list(options.data.category),
    },
  ];
  const setters = {
    date: setPreset,
    asset: setAsset,
    area: setArea,
    category: setCategory,
  };
  const onFilter = (key, value) => {
    if (key === "date" && value !== "custom") {
      setFrom("");
      setTo("");
    }
    if (key === "area" && value.length)
      setAsset((ids) =>
        ids.filter((id) =>
          value.includes(options.data?.asset.find((a) => a.id === id)?.area),
        ),
      );
    change(setters[key])(value);
  };
  const clearFilters = () => {
    setArea([]);
    setCategory([]);
    setAsset([]);
    setPreset("");
    setFrom("");
    setTo("");
    setPage(1);
  };
  const [loggedId, loggedDate, loggedStart] = logged?.split("|") ?? [];

  const change = (setter) => (value) => {
    setter(value);
    setPage(1);
  };
  const goTo = (n) => {
    setPage(n);
    panel.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const reset = () => {
    setQ("");
    clearFilters();
  };

  return (
    <>
      <PageHead
        title="Breakdowns"
        icon={Wrench}
        tone="bd"
        sub={data ? `${plural(data.all, "breakdown")} logged` : "Loading…"}
      >
        <div className="flex items-center gap-2.5">
          <ExportLink
            href={`/api/breakdowns/export?${query({ q: search, area, category, asset, date_from: badRange ? "" : dateFrom, date_to: badRange ? "" : dateTo })}`}
            label="Export Excel"
            Icon={FileSpreadsheet}
          />
          <Link href="/breakdowns/new" className={buttonVariants()}>
            Log breakdown
          </Link>
        </div>
      </PageHead>
      <main
        className={"px-[clamp(16px,2.5vw,28px)] pt-2 pb-10 transition-opacity"}
      >
        {loggedId && (
          <p
            className={
              "mb-4 px-3.5 py-2.5 rounded-sm border border-ok-line bg-ok-bg text-ok-ink"
            }
            role="status"
          >
            Logged <b>{loggedId}</b> for {fmt.day(loggedDate)} from{" "}
            {loggedStart}.{" "}
            <Link
              href="/breakdowns/new"
              className={buttonVariants({ variant: "link", size: "inline" })}
            >
              Log another
            </Link>
          </p>
        )}
        {error && !data ? (
          <ErrorState title="Can’t load breakdowns">
            <p>{error.message}</p>
            <button
              type="button"
              className={buttonVariants()}
              onClick={() => setNonce((n) => n + 1)}
            >
              Retry
            </button>
          </ErrorState>
        ) : (
          <Card
            id="bd-h"
            title="Breakdown log"
            className="scroll-mt-[88px]"
            ref={panel}
          >
            <FilterBar
              label="Filter breakdowns"
              q={q}
              onQ={change(setQ)}
              placeholder="Search asset, problem, action, person"
              count={
                data &&
                (filtered
                  ? `${data.total} of ${data.all} match`
                  : plural(data.all, "breakdown"))
              }
            >
              <FilterMenu
                fields={fields}
                value={{ date: preset, asset, area, category }}
                onChange={onFilter}
                onClear={clearFilters}
              />
            </FilterBar>
            {!data ? (
              <div
                className={
                  "h-[220px] rounded-sm bg-[linear-gradient(90deg,var(--ground),var(--panel-2),var(--ground))] bg-[length:200%_100%] animate-shimmer"
                }
              />
            ) : data.items.length ? (
              <>
                <div
                  className={`overflow-x-auto transition-opacity ${busy ? "opacity-55" : ""}`}
                  aria-busy={busy}
                >
                  <table
                    className={
                      "w-full border-collapse text-[13.5px] tabular-nums [&_th]:sticky [&_th]:top-0 [&_th]:z-[1] [&_th]:bg-shell [&_th]:px-3 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-[12.5px] [&_th]:font-medium [&_th]:text-muted [&_th]:whitespace-nowrap [&_th:first-child]:rounded-l-sm [&_th:last-child]:rounded-r-sm [&_td]:px-3 [&_td]:py-3 [&_td]:border-b [&_td]:border-line [&_td]:align-top [&_tr:last-child>td]:border-b-0 table-fixed min-w-[1072px] [&_th]:px-2! [&_td]:px-2! [&_th]:overflow-hidden [&_th]:text-ellipsis [&_td]:overflow-hidden"
                    }
                  >
                    <colgroup>
                      <col className="w-[132px]" />
                      <col className="w-[176px]" />
                      <col className="w-[96px]" />
                      <col />
                      <col />
                      {PHASES.map((p) => (
                        <col key={p.key} className="w-[96px]" />
                      ))}
                      <col className="w-[92px]" />
                      <col className="w-[76px]" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th scope="col">When</th>
                        <th scope="col">Asset</th>
                        <th scope="col">Category</th>
                        <th scope="col">Problem</th>
                        <th scope="col">Action taken</th>
                        {PHASES.map((p) => (
                          <th
                            key={p.key}
                            scope="col"
                            className={"text-right whitespace-nowrap"}
                          >
                            {p.short}
                          </th>
                        ))}
                        <th
                          scope="col"
                          className={"text-right whitespace-nowrap"}
                        >
                          Downtime
                        </th>
                        <th scope="col">
                          <span className="sr-only">Edit and details</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((r, i) => {
                        const key = `${keyOf(r)}|${i}`;
                        const isOpen = open === key;
                        const toggle = () => setOpen(isOpen ? null : key);
                        return (
                          <Fragment key={key}>
                            <tr
                              className={`cursor-pointer ${
                                isOpen
                                  ? "bg-panel-2 [&>td]:border-b-transparent"
                                  : keyOf(r) === logged
                                    ? "bg-brand-soft"
                                    : "hover:bg-hover"
                              }`}
                              onClick={toggle}
                            >
                              <td>
                                <span className={"block font-medium"}>
                                  {fmt.day(r.date)}
                                </span>
                                <span
                                  className={
                                    "block text-xs text-muted font-mono"
                                  }
                                >
                                  {r.shift && `${r.shift} · `}
                                  {r.start}–{r.stop}
                                </span>
                              </td>
                              <td>
                                <span
                                  className={"block font-medium truncate"}
                                  title={r.name}
                                >
                                  {r.name}
                                </span>
                                <span
                                  className={
                                    "block text-xs text-muted truncate"
                                  }
                                >
                                  <span className={"font-mono text-[0.86em]"}>
                                    {r.id}
                                  </span>{" "}
                                  · {r.area}
                                </span>
                              </td>
                              <td>
                                <span
                                  className="block truncate"
                                  title={r.category}
                                >
                                  {r.category}
                                </span>
                              </td>
                              <td>
                                <span
                                  className={"block font-medium truncate"}
                                  title={r.problem}
                                >
                                  {r.problem}
                                </span>
                                {r.description && (
                                  <span
                                    className={
                                      "block text-xs text-muted truncate"
                                    }
                                  >
                                    {r.description}
                                  </span>
                                )}
                              </td>
                              <td>
                                {r.action ? (
                                  <span className="line-clamp-2 wrap-anywhere">
                                    {r.action}
                                  </span>
                                ) : (
                                  <span className={"block text-xs text-muted"}>
                                    Not recorded
                                  </span>
                                )}
                              </td>
                              {PHASES.map((p) => (
                                <td
                                  key={p.key}
                                  className={
                                    "text-right whitespace-nowrap text-muted"
                                  }
                                >
                                  {fmt.mins(r[p.key])}
                                </td>
                              ))}
                              <td
                                className={
                                  "text-right whitespace-nowrap font-semibold"
                                }
                              >
                                {fmt.mins(r.minutes)}
                              </td>
                              <td className="text-right whitespace-nowrap">
                                <Link
                                  href={`/breakdowns/new?edit=${r.entry_id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-grid place-items-center size-7 -mt-[3px] rounded-sm text-muted hover:bg-brand-soft hover:text-accent"
                                  aria-label={`Edit breakdown on ${r.name}, ${fmt.day(r.date)}`}
                                  title="Edit"
                                >
                                  <Pencil
                                    size={14}
                                    strokeWidth={1.8}
                                    aria-hidden="true"
                                  />
                                </Link>
                                <button
                                  type="button"
                                  className={cn(
                                    buttonVariants({
                                      variant: "ghost",
                                      size: "icon-sm",
                                    }),
                                    "-mt-[3px] size-7 text-muted",
                                  )}
                                  aria-expanded={isOpen}
                                  aria-controls={`d-${i}`}
                                  aria-label={`${isOpen ? "Hide" : "Show"} details for ${r.name} on ${fmt.day(r.date)}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggle();
                                  }}
                                >
                                  <ChevronDown
                                    size={14}
                                    strokeWidth={1.8}
                                    aria-hidden="true"
                                    className={`transition-[rotate] duration-150 ${isOpen ? "rotate-180" : ""}`}
                                  />
                                </button>
                              </td>
                            </tr>
                            {isOpen && (
                              <tr className="bg-panel-2" id={`d-${i}`}>
                                <td
                                  colSpan={7 + PHASES.length}
                                  className="!p-0 !pb-4"
                                >
                                  <dl className="grid grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_200px_200px] gap-5 m-0 px-4 py-3.5 rounded-sm border border-line bg-panel [&_dt]:text-xs [&_dt]:font-semibold [&_dt]:text-muted [&_dd]:mt-1 [&_dd]:leading-normal [&_dd]:whitespace-pre-wrap [&_dd]:wrap-anywhere">
                                    <div>
                                      <dt>Problem description</dt>
                                      <dd>{r.description || "Not recorded"}</dd>
                                    </div>
                                    <div>
                                      <dt>Action taken</dt>
                                      <dd>{r.action || "Not recorded"}</dd>
                                    </div>
                                    <div>
                                      <dt>Asset</dt>
                                      <dd>
                                        {r.name}
                                        <span
                                          className={"block text-xs text-muted"}
                                        >
                                          <span
                                            className={
                                              "font-mono text-[0.86em]"
                                            }
                                          >
                                            {r.id}
                                          </span>{" "}
                                          · {r.area}
                                        </span>
                                      </dd>
                                    </div>
                                    <div>
                                      <dt>Logged by</dt>
                                      <dd>
                                        {r.entered_by ||
                                          "Imported from workbook"}
                                      </dd>
                                    </div>
                                  </dl>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Pager
                  page={data.page}
                  pages={data.pages}
                  total={data.total}
                  size={data.page_size}
                  noun="breakdowns"
                  onPage={goTo}
                  onSize={change(setSize)}
                />
              </>
            ) : (
              <div
                className={"grid justify-items-start gap-1.5 py-6 text-muted"}
              >
                <p>No breakdowns match these filters.</p>
                <button
                  type="button"
                  className={buttonVariants({
                    variant: "link",
                    size: "inline",
                  })}
                  onClick={reset}
                >
                  Clear filters
                </button>
              </div>
            )}
          </Card>
        )}
      </main>
    </>
  );
}
