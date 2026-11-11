import { fmt } from "@/lib/format";

export const pct = (v) => (v == null ? "—" : `${fmt.n(v)}%`);

const none = "Nothing logged for this selection";

export const METRICS = [
  {
    key: "oee",
    label: "OEE",
    world: 85,
    color: "var(--ink)",
    bar: "bg-ink",
    note: (k) => (k.entries ? "Availability × Performance × Quality" : none),
  },
  {
    key: "availability",
    label: "Availability",
    world: 90,
    color: "var(--cat-1)",
    bar: "bg-cat-1",
    note: (k) =>
      k.entries
        ? `${fmt.mins(k.operating_min)} run of ${fmt.mins(k.planned_min)} planned`
        : none,
  },
  {
    key: "performance",
    label: "Performance",
    world: 95,
    color: "var(--cat-2)",
    bar: "bg-cat-2",
    note: (k) =>
      k.entries
        ? `${fmt.n(k.total_pieces)} of ${fmt.n(k.projected_pieces)} projected pieces`
        : none,
  },
  {
    key: "quality",
    label: "Quality",
    world: 99.9,
    color: "var(--cat-3)",
    bar: "bg-cat-3",
    note: (k) =>
      k.entries
        ? `${fmt.n(k.good_pieces)} good of ${fmt.n(k.total_pieces)} pieces`
        : none,
  },
];
