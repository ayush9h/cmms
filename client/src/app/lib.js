import { useEffect, useRef, useState } from "react";

export const PHASES = [
  { key: "diagnose", label: "Diagnosis", short: "Diagnosis", color: "var(--ph-diagnose)", cls: "fill-ph-diagnose" },
  { key: "spares", label: "Spares arrangement", short: "Spares wait", color: "var(--ph-spares)", cls: "fill-ph-spares" },
  { key: "wrench", label: "Wrench time", short: "Wrench time", color: "var(--ph-wrench)", cls: "fill-ph-wrench" },
];

const CAT_FILLS = ["fill-cat-1", "fill-cat-2", "fill-cat-3", "fill-cat-4", "fill-cat-5", "fill-cat-6"];

export const categorySlot = (i) => ({ color: `var(--cat-${(i % 6) + 1})`, cls: CAT_FILLS[i % 6] });

const monthFmt = new Intl.DateTimeFormat("en-IN", { month: "short", timeZone: "UTC" });
const monthLong = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
const dayFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const num = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });

export const fmt = {
  n: (v) => (v == null ? "—" : num.format(v)),
  month: (ym) => monthFmt.format(new Date(`${ym}-01`)),
  monthLong: (ym) => monthLong.format(new Date(`${ym}-01`)),
  day: (d) => (d ? dayFmt.format(new Date(d)) : "—"),
  mins: (m) => (m == null ? "—" : m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")} m` : `${m} m`),
};

export const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;

export function pct(v, total) {
  return total ? Math.round((v / total) * 100) : 0;
}

const FIELD = { asset_id: "Asset", start: "Start time", installed: "Installation date", cls: "Class", oem: "OEM" };

function detail(d, status) {
  if (typeof d === "string") return d;
  if (Array.isArray(d)) {
    return d
      .map((e) => {
        const key = e.loc?.at(-1);
        const msg = String(e.msg ?? "").replace(/^Value error, /, "");
        return typeof key === "string" && key !== "body" ? `${FIELD[key] ?? key[0].toUpperCase() + key.slice(1)}: ${msg}` : msg;
      })
      .join(" ");
  }
  return `Server answered ${status}`;
}

export async function getJson(url, init) {
  const r = await fetch(url, init);
  const body = await r.json().catch(() => null);
  if (r.status === 401 && !url.startsWith("/api/auth/login")) window.dispatchEvent(new Event("cmms:unauthorized"));
  if (!r.ok) {
    const err = new Error(detail(body?.detail, r.status));
    err.status = r.status;
    throw err;
  }
  return body;
}

export const postJson = (url, data) => getJson(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });

export function useJson(url, nonce = 0) {
  const [state, setState] = useState({ data: null, error: null, busy: true });
  useEffect(() => {
    const ctl = new AbortController();
    setState((s) => ({ ...s, busy: true }));
    getJson(url, { signal: ctl.signal })
      .then((data) => setState({ data, error: null, busy: false }))
      .catch((error) => !ctl.signal.aborted && setState((s) => ({ ...s, error, busy: false })));
    return () => ctl.abort();
  }, [url, nonce]);
  return state;
}

export function useCountUp(target, ms = 700) {
  const [value, setValue] = useState(0);
  const shown = useRef(0);
  useEffect(() => {
    if (target == null) return setValue(null);
    const from = Number.isFinite(shown.current) ? shown.current : 0;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || from === target) {
      shown.current = target;
      return setValue(target);
    }
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const k = Math.min(1, (now - start) / ms);
      shown.current = from + (target - from) * (1 - (1 - k) ** 3);
      setValue(shown.current);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}

export function useDebounced(value, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export const query = (params) =>
  new URLSearchParams(Object.entries(params).flatMap(([k, v]) => [v].flat().filter((x) => x !== "" && x != null).map((x) => [k, x]))).toString();
