import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PHASES, categorySlot } from "@/lib/constants";
import { fmt, pct, plural } from "@/lib/format";
import { Card, cx, empty } from "@/components/ui";

export const AXIS = {
  tickLine: false,
  axisLine: false,
  tick: { fontSize: 12 },
};
const EMPTY = <p className={empty}>No breakdowns match these filters.</p>;
const hrs = (minutes) => `${fmt.n(Math.round(minutes / 6) / 10)} h`;

export function Tip({ active, payload, render }) {
  return active && payload?.length ? (
    <div className="grid gap-0.5 px-2.5 py-2 rounded-[5px] bg-tip-bg text-tip-ink text-[12.5px] leading-[1.35] tabular-nums shadow-pop [&_b]:font-semibold">
      {render(payload[0].payload)}
    </div>
  ) : null;
}

export function MonthChart({ rows, selected, onPick }) {
  const peak = rows.reduce(
    (a, b) => (b.downtime_h > a.downtime_h ? b : a),
    rows[0],
  );
  const total = rows.reduce((s, r) => s + r.downtime_h, 0);
  const events = rows.reduce((s, r) => s + r.events, 0);
  return (
    <Card
      id="month-h"
      title="Downtime by month"
      className="h-full"
      meta={
        peak?.downtime_h > 0 && (
          <>
            Peak <b>{fmt.month(peak.month)}</b> · {fmt.n(peak.downtime_h)} h
          </>
        )
      }
    >
      <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 mb-4">
        <b className="text-[22px] font-semibold leading-[1.2] tracking-[-0.02em] tabular-nums">
          {fmt.n(total)} h
        </b>
        <span className="text-[13px] text-muted">
          lost across {plural(events, "breakdown")}. Select a bar to focus on
          that month.
        </span>
      </p>
      <div className="chart w-full tabular-nums">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={rows}
            margin={{ top: 8, right: 4, bottom: 0, left: -12 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 4" />
            <XAxis
              dataKey="month"
              tickFormatter={fmt.month}
              {...AXIS}
              interval="preserveStartEnd"
              minTickGap={2}
            />
            <YAxis {...AXIS} width={44} />
            <Tooltip
              cursor={{ radius: 6 }}
              content={
                <Tip
                  render={(r) => (
                    <>
                      <b>{fmt.monthLong(r.month)}</b>
                      {fmt.n(r.downtime_h)} h · {plural(r.events, "breakdown")}
                    </>
                  )}
                />
              }
            />
            <Bar
              dataKey="downtime_h"
              name="Downtime"
              radius={[6, 6, 2, 2]}
              maxBarSize={40}
              className="is-link"
              onClick={(b) => onPick((b.payload ?? b).month)}
            >
              {rows.map((r) => (
                <Cell
                  key={r.month}
                  className={selected === r.month ? "fill-bar-on" : "fill-bar"}
                  fillOpacity={selected && selected !== r.month ? 0.3 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function PieBlock({
  id,
  title,
  sub,
  slices,
  selected = [],
  onPick,
  unit,
  caption,
}) {
  const dim = (name) => selected.length > 0 && !selected.includes(name);
  const total = slices.reduce((s, x) => s + x.value, 0);
  const top = slices.reduce((a, b) => (b.value > a.value ? b : a), slices[0]);
  const row =
    "grid grid-cols-[12px_1fr_auto_40px] items-center gap-2.5 w-full min-h-9 px-2 rounded text-left text-sm";
  return (
    <Card
      id={id}
      title={title}
      className="h-full"
      meta={
        total > 0 && (
          <>
            Largest <b>{top.name}</b> · {pct(top.value, total)}%
          </>
        )
      }
    >
      <p className="mb-3 text-[13px] text-muted">{sub}</p>
      {total ? (
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(180px,1fr)_minmax(0,1.1fr)] items-center gap-4">
          <div className="chart relative tabular-nums">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Tooltip
                  content={
                    <Tip
                      render={(s) => (
                        <>
                          <b>{s.name}</b>
                          {unit(s.value)} · {pct(s.value, total)}%
                        </>
                      )}
                    />
                  }
                />
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="64%"
                  outerRadius="94%"
                  paddingAngle={1.5}
                  cornerRadius={4}
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                  className={onPick ? "is-link" : undefined}
                  onClick={onPick && ((s) => onPick((s.payload ?? s).name))}
                >
                  {slices.map((s) => (
                    <Cell
                      key={s.name}
                      className={s.cls}
                      fillOpacity={dim(s.name) ? 0.3 : 1}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div
              className="absolute inset-0 grid place-content-center text-center pointer-events-none"
              aria-hidden="true"
            >
              <b className="text-xl font-[650] tracking-[-0.02em]">
                {unit(total)}
              </b>
              <span className="text-xs text-muted">{caption}</span>
            </div>
          </div>
          <ul className="grid gap-0.5 tabular-nums">
            {slices.map((s) => {
              const body = (
                <>
                  <i
                    className="size-3 rounded-[3px]"
                    style={{ background: s.color }}
                  />
                  <span className="font-medium">{s.name}</span>
                  <span className="text-[13px] text-muted">
                    {unit(s.value)}
                  </span>
                  <b className="text-right font-semibold">
                    {pct(s.value, total)}%
                  </b>
                </>
              );
              return (
                <li key={s.name} className={cx(dim(s.name) && "opacity-45")}>
                  {onPick ? (
                    <button
                      type="button"
                      aria-pressed={selected.includes(s.name)}
                      onClick={() => onPick(s.name)}
                      className={cx(
                        row,
                        "hover:bg-brand-soft aria-pressed:bg-brand-soft",
                      )}
                    >
                      {body}
                    </button>
                  ) : (
                    <span className={row}>{body}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        EMPTY
      )}
    </Card>
  );
}

export function CategoryPie({ rows, order, selected, onPick }) {
  const by = Object.fromEntries(rows.map((r) => [r.name, r.minutes]));
  const slices = order
    .map((name, i) => ({ name, value: by[name] ?? 0, ...categorySlot(i) }))
    .filter((s) => s.value);
  return (
    <PieBlock
      id="cat-h"
      title="Downtime by BD category"
      sub="Share of hours lost. Select a slice to filter."
      slices={slices}
      selected={selected}
      onPick={onPick}
      unit={hrs}
      caption="downtime"
    />
  );
}

export function PhasePie({ phases }) {
  const slices = PHASES.map((p) => ({
    name: p.label,
    value: phases[p.key],
    color: p.color,
    cls: p.cls,
  }));
  return (
    <PieBlock
      id="phase-h"
      title="Where repair time goes"
      sub="Diagnosis, waiting for spares, and hands-on repair."
      slices={slices}
      unit={hrs}
      caption="repair time"
    />
  );
}
