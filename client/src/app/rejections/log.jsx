"use client";

import { Factory, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { FilterBar, FilterMenu } from "../filters";
import { fmt, plural, query, useDebounced, useJson } from "../lib";
import { Pager } from "../pager";
import { ErrorState, ExportLink, PageHead, bannerOk, btn, cellMain, cellSub, cx, empty, link, mono, pageMain, panel, skeleton, table } from "../ui";

const list = (values = []) => values.map((v) => ({ value: v, label: v }));
const BLANK = { area: [], asset: [], defect: [], disposition: [] };

export function RejectionLog({ logged }) {
  const panelRef = useRef(null);
  const [nonce, setNonce] = useState(0);
  const [q, setQ] = useState("");
  const [f, setF] = useState(BLANK);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(25);
  const search = useDebounced(q.trim());
  const options = useJson("/api/options");
  const { data, error, busy } = useJson(`/api/rejections?${query({ q: search, ...f, page, page_size: size })}`, nonce);
  const filtered = Boolean(search || Object.values(f).some((v) => v.length));
  const ready = Boolean(options.data);
  const machines = (options.data?.asset ?? []).filter((a) => !f.area.length || f.area.includes(a.area));
  const fields = [
    { key: "area", label: "Shop", multi: true, placeholder: "Select shops", options: ready && list(options.data.area) },
    { key: "asset", label: "Machine", multi: true, placeholder: "Select machines", options: ready && machines.map((a) => ({ value: a.id, label: `${a.id} · ${a.name}` })) },
    { key: "defect", label: "Defect", multi: true, placeholder: "Select defects", options: ready && list(options.data.defect) },
    { key: "disposition", label: "Disposition", multi: true, placeholder: "Scrap or rework", options: ready && list(options.data.disposition) },
  ];
  const [loggedId, loggedDate, loggedPart] = logged?.split("|") ?? [];

  const onFilter = (key, value) => {
    setF((cur) => {
      const next = { ...cur, [key]: value };
      if (key === "area" && value.length) next.asset = cur.asset.filter((id) => value.includes(options.data?.asset.find((a) => a.id === id)?.area));
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
      <PageHead title="Production & rejection" icon={Factory} tone="pr" sub={data ? `${plural(data.all, "entry", "entries")} logged` : "Loading…"}>
        <div className="flex items-center gap-2.5">
          <ExportLink href={`/api/rejections/export?${query({ q: search, ...f })}`} label="Export Excel" Icon={FileSpreadsheet} />
          <Link href="/rejections/new" className={btn}>Log entry</Link>
        </div>
      </PageHead>
      <main className={pageMain}>
        {loggedId && (
          <p className={bannerOk} role="status">
            Logged <b>{loggedPart}</b> on <b>{loggedId}</b> for {fmt.day(loggedDate)}. <Link href="/rejections/new" className={link}>Log another</Link>
          </p>
        )}
        {error && !data ? (
          <ErrorState title="Can’t load rejections">
            <p>{error.message}</p>
            <button type="button" className={btn} onClick={() => setNonce((n) => n + 1)}>Retry</button>
          </ErrorState>
        ) : (
          <section className={cx(panel, "scroll-mt-[88px]")} ref={panelRef} aria-labelledby="rej-h">
            <h2 id="rej-h" className="sr-only">Rejection log</h2>
            <FilterBar
              label="Filter rejections"
              q={q}
              onQ={(v) => { setQ(v); setPage(1); }}
              placeholder="Search part, machine, defect, person"
              count={data && (filtered ? `${data.total} of ${data.all} match` : plural(data.all, "entry", "entries"))}
            >
              <FilterMenu fields={fields} value={f} onChange={onFilter} onClear={() => { setF(BLANK); setPage(1); }} />
            </FilterBar>
            {!data ? (
              <div className={skeleton} />
            ) : data.items.length ? (
              <>
                <div className={cx("overflow-x-auto transition-opacity", busy && "opacity-55")} aria-busy={busy}>
                  <table className={cx(table, "min-w-[760px]")}>
                    <thead>
                      <tr>
                        <th scope="col">When</th>
                        <th scope="col">Machine</th>
                        <th scope="col">Part</th>
                        <th scope="col">Defect</th>
                        <th scope="col">Disposition</th>
                        <th scope="col">Logged by</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((r, i) => (
                        <tr key={`${r.id}|${r.date}|${i}`} className={!i && loggedId === r.id && loggedDate === r.date ? "bg-brand-soft" : "hover:bg-hover"}>
                          <td className="whitespace-nowrap"><span className={cellMain}>{fmt.day(r.date)}</span><span className={cellSub}>Shift {r.shift}</span></td>
                          <td><span className={cellMain}>{r.name}</span><span className={cellSub}><span className={mono}>{r.id}</span> · {r.area}</span></td>
                          <td className="max-w-[260px]"><span className={cx(cellMain, "truncate")} title={r.part}>{r.part}</span></td>
                          <td>{r.defect}</td>
                          <td>
                            <span className={cx("inline-block px-2 py-0.5 rounded-full border text-xs font-semibold", r.disposition === "Scrap" ? "border-danger-line bg-danger-bg text-danger-ink" : "border-chip-line bg-brand-soft text-accent")}>{r.disposition}</span>
                          </td>
                          <td className="text-[12.5px] text-muted whitespace-nowrap">{r.entered_by || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pager page={data.page} pages={data.pages} total={data.total} size={data.page_size} noun="entries" onPage={goTo} onSize={(n) => { setSize(n); setPage(1); }} />
              </>
            ) : data.all ? (
              <div className={empty}>
                <p>No rejections match these filters.</p>
                <button type="button" className={link} onClick={reset}>Clear filters</button>
              </div>
            ) : (
              <div className="grid justify-items-start gap-3 py-10">
                <p className="text-[15px] font-semibold">No entries logged yet</p>
                <p className="max-w-[52ch] text-[13px] text-muted">Log rejected parts after each inspection to track scrap and rework by machine, shift and defect.</p>
                <Link href="/rejections/new" className={btn}>Log entry</Link>
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}
