import { ArrowDown, ArrowUp } from "lucide-react";
import { useId } from "react";
import { fmt, plural, useCountUp } from "./lib";
import { cx, shimmer } from "./ui";

const KPIS = [
  { key: "downtime_h", label: "Downtime", unit: "h", digits: 1, better: -1, note: (k, total) => `${k.assets_hit} of ${plural(total, "asset")} affected` },
  { key: "events", label: "Breakdowns", digits: 0, better: -1, note: () => "Logged in the period" },
  { key: "mttr_min", label: "MTTR", unit: "min", digits: 0, better: -1, note: () => "Mean time to repair" },
  { key: "mtbf_h", label: "MTBF", unit: "h", digits: 1, better: 1, note: () => "Mean time between failures, 24 h run" },
];
const GRID = "grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mb-4";
const CARD = "grid grid-cols-[1fr_auto] items-center px-3.5 pt-3.5 pb-2.5 sm:px-5 sm:pt-[18px] sm:pb-3.5 rounded-xl border border-line bg-panel shadow-card animate-rise";
const TONE = { good: "bg-good-bg text-good-ink", bad: "bg-bad-bg text-bad-ink", flat: "bg-ground text-muted" };
const bone = cx("block h-3 my-1 rounded-md", shimmer);

export function KpiSkeleton() {
  return (
    <div className={GRID}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={cx(CARD, "block")}>
          <span className={cx(bone, "w-2/5")} />
          <span className={cx(bone, "w-[55%] h-[30px] my-2.5")} />
          <span className={cx(bone, "w-[70%]")} />
        </div>
      ))}
    </div>
  );
}

export function Kpis({ kpi, monthly, month, total }) {
  const current = new Date().toISOString().slice(0, 7);
  const ref = month ? (month < current ? monthly.findIndex((m) => m.month === month) : -1) : monthly.findLastIndex((m) => m.month < current && m.events);
  return (
    <dl className={GRID}>
      {KPIS.map((k, i) => (
        <Kpi key={k.key} index={i} spec={k} value={kpi[k.key]} note={k.note(kpi, total)} monthly={monthly} refIndex={ref} />
      ))}
    </dl>
  );
}

function Kpi({ index, spec, value, note, monthly, refIndex }) {
  const shown = useCountUp(value);
  const cur = monthly[refIndex]?.[spec.key];
  const prev = monthly[refIndex - 1]?.[spec.key];
  const change = cur != null && prev ? (cur - prev) / prev : null;
  const tone = change == null || Math.abs(change) < 0.005 ? "flat" : Math.sign(change) === spec.better ? "good" : "bad";
  const Arrow = change > 0 ? ArrowUp : ArrowDown;

  return (
    <div className={CARD} style={{ animationDelay: `${index * 40}ms` }}>
      <dt className="text-[13px] font-semibold text-ink-2">{spec.label}</dt>
      <dd className="col-span-2 mt-1.5">
        <span className="text-[clamp(26px,2.3vw,32px)] font-[650] leading-[1.1] tracking-[-0.03em] tabular-nums">{shown == null ? "—" : fmt.n(Number(shown.toFixed(spec.digits)))}</span>
        {spec.unit && value != null && <span className="ml-1 text-sm font-medium text-muted">{spec.unit}</span>}
      </dd>
      {change != null && (
        <dd className={cx("col-start-2 row-start-1 justify-self-end inline-flex items-center gap-1 pl-1.5 pr-2 py-0.5 rounded-full text-xs font-[650] whitespace-nowrap", TONE[tone])}>
          <Arrow size={12} strokeWidth={2} aria-hidden="true" />
          <span>
            {Math.round(Math.abs(change) * 100)}%
            <span className="hidden sm:inline font-medium opacity-80"> {fmt.month(monthly[refIndex].month)} vs {fmt.month(monthly[refIndex - 1].month)}</span>
          </span>
        </dd>
      )}
      <dd className="col-span-2 mt-0.5 text-[12.5px] text-muted">{note}</dd>
      <dd className="col-span-2 mt-3">
        <Spark values={monthly.map((m) => m[spec.key])} at={refIndex} />
      </dd>
    </div>
  );
}

function Spark({ values, at }) {
  const id = `sg${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const pts = values.map((v, i) => [i, v]).filter(([, v]) => v != null);
  if (pts.length < 2) return null;
  const nums = pts.map(([, v]) => v);
  const lo = Math.min(...nums);
  const hi = Math.max(...nums);
  const x = (i) => (i / (values.length - 1)) * 100;
  const y = (v) => 26 - ((v - lo) / (hi - lo || 1)) * 22;
  const line = pts.map(([i, v], n) => `${n ? "L" : "M"}${x(i).toFixed(2)} ${y(v).toFixed(2)}`).join("");
  const area = `${line}L${x(pts.at(-1)[0])} 30L${x(pts[0][0])} 30Z`;
  const dot = values[at] != null ? [x(at), y(values[at])] : null;

  return (
    <span className="relative block h-9" aria-hidden="true">
      <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="block size-full overflow-visible">
        <defs>
          <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopOpacity="0.22" className="[stop-color:var(--brand)]" />
            <stop offset="1" stopOpacity="0" className="[stop-color:var(--brand)]" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${id})`} />
        <path d={line} className="fill-none stroke-brand stroke-[1.75]" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      {dot && (
        <i
          className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand bg-panel shadow-[0_0_0_3px_var(--halo)]"
          style={{ left: `${dot[0]}%`, top: `${(dot[1] / 30) * 100}%` }}
        />
      )}
    </span>
  );
}
