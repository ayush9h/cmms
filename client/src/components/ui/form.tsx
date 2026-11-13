import { SHIFTS } from "@/lib/constants";

export function Field({ label, hint, as: Tag = "label", children }: any) {
  return (
    <Tag className="grid content-start gap-1.5 min-w-0">
      <span className="text-[13px] font-semibold text-ink-2">{label}</span>
      {children}
      {hint && <small className="text-xs text-muted">{hint}</small>}
    </Tag>
  );
}

const COLS = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

export function FormSection({ id, title, sub, cols = 2, children }: any) {
  return (
    <section
      aria-labelledby={id}
      className="grid gap-3.5 lg:gap-8 lg:grid-cols-[240px_minmax(0,1fr)] px-4 py-4.5 sm:p-6 border-b border-line"
    >
      <div>
        <h2 id={id} className="text-sm font-semibold">
          {title}
        </h2>
        <p className="mt-1 text-[13px] leading-[1.45] text-muted">{sub}</p>
      </div>
      <div className={`grid gap-4 ${COLS[cols] || ""}`}>{children}</div>
    </section>
  );
}

export function FormFoot({ error, note, children }: any) {
  return (
    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 px-4 py-3.5 sm:px-6 sm:py-4 rounded-b-sm bg-panel-2">
      {error ? (
        <p
          className={
            "text-[13px] font-medium text-crit basis-full sm:basis-auto mr-auto"
          }
          role="alert"
        >
          {error}
        </p>
      ) : (
        <p className="basis-full sm:basis-auto mr-auto text-[13px] text-muted">
          {note}
        </p>
      )}
      {children}
    </div>
  );
}

export function ShiftPicker({ value, onChange }: any) {
  return (
    <div
      className="grid grid-cols-3 gap-1 p-1 rounded-sm border border-line-strong bg-panel-2"
      role="radiogroup"
      aria-label="Shift"
    >
      {SHIFTS.map((s) => (
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={value === s}
          onClick={() => onChange(s)}
          className={`h-8 rounded-sm text-sm font-semibold ${
            value === s
              ? "bg-panel text-ink shadow-card"
              : "text-muted hover:text-ink"
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
