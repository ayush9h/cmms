import { ArrowDown, ArrowUp } from "lucide-react";
import { useId } from "react";
import { fmt, plural } from "@/lib/format";
import { useCountUp } from "@/lib/hooks";

const KPIS = [
  {
    key: "downtime_h",
    label: "Downtime",
    unit: "h",
    digits: 1,
    better: -1,
    note: (k, total) => `${k.assets_hit} of ${plural(total, "asset")}`,
  },
  {
    key: "events",
    label: "Breakdowns",
    digits: 0,
    better: -1,
    note: () => "Logged in period",
  },
  {
    key: "mttr_min",
    label: "MTTR",
    unit: "min",
    digits: 0,
    better: -1,
    note: () => "Mean time to repair",
  },
  {
    key: "mtbf_h",
    label: "MTBF",
    unit: "h",
    digits: 1,
    better: 1,
    note: () => "Mean time between failures",
  },
];
const GRID = "grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3";
const HEAD = "flex items-center justify-between gap-2 min-h-8 px-2.5 pb-1.5";
const BODY = "rounded-xl border border-line bg-panel shadow-card p-4";
const TONE = { good: "text-good-ink", bad: "text-bad-ink", flat: "text-muted" };
const bone =
  "block h-3 my-1 rounded-md bg-[linear-gradient(90deg,var(--ground),var(--panel-2),var(--ground))] bg-[length:200%_100%] animate-shimmer";

export function KpiSkeleton() {
  return (
    <div className={GRID}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={
            "flex min-w-0 flex-col rounded-2xl border border-line bg-shell p-1.5"
          }
        >
          <div className={HEAD}>
            <span className={`${bone || ""} w-2/5`} />
          </div>
          <div className={`${BODY} flex-1`}>
            <span className={`${bone || ""} w-[55%] h-[30px] mb-3`} />
            <span className={`${bone || ""} w-[70%]`} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Kpis({ kpi, monthly, month, total }: any) {
  const current = new Date().toISOString().slice(0, 7);
  const ref = month
    ? month < current
      ? monthly.findIndex((m) => m.month === month)
      : -1
    : monthly.findLastIndex((m) => m.month < current && m.events);
  return (
    <div className={GRID}>
      {KPIS.map((k, i) => (
        <Kpi
          key={k.key}
          index={i}
          spec={k}
          value={kpi[k.key]}
          note={k.note(kpi, total)}
          monthly={monthly}
          refIndex={ref}
        />
      ))}
    </div>
  );
}

function Kpi({ index, spec, value, note, monthly, refIndex }: any) {
  const id = useId();
  const shown = useCountUp(value);
  const cur = monthly[refIndex]?.[spec.key];
  const prev = monthly[refIndex - 1]?.[spec.key];
  const change = cur != null && prev ? (cur - prev) / prev : null;
  const tone =
    change == null || Math.abs(change) < 0.005
      ? "flat"
      : Math.sign(change) === spec.better
        ? "good"
        : "bad";
  const Arrow = (change ?? 0) > 0 ? ArrowUp : ArrowDown;

  return (
    <div
      className={
        "flex min-w-0 flex-col rounded-2xl border border-line bg-shell p-1.5 animate-rise"
      }
      style={{ animationDelay: `${index * 40}ms` }}
      role="group"
      aria-labelledby={id}
    >
      <div className={HEAD}>
        <p id={id} className="text-[13px] font-medium text-ink-2">
          {spec.label}
        </p>
        <p className="hidden sm:block min-w-0 truncate text-xs text-muted">
          {note}
        </p>
      </div>
      <div
        className={`${BODY} grid min-w-0 flex-1 content-start grid-cols-[auto_minmax(0,1fr)] items-end gap-x-4 gap-y-2.5`}
      >
        <p className="whitespace-nowrap">
          <span className="text-[clamp(24px,2.2vw,30px)] font-semibold leading-[1.1] tracking-[-0.03em] tabular-nums">
            {shown == null ? "—" : fmt.n(Number(shown.toFixed(spec.digits)))}
          </span>
          {spec.unit && value != null && (
            <span className="ml-1 text-sm font-medium text-muted">
              {spec.unit}
            </span>
          )}
        </p>
        <Spark values={monthly.map((m) => m[spec.key])} at={refIndex} />
        <p className="col-span-2 flex items-center gap-1 text-[12.5px] text-muted tabular-nums">
          {change == null ? (
            "No earlier month to compare"
          ) : (
            <>
              <span
                className={`inline-flex items-center gap-0.5 font-semibold ${TONE[tone] || ""}`}
              >
                <Arrow size={13} strokeWidth={2} aria-hidden="true" />
                {Math.round(Math.abs(change) * 100)}%
              </span>
              {fmt.month(monthly[refIndex].month)} vs{" "}
              {fmt.month(monthly[refIndex - 1].month)}
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function Spark({ values, at }: any) {
  const id = `sg${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const pts = values.map((v, i) => [i, v]).filter(([, v]) => v != null);
  if (pts.length < 2) return null;
  const nums = pts.map(([, v]) => v);
  const lo = Math.min(...nums);
  const hi = Math.max(...nums);
  const x = (i) => (i / (values.length - 1)) * 100;
  const y = (v) => 26 - ((v - lo) / (hi - lo || 1)) * 22;
  const line = pts
    .map(([i, v], n) => `${n ? "L" : "M"}${x(i).toFixed(2)} ${y(v).toFixed(2)}`)
    .join("");
  const area = `${line}L${x(pts.at(-1)[0])} 30L${x(pts[0][0])} 30Z`;
  const dot = values[at] != null ? [x(at), y(values[at])] : null;

  return (
    <span
      className="relative hidden sm:block h-9 w-full max-w-[150px] justify-self-end"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 30"
        preserveAspectRatio="none"
        className="block size-full overflow-visible"
      >
        <defs>
          <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
            <stop
              offset="0"
              stopOpacity="0.22"
              className="[stop-color:var(--brand)]"
            />
            <stop
              offset="1"
              stopOpacity="0"
              className="[stop-color:var(--brand)]"
            />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${id})`} />
        <path
          d={line}
          className="fill-none stroke-brand stroke-[1.75]"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
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
