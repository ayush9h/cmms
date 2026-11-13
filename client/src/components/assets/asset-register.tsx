"use client";

import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { useReducer, useRef } from "react";
import { useAuth } from "@/auth/provider";
import { fmt, plural } from "@/lib/format";
import { query } from "@/lib/api";
import { useDebounced, useJson } from "@/lib/hooks";
import {
  Card,
  ErrorState,
  FilterBar,
  FilterMenu,
  PageHead,
  Pager,
} from "@/components/ui";

const list = (values = []) => values.map((v) => ({ value: v, label: v }));

const INITIAL = {
  nonce: 0,
  q: "",
  area: [] as string[],
  cls: [] as string[],
  page: 1,
  size: 25,
};

// anything that narrows the result set sends you back to page 1
function reducer(state: typeof INITIAL, action: any): typeof INITIAL {
  switch (action.type) {
    case "q":
      return { ...state, q: action.value, page: 1 };
    case "filter":
      return { ...state, [action.key]: action.value, page: 1 };
    case "size":
      return { ...state, size: action.value, page: 1 };
    case "clearFilters":
      return { ...state, area: [], cls: [], page: 1 };
    case "reset":
      return { ...state, q: "", area: [], cls: [], page: 1 };
    case "page":
      return { ...state, page: action.value };
    case "retry":
      return { ...state, nonce: state.nonce + 1 };
    default:
      return state;
  }
}

export function AssetRegister({ created, updated }: any) {
  const { isManager } = useAuth();
  const panel = useRef<any>(null);
  const [{ nonce, q, area, cls, page, size }, dispatch] = useReducer(
    reducer,
    INITIAL,
  );
  const search = useDebounced(q.trim());
  const options = useJson("/api/options");
  const { data, error, busy } = useJson(
    `/api/assets?${query({ q: search, area, cls, page, page_size: size })}`,
    nonce,
  );
  const filtered = Boolean(search || area.length || cls.length);
  const flagged = updated || created;
  const fields = [
    {
      key: "area",
      label: "Shop",
      multi: true,
      placeholder: "Select shops",
      options: options.data && list(options.data.area),
    },
    {
      key: "cls",
      label: "Class",
      multi: true,
      placeholder: "Select classes",
      options: options.data && list(options.data.cls),
    },
  ];

  const goTo = (n: any) => {
    dispatch({ type: "page", value: n });
    panel.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <PageHead
        title="Asset register"
        sub={
          data && options.data
            ? `${plural(data.all, "asset")} across ${plural(options.data.area.length, "shop")}`
            : "Loading…"
        }
      >
        {isManager && (
          <Link href="/assets/new" className={buttonVariants()}>
            New asset
          </Link>
        )}
      </PageHead>
      <main
        className={"px-[clamp(16px,2.5vw,28px)] pt-2 pb-10 transition-opacity"}
      >
        {flagged && (
          <p
            className={
              "mb-4 px-3.5 py-2.5 rounded-sm border border-ok-line bg-ok-bg text-ok-ink"
            }
            role="status"
          >
            <b>{flagged}</b>{" "}
            {updated
              ? "was updated in the asset register."
              : "was added to the asset register."}
          </p>
        )}
        {error && !data ? (
          <ErrorState title="Can’t load the asset register">
            <p>{error.message}</p>
            <button
              type="button"
              className={buttonVariants()}
              onClick={() => dispatch({ type: "retry" })}
            >
              Retry
            </button>
          </ErrorState>
        ) : (
          <Card
            id="reg-h"
            title="All assets"
            className="scroll-mt-[88px]"
            ref={panel}
          >
            <FilterBar
              label="Filter assets"
              q={q}
              onQ={(value: any) => dispatch({ type: "q", value })}
              placeholder="Search ID, name, OEM, application"
              count={
                data &&
                (filtered
                  ? `${data.total} of ${data.all} match`
                  : plural(data.all, "asset"))
              }
            >
              <FilterMenu
                fields={fields}
                value={{ area, cls }}
                onChange={(key: any, value: any) =>
                  dispatch({ type: "filter", key, value })
                }
                onClear={() => dispatch({ type: "clearFilters" })}
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
                      "w-full border-collapse text-[13.5px] tabular-nums [&_th]:sticky [&_th]:top-0 [&_th]:z-[1] [&_th]:bg-shell [&_th]:px-3 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-[12.5px] [&_th]:font-medium [&_th]:text-muted [&_th]:whitespace-nowrap [&_th:first-child]:rounded-l-sm [&_th:last-child]:rounded-r-sm [&_td]:px-3 [&_td]:py-3 [&_td]:border-b [&_td]:border-line [&_td]:align-top [&_tr:last-child>td]:border-b-0"
                    }
                  >
                    <thead>
                      <tr>
                        <th scope="col">Asset ID</th>
                        <th scope="col">Asset name</th>
                        <th scope="col">Shop</th>
                        <th scope="col">Class</th>
                        <th scope="col">OEM</th>
                        <th scope="col">Installed</th>
                        <th
                          scope="col"
                          className={"text-right whitespace-nowrap"}
                        >
                          Breakdowns
                        </th>
                        <th
                          scope="col"
                          className={"text-right whitespace-nowrap"}
                        >
                          Downtime
                        </th>
                        <th scope="col">Last breakdown</th>
                        {isManager && (
                          <th scope="col">
                            <span className="sr-only">Actions</span>
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((a: any) => (
                        <tr
                          key={a.id}
                          className={
                            a.id === flagged
                              ? "bg-brand-soft"
                              : "hover:bg-hover"
                          }
                        >
                          <td
                            className={
                              "font-mono text-[0.86em] whitespace-nowrap"
                            }
                          >
                            {a.id}
                          </td>
                          <td>
                            <span className={"block font-medium"}>
                              {a.name}
                            </span>
                            <span className={"block text-xs text-muted"}>
                              {a.application}
                            </span>
                          </td>
                          <td className="whitespace-nowrap">{a.area}</td>
                          <td>{a.cls}</td>
                          <td>{a.oem}</td>
                          <td className="whitespace-nowrap">
                            {fmt.day(a.installed)}
                            <span className={"block text-xs text-muted"}>
                              {fmt.n(a.age)} yr
                            </span>
                          </td>
                          <td className={"text-right whitespace-nowrap"}>
                            {a.events}
                          </td>
                          <td className={"text-right whitespace-nowrap"}>
                            {fmt.n(a.downtime_h)} h
                          </td>
                          <td className="whitespace-nowrap">
                            {fmt.day(a.last_bd)}
                          </td>
                          {isManager && (
                            <td className="whitespace-nowrap">
                              <Link
                                href={`/assets/${encodeURIComponent(a.id)}/edit`}
                                className={buttonVariants({
                                  variant: "link",
                                  size: "inline",
                                })}
                                aria-label={`Edit ${a.id}`}
                              >
                                Edit
                              </Link>
                            </td>
                          )}
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
                  noun="assets"
                  onPage={goTo}
                  onSize={(value: any) => dispatch({ type: "size", value })}
                />
              </>
            ) : (
              <div
                className={"grid justify-items-start gap-1.5 py-6 text-muted"}
              >
                <p>No assets match these filters.</p>
                <button
                  type="button"
                  className={buttonVariants({
                    variant: "link",
                    size: "inline",
                  })}
                  onClick={() => dispatch({ type: "reset" })}
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
