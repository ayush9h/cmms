export const cx = (...c) => c.filter(Boolean).join(" ");

export const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-md bg-btn text-on-btn font-semibold whitespace-nowrap hover:bg-btn-hover disabled:opacity-60 disabled:cursor-progress disabled:hover:bg-btn";
export const btn = cx(btnBase, "min-h-10 px-4");
export const btnQuiet = "inline-flex items-center min-h-10 px-4 rounded-md border border-line-strong bg-panel text-ink font-semibold whitespace-nowrap hover:border-steel hover:bg-ground";
export function ExportLink({ href, label, Icon }) {
  return (
    <a href={href} download className={cx(btnQuiet, "gap-2")} aria-label={label} title={label}>
      <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </a>
  );
}

export const link = "text-accent font-semibold underline underline-offset-3 decoration-1 hover:decoration-2";
export const iconBtn = "grid place-items-center size-8 shrink-0 rounded-lg text-muted hover:bg-hover hover:text-ink";
export const panel = "min-w-0 rounded-xl border border-line bg-panel shadow-card p-4 sm:px-[22px] sm:pt-5 sm:pb-[22px]";
export const banner = "mb-4 px-3.5 py-2.5 rounded-md border border-danger-line bg-danger-bg text-danger-ink";
export const bannerOk = "mb-4 px-3.5 py-2.5 rounded-md border border-ok-line bg-ok-bg text-ok-ink";
export const shimmer = "bg-[linear-gradient(90deg,var(--ground),var(--panel-2),var(--ground))] bg-[length:200%_100%] animate-shimmer";
export const skeleton = cx("h-[220px] rounded-md", shimmer);
export const pageMain = "px-[clamp(16px,2.5vw,32px)] pt-6 pb-12 transition-opacity";
export const formError = "text-[13px] font-medium text-crit";
export const mono = "font-mono text-[0.86em]";
export const cellMain = "block font-medium";
export const cellSub = "block text-xs text-muted";
export const empty = "grid justify-items-start gap-1.5 py-6 text-muted";
export const table =
  "w-full border-collapse text-[13.5px] tabular-nums [&_th]:sticky [&_th]:top-0 [&_th]:z-[1] [&_th]:bg-panel [&_th]:p-2 [&_th]:border-b [&_th]:border-line-strong [&_th]:text-left [&_th]:font-semibold [&_th]:text-ink-2 [&_th]:whitespace-nowrap [&_td]:px-2 [&_td]:py-2.5 [&_td]:border-b [&_td]:border-line [&_td]:align-top [&_:is(th,td):first-child]:pl-0";
export const num = "text-right whitespace-nowrap";

export const TONE = {
  bd: { badge: "bg-bd-soft text-bd", bar: "border-t-[3px] border-t-bd", text: "text-bd" },
  pr: { badge: "bg-pr-soft text-pr", bar: "border-t-[3px] border-t-pr", text: "text-pr" },
};

export function PageHead({ title, sub, icon: Icon, tone, children }) {
  return (
    <header className="sticky top-14 md:top-0 z-[5] flex flex-wrap items-center justify-between gap-x-6 gap-y-2.5 min-h-[72px] px-[clamp(16px,2.5vw,32px)] py-3 bg-head-bg backdrop-blur-[10px] border-b border-line">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <span className={cx("grid place-items-center size-10 shrink-0 rounded-lg", TONE[tone].badge)} aria-hidden="true">
            <Icon size={20} strokeWidth={1.8} />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-[650] leading-[1.2] tracking-[-0.015em]">{title}</h1>
          <p className="mt-0.5 text-[13px] text-muted tabular-nums">{sub}</p>
        </div>
      </div>
      {children}
    </header>
  );
}

export function ErrorState({ title, children }) {
  return (
    <div className="grid justify-items-start gap-3 max-w-[520px] mx-auto my-[12vh]" role="alert">
      <h2 className="text-xl font-[650] leading-[1.25]">{title}</h2>
      {children}
    </div>
  );
}

export function Field({ label, hint, as: Tag = "label", children }) {
  return (
    <Tag className="grid content-start gap-1.5 min-w-0">
      <span className="text-[13px] font-semibold text-ink-2" aria-hidden={Tag === "label" ? undefined : true}>{label}</span>
      {children}
      {hint && <small className="text-xs text-muted">{hint}</small>}
    </Tag>
  );
}

const COLS = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" };

export function FormSection({ id, title, sub, cols = 2, children }) {
  return (
    <section aria-labelledby={id} className="grid gap-3.5 lg:gap-8 lg:grid-cols-[240px_minmax(0,1fr)] px-4 py-[18px] sm:p-6 border-b border-line">
      <div>
        <h2 id={id} className="text-sm font-semibold">{title}</h2>
        <p className="mt-1 text-[13px] leading-[1.45] text-muted">{sub}</p>
      </div>
      <div className={cx("grid gap-4", COLS[cols])}>{children}</div>
    </section>
  );
}

export const formCard = "rounded-xl border border-line bg-panel shadow-card";

export function FormFoot({ error, note, children }) {
  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 px-4 py-3.5 sm:px-6 sm:py-4 rounded-b-xl bg-panel-2">
      {error ? <p className={cx(formError, "basis-full sm:basis-auto mr-auto")} role="alert">{error}</p> : <p className="basis-full sm:basis-auto mr-auto text-[13px] text-muted">{note}</p>}
      {children}
    </div>
  );
}

export function Head({ id, title, sub, meta }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 mb-[18px]">
      <div>
        <h2 id={id} className="text-[15px] font-semibold leading-[1.35] tracking-[-0.01em]">{title}</h2>
        <p className="mt-0.5 max-w-[70ch] text-[13px] text-muted">{sub}</p>
      </div>
      {meta && <p className="px-2.5 py-1 rounded-full border border-line bg-panel-2 text-[12.5px] text-muted whitespace-nowrap [&_b]:font-semibold [&_b]:text-ink">{meta}</p>}
    </div>
  );
}
