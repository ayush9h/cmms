"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useAuth } from "../auth";
import { fmt, plural, query, useDebounced, useJson } from "../lib";
import { FilterBar, FilterMenu } from "../filters";
import { Pager } from "../pager";
import { ErrorState, PageHead, bannerOk, btn, cellMain, cellSub, cx, empty, link, mono, num, pageMain, panel, skeleton, table } from "../ui";

const list = (values = []) => values.map((v) => ({ value: v, label: v }));

export function Register({ created }) {
  const { isManager } = useAuth();
  const panel = useRef(null);
  const [nonce, setNonce] = useState(0);
  const [q, setQ] = useState("");
  const [area, setArea] = useState([]);
  const [cls, setCls] = useState([]);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(25);
  const search = useDebounced(q.trim());
  const options = useJson("/api/options");
  const { data, error, busy } = useJson(`/api/assets?${query({ q: search, area, cls, page, page_size: size })}`, nonce);
  const filtered = Boolean(search || area.length || cls.length);
  const fields = [
    { key: "area", label: "Shop", multi: true, placeholder: "Select shops", options: options.data && list(options.data.area) },
    { key: "cls", label: "Class", multi: true, placeholder: "Select classes", options: options.data && list(options.data.cls) },
  ];

  const change = (setter) => (value) => {
    setter(value);
    setPage(1);
  };
  const goTo = (n) => {
    setPage(n);
    panel.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const clearFilters = () => {
    setArea([]);
    setCls([]);
    setPage(1);
  };
  const reset = () => {
    setQ("");
    clearFilters();
  };

  return (
    <>
      <PageHead title="Asset register" sub={data && options.data ? `${plural(data.all, "asset")} across ${plural(options.data.area.length, "shop")}` : "Loading…"}>
        {isManager && <Link href="/assets/new" className={btn}>New asset</Link>}
      </PageHead>
      <main className={pageMain}>
        {created && (
          <p className={bannerOk} role="status">
            <b>{created}</b> was added to the asset register.
          </p>
        )}
        {error && !data ? (
          <ErrorState title="Can’t load the asset register">
            <p>{error.message}</p>
            <button type="button" className={btn} onClick={() => setNonce((n) => n + 1)}>Retry</button>
          </ErrorState>
        ) : (
          <section className={cx(panel, "scroll-mt-[88px]")} ref={panel} aria-labelledby="reg-h">
            <h2 id="reg-h" className="sr-only">All assets</h2>
            <FilterBar
              label="Filter assets"
              q={q}
              onQ={change(setQ)}
              placeholder="Search ID, name, OEM, application"
              count={data && (filtered ? `${data.total} of ${data.all} match` : plural(data.all, "asset"))}
            >
              <FilterMenu fields={fields} value={{ area, cls }} onChange={(key, v) => change(key === "area" ? setArea : setCls)(v)} onClear={clearFilters} />
            </FilterBar>
            {!data ? (
              <div className={skeleton} />
            ) : data.items.length ? (
              <>
                <div className={cx("overflow-x-auto transition-opacity", busy && "opacity-55")} aria-busy={busy}>
                  <table className={table}>
                    <thead>
                      <tr>
                        <th scope="col">Asset ID</th>
                        <th scope="col">Asset name</th>
                        <th scope="col">Shop</th>
                        <th scope="col">Class</th>
                        <th scope="col">OEM</th>
                        <th scope="col">Installed</th>
                        <th scope="col" className={num}>Breakdowns</th>
                        <th scope="col" className={num}>Downtime</th>
                        <th scope="col">Last breakdown</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((a) => (
                        <tr key={a.id} className={a.id === created ? "bg-brand-soft" : "hover:bg-hover"}>
                          <td className={cx(mono, "whitespace-nowrap")}>{a.id}</td>
                          <td><span className={cellMain}>{a.name}</span><span className={cellSub}>{a.application}</span></td>
                          <td>{a.area}</td>
                          <td>{a.cls}</td>
                          <td>{a.oem}</td>
                          <td>{fmt.day(a.installed)}<span className={cellSub}>{fmt.n(a.age)} yr</span></td>
                          <td className={num}>{a.events}</td>
                          <td className={num}>{fmt.n(a.downtime_h)} h</td>
                          <td>{fmt.day(a.last_bd)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pager page={data.page} pages={data.pages} total={data.total} size={data.page_size} noun="assets" onPage={goTo} onSize={change(setSize)} />
              </>
            ) : (
              <div className={empty}>
                <p>No assets match these filters.</p>
                <button type="button" className={link} onClick={reset}>Clear filters</button>
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}
