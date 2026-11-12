const monthFmt = new Intl.DateTimeFormat("en-IN", {
  month: "short",
  timeZone: "UTC",
});
const monthLong = new Intl.DateTimeFormat("en-IN", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const dayFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const num = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });

export const fmt = {
  n: (v) => (v == null ? "—" : num.format(v)),
  month: (ym) => monthFmt.format(new Date(`${ym}-01`)),
  monthLong: (ym) => monthLong.format(new Date(`${ym}-01`)),
  day: (d) => (d ? dayFmt.format(new Date(d)) : "—"),
  mins: (m) =>
    m == null
      ? "—"
      : m >= 60
        ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")} m`
        : `${m} m`,
};

export const plural = (n, word, many = `${word}s`) =>
  `${n} ${n === 1 ? word : many}`;

export function pct(v, total) {
  return total ? Math.round((v / total) * 100) : 0;
}
