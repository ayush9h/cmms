export const PHASES = [
  { key: "diagnose", label: "Diagnosis", short: "Diagnosis", color: "var(--ph-diagnose)", cls: "fill-ph-diagnose" },
  { key: "spares", label: "Spares arrangement", short: "Spares wait", color: "var(--ph-spares)", cls: "fill-ph-spares" },
  { key: "wrench", label: "Wrench time", short: "Wrench time", color: "var(--ph-wrench)", cls: "fill-ph-wrench" },
];

const CAT_FILLS = ["fill-cat-1", "fill-cat-2", "fill-cat-3", "fill-cat-4", "fill-cat-5", "fill-cat-6"];

export const categorySlot = (i) => ({ color: `var(--cat-${(i % 6) + 1})`, cls: CAT_FILLS[i % 6] });

export const SHIFTS = ["A", "B", "C"];
export const shiftOf = (hhmm) => {
  const h = Number(String(hhmm).slice(0, 2));
  return h >= 6 && h < 14 ? "A" : h >= 14 && h < 22 ? "B" : "C";
};
