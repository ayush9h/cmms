import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS, Tip } from "@/components/dashboard/charts";
import { METRICS, pct } from "./metrics";

// 4 metrics x 31 days as grouped bars is 124 bars: unreadable. A trend over time
// wants lines. Shift (A/B/C) is not a continuum and a handful of months still
// compares better as bars, so those keep the bar form.
const asTrend = (xKey: string, rows: any[]) =>
  xKey !== "shift" && rows.length > 6;

export function OeeChart({ rows, xKey, tick, title, selected, onPick }: any) {
  const trend = asTrend(xKey, rows);

  const tooltip = (
    <Tooltip
      cursor={
        trend ? { stroke: "var(--line-strong)", strokeWidth: 1 } : { radius: 6 }
      }
      content={
        <Tip
          render={(r: any) => (
            <>
              <b>{title(r[xKey])}</b>
              {METRICS.map((m) => (
                <span key={m.key} className="flex items-center gap-2">
                  <i
                    className="size-2 shrink-0 rounded-[2px] ring-1 ring-line"
                    style={{ background: m.color }}
                  />
                  <span className="flex-1">{m.label}</span>
                  <span className="pl-3 font-semibold">{pct(r[m.key])}</span>
                </span>
              ))}
            </>
          )}
        />
      }
    />
  );

  const axes = (
    <>
      {/* solid hairline: dashed grid reads as data */}
      <CartesianGrid vertical={false} stroke="var(--line)" />
      <XAxis
        dataKey={xKey}
        tickFormatter={tick}
        {...AXIS}
        interval="preserveStartEnd"
        minTickGap={trend ? 24 : 2}
      />
      <YAxis
        {...AXIS}
        width={48}
        domain={[0, 100]}
        ticks={[0, 25, 50, 75, 100]}
        tickFormatter={(v: any) => `${v}%`}
      />
    </>
  );

  if (trend)
    return (
      <div className="chart w-full tabular-nums">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart
            data={rows}
            margin={{ top: 8, right: 12, bottom: 0, left: -8 }}
            onClick={(s: any) =>
              s?.activeLabel != null && onPick(s.activeLabel)
            }
            className="is-link"
          >
            {axes}
            {tooltip}
            {selected != null && (
              <ReferenceLine
                x={selected}
                stroke="var(--line-strong)"
                strokeWidth={1}
              />
            )}
            {METRICS.map((m) => (
              <Line
                key={m.key}
                type="monotone"
                dataKey={m.key}
                name={m.label}
                stroke={m.color}
                // OEE is the composite headline, not a peer series: carry it heavier
                strokeWidth={m.key === "oee" ? 2.5 : 2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--panel)" }}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );

  return (
    <div className="chart w-full tabular-nums">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={rows}
          margin={{ top: 8, right: 4, bottom: 0, left: -8 }}
          barGap={2}
          barCategoryGap="22%"
        >
          {axes}
          {tooltip}
          {METRICS.map((m) => (
            <Bar
              key={m.key}
              dataKey={m.key}
              name={m.label}
              fill={m.color}
              radius={[3, 3, 1, 1]}
              maxBarSize={14}
              isAnimationActive={false}
              className="is-link"
              onClick={(b: any) => onPick((b.payload ?? b)[xKey])}
            >
              {rows.map((r: any) => (
                <Cell
                  key={r[xKey]}
                  fillOpacity={
                    selected != null && r[xKey] !== selected ? 0.3 : 1
                  }
                />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
