"use client";

import { buttonVariants } from "@/components/ui/button";
import { Factory, FileSpreadsheet, Pencil } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  Card,
  ErrorState,
  ExportLink,
  FilterBar,
  FilterMenu,
  PageHead,
  Pager,
} from "@/components/ui";
import { fmt, plural } from "@/lib/format";
import { query } from "@/lib/api";
import { useDebounced, useJson } from "@/lib/hooks";

const list = (values = []) => values.map((v) => ({ value: v, label: v }));
const BLANK = {
  area: [] as string[],
  asset: [] as string[],
  defect: [] as string[],
  disposition: [] as string[],
};

export function RejectionLog({ logged }: any) {
  const panelRef = useRef<any>(null);
  const [nonce, setNonce] = useState(0);
  const [q, setQ] = useState("");
  const [f, setF] = useState(BLANK);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(25);
  const search = useDebounced(q.trim());
  const options = useJson("/api/options");
  const { data, error, busy } = useJson(
    `/api/rejections?${query({ q: search, ...f, page, page_size: size })}`,
    nonce,
  );
  const filtered = Boolean(search || Object.values(f).some((v) => v.length));
  const ready = Boolean(options.data);
  const machines = (options.data?.asset ?? []).filter(
    (a) => !f.area.length || f.area.includes(a.area),
  );
  const fields = [
    {
      key: "area",
      label: "Shop",
      multi: true,
      placeholder: "Select shops",
      options: ready && list(options.data.area),
    },
    {
      key: "asset",
      label: "Machine",
      multi: true,
      placeholder: "Select machines",
      options:
        ready &&
        machines.map((a) => ({ value: a.id, label: `${a.id} · ${a.name}` })),
    },
    {
      key: "defect",
      label: "Defect",
      multi: true,
      placeholder: "Select defects",
      options: ready && list(options.data.defect),
    },
    {
      key: "disposition",
      label: "Disposition",
      multi: true,
      placeholder: "Scrap or rework",
      options: ready && list(options.data.disposition),
    },
  ];
  const [loggedId, loggedDate, loggedPart] = logged?.split("|") ?? [];

  const onFilter = (key, value) => {
    setF((cur) => {
      const next = { ...cur, [key]: value };
      if (key === "area" && value.length)
        next.asset = cur.asset.filter((id) =>
          value.includes(options.data?.asset.find((a) => a.id === id)?.area),
        );
      return next;
    });
    setPage(1);
  };
  const reset = () => {
    setQ("");
    setF(BLANK);
    setPage(1);
  };
  const goTo = (n) => {
    setPage(n);
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <PageHead
        title="Production & rejection"
        icon={Factory}
        tone="pr"
        sub={
          data ? `${plural(data.all, "entry", "entries")} logged` : "Loading…"
        }
      >
        <div className="flex items-center gap-2.5">
          <ExportLink
            href={`/api/rejections/export?${query({ q: search, ...f })}`}
            label="Export Excel"
            Icon={FileSpreadsheet}
          />
          <Link href="/rejections/new" className={buttonVariants()}>
            Log entry
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
            Logged <b>{loggedPart}</b> on <b>{loggedId}</b> for{" "}
            {fmt.day(loggedDate)}.{" "}
            <Link
              href="/rejections/new"
              className={buttonVariants({ variant: "link", size: "inline" })}
            >
              Log another
            </Link>
          </p>
        )}
        {error && !data ? (
          <ErrorState title="Can’t load rejections">
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
            id="rej-h"
            title="Rejection log"
            className="scroll-mt-[88px]"
            ref={panelRef}
          >
            <FilterBar
              label="Filter rejections"
              q={q}
              onQ={(v) => {
                setQ(v);
                setPage(1);
              }}
              placeholder="Search part, machine, defect, person"
              count={
                data &&
                (filtered
                  ? `${data.total} of ${data.all} match`
                  : plural(data.all, "entry", "entries"))
              }
            >
              <FilterMenu
                fields={fields}
                value={f}
                onChange={onFilter}
                onClear={() => {
                  setF(BLANK);
                  setPage(1);
                }}
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
                      "w-full border-collapse text-[13.5px] tabular-nums [&_th]:sticky [&_th]:top-0 [&_th]:z-[1] [&_th]:bg-shell [&_th]:px-3 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-[12.5px] [&_th]:font-medium [&_th]:text-muted [&_th]:whitespace-nowrap [&_th:first-child]:rounded-l-sm [&_th:last-child]:rounded-r-sm [&_td]:px-3 [&_td]:py-3 [&_td]:border-b [&_td]:border-line [&_td]:align-top [&_tr:last-child>td]:border-b-0 min-w-[1020px]"
                    }
                  >
                    <thead>
                      <tr>
                        <th scope="col">When</th>
                        <th scope="col">Machine</th>
                        <th scope="col">Part</th>
                        <th
                          scope="col"
                          className={"text-right whitespace-nowrap"}
                        >
                          Produced
                        </th>
                        <th
                          scope="col"
                          className={"text-right whitespace-nowrap"}
                        >
                          Rejected
                        </th>
                        <th
                          scope="col"
                          className={"text-right whitespace-nowrap"}
                        >
                          Rate
                        </th>
                        <th scope="col">Defect</th>
                        <th scope="col">Disposition</th>
                        <th scope="col">Logged by</th>
                        <th scope="col">
                          <span className="sr-only">Edit</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((r, i) => (
                        <tr
                          key={`${r.id}|${r.date}|${i}`}
                          className={
                            !i && loggedId === r.id && loggedDate === r.date
                              ? "bg-brand-soft"
                              : "hover:bg-hover"
                          }
                        >
                          <td className="whitespace-nowrap">
                            <span className={"block font-medium"}>
                              {fmt.day(r.date)}
                            </span>
                            <span className={"block text-xs text-muted"}>
                              Shift {r.shift}
                            </span>
                          </td>
                          <td>
                            <span className={"block font-medium"}>
                              {r.name}
                            </span>
                            <span className={"block text-xs text-muted"}>
                              <span className={"font-mono text-[0.86em]"}>
                                {r.id}
                              </span>{" "}
                              · {r.area}
                            </span>
                          </td>
                          <td className="max-w-[260px]">
                            <span
                              className={"block font-medium truncate"}
                              title={r.part}
                            >
                              {r.part}
                            </span>
                          </td>
                          <td className={"text-right whitespace-nowrap"}>
                            {fmt.n(r.produced)}
                          </td>
                          <td
                            className={
                              "text-right whitespace-nowrap font-semibold"
                            }
                          >
                            {fmt.n(r.rejected)}
                          </td>
                          <td className={"text-right whitespace-nowrap"}>
                            {r.rate == null ? "—" : `${r.rate}%`}
                          </td>
                          <td>
                            {r.defect || <span className="text-muted">—</span>}
                          </td>
                          <td>
                            {r.disposition ? (
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full border text-xs font-semibold ${
                                  r.disposition === "Scrap"
                                    ? "border-danger-line bg-danger-bg text-danger-ink"
                                    : "border-chip-line bg-brand-soft text-accent"
                                }`}
                              >
                                {r.disposition}
                              </span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td className="text-[12.5px] text-muted whitespace-nowrap">
                            {r.entered_by || "—"}
                          </td>
                          <td className="text-right">
                            <Link
                              href={`/rejections/new?edit=${r.entry_id}`}
                              className="inline-grid place-items-center size-7 -my-1 rounded-sm text-muted hover:bg-brand-soft hover:text-accent"
                              aria-label={`Edit ${r.part} on ${fmt.day(r.date)}`}
                              title="Edit"
                            >
                              <Pencil
                                size={14}
                                strokeWidth={1.8}
                                aria-hidden="true"
                              />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pager
                  page={data.page}
                  pages={data.pages}
                  total={data.total}
                  size={data.page_size}
                  noun="entries"
                  onPage={goTo}
                  onSize={(n) => {
                    setSize(n);
                    setPage(1);
                  }}
                />
              </>
            ) : data.all ? (
              <div
                className={"grid justify-items-start gap-1.5 py-6 text-muted"}
              >
                <p>No rejections match these filters.</p>
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
            ) : (
              <div className="grid justify-items-start gap-3 py-10">
                <p className="text-[15px] font-semibold">
                  No entries logged yet
                </p>
                <p className="max-w-[52ch] text-[13px] text-muted">
                  Log production and rejected parts each shift to track
                  rejection by machine, shift and cause.
                </p>
                <Link href="/rejections/new" className={buttonVariants()}>
                  Log entry
                </Link>
              </div>
            )}
          </Card>
        )}
      </main>
    </>
  );
}
