import { buttonVariants } from "@/components/ui/button";

export function ExportLink({ href, label, Icon }: any) {
  return (
    <a
      href={href}
      download
      className={buttonVariants({ variant: "secondary" })}
      aria-label={label}
      title={label}
    >
      <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </a>
  );
}

export function PageHead({ title, sub, icon: Icon, tone, children }: any) {
  return (
    <header className="sticky top-14 md:top-0 z-[5] flex flex-wrap items-center justify-between gap-x-6 gap-y-2.5 min-h-[76px] px-[clamp(16px,2.5vw,28px)] py-3.5 bg-head-bg backdrop-blur-[10px]">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <span
            className={`grid place-items-center size-10 shrink-0 rounded-sm ${tone === "bd" ? "bg-bd-soft text-bd" : "bg-pr-soft text-pr"}`}
            aria-hidden="true"
          >
            <Icon size={20} strokeWidth={1.8} />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-[19px] font-semibold leading-[1.2] tracking-[-0.02em]">
            {title}
          </h1>
          <p className="mt-0.5 text-sm text-muted tabular-nums">{sub}</p>
        </div>
      </div>
      {children}
    </header>
  );
}

export function ErrorState({ title, children }: any) {
  return (
    <div
      className="grid justify-items-start gap-3 max-w-[520px] mx-auto my-[12vh]"
      role="alert"
    >
      <h2 className="text-xl font-[650] leading-[1.25]">{title}</h2>
      {children}
    </div>
  );
}

export function Card({
  id,
  title,
  meta,
  className,
  style,
  ref,
  children,
}: any) {
  return (
    <section
      ref={ref}
      style={style}
      aria-labelledby={id}
      className={`min-w-0 rounded-sm border border-line bg-shell p-1.5 flex flex-col ${className || ""}`}
    >
      <div className="flex items-center justify-between gap-3 min-h-8 px-2.5 pb-1.5">
        <h2
          id={id}
          className="text-[13px] font-medium text-ink-2 whitespace-nowrap"
        >
          {title}
        </h2>
        {meta && (
          <p className="min-w-0 truncate text-xs text-muted tabular-nums [&_b]:font-semibold [&_b]:text-ink-2">
            {meta}
          </p>
        )}
      </div>
      <div
        className={
          "min-w-0 rounded-sm border border-line bg-panel shadow-card p-4 sm:p-5 flex-1"
        }
      >
        {children}
      </div>
    </section>
  );
}
