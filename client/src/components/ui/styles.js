export const cx = (...c) => c.filter(Boolean).join(" ");

export const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-btn text-on-btn font-semibold whitespace-nowrap hover:bg-btn-hover disabled:opacity-60 disabled:cursor-progress disabled:hover:bg-btn";
export const btn = cx(btnBase, "min-h-10 px-4");
export const btnQuiet =
  "inline-flex items-center min-h-10 px-4 rounded-lg border border-line-strong bg-panel text-ink font-semibold whitespace-nowrap shadow-card hover:border-steel hover:bg-hover";
export const link =
  "text-accent font-semibold underline underline-offset-3 decoration-1 hover:decoration-2";
export const iconBtn =
  "grid place-items-center size-8 shrink-0 rounded-lg text-muted hover:bg-hover hover:text-ink";
export const shell = "min-w-0 rounded-2xl border border-line bg-shell p-1.5";
export const panel =
  "min-w-0 rounded-xl border border-line bg-panel shadow-card p-4 sm:p-5";
export const banner =
  "mb-4 px-3.5 py-2.5 rounded-md border border-danger-line bg-danger-bg text-danger-ink";
export const bannerOk =
  "mb-4 px-3.5 py-2.5 rounded-md border border-ok-line bg-ok-bg text-ok-ink";
export const shimmer =
  "bg-[linear-gradient(90deg,var(--ground),var(--panel-2),var(--ground))] bg-[length:200%_100%] animate-shimmer";
export const skeleton = cx("h-[220px] rounded-md", shimmer);
export const pageMain =
  "px-[clamp(16px,2.5vw,28px)] pt-2 pb-10 transition-opacity";
export const formError = "text-[13px] font-medium text-crit";
export const mono = "font-mono text-[0.86em]";
export const cellMain = "block font-medium";
export const cellSub = "block text-xs text-muted";
export const empty = "grid justify-items-start gap-1.5 py-6 text-muted";
export const table =
  "w-full border-collapse text-[13.5px] tabular-nums [&_th]:sticky [&_th]:top-0 [&_th]:z-[1] [&_th]:bg-shell [&_th]:px-3 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-[12.5px] [&_th]:font-medium [&_th]:text-muted [&_th]:whitespace-nowrap [&_th:first-child]:rounded-l-lg [&_th:last-child]:rounded-r-lg [&_td]:px-3 [&_td]:py-3 [&_td]:border-b [&_td]:border-line [&_td]:align-top [&_tr:last-child>td]:border-b-0";
export const num = "text-right whitespace-nowrap";

export const formCard = "rounded-2xl border border-line bg-panel shadow-card";

export const TONE = {
  bd: {
    badge: "bg-bd-soft text-bd",
    bar: "border-t-[3px] border-t-bd",
    text: "text-bd",
  },
  pr: {
    badge: "bg-pr-soft text-pr",
    bar: "border-t-[3px] border-t-pr",
    text: "text-pr",
  },
};
