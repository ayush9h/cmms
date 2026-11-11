import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS, Tip } from "@/components/dashboard/charts";
import { METRICS, pct } from "./metrics";

export function OeeChart({ rows, xKey, tick, title, selected, onPick }) {
  return (
    <div className="chart w-full tabular-nums">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={rows}
          margin={{ top: 8, right: 4, bottom: 0, left: -8 }}
          barGap={2}
          barCategoryGap="22%"
        >
          <CartesianGrid vertical={false} strokeDasharray="3 4" />
          <XAxis
            dataKey={xKey}
            tickFormatter={tick}
            {...AXIS}
            interval="preserveStartEnd"
            minTickGap={2}
          />
          <YAxis
            {...AXIS}
            width={48}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            cursor={{ radius: 6 }}
            content={
              <Tip
                render={(r) => (
                  <>
                    <b>{title(r[xKey])}</b>
                    {METRICS.map((m) => (
                      <span key={m.key} className="flex items-center gap-2">
                        <i
                          className="size-2 rounded-[2px]"
                          style={{ background: m.color }}
                        />
                        <span className="flex-1">{m.label}</span>
                        <span className="pl-3 font-semibold">
                          {pct(r[m.key])}
                        </span>
                      </span>
                    ))}
                  </>
                )}
              />
            }
          />
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
              onClick={(b) => onPick((b.payload ?? b)[xKey])}
            >
              {rows.map((r) => (
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
