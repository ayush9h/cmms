"use client";

import { ListFilter, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Select } from "./select";
import { cx } from "./styles";

const isSet = (v) => [v].flat().some(Boolean);
const blank = (f) => (f.multi ? [] : "");

export function FilterMenu({
  fields,
  value,
  onChange,
  onClear,
  align = "left",
}) {
  const id = useId();
  const root = useRef(null);
  const [open, setOpen] = useState(false);
  const active = fields.filter((f) => isSet(value[f.key])).length;

  useEffect(() => {
    if (!open) return;
    const away = (e) => !root.current?.contains(e.target) && setOpen(false);
    const esc = (e) =>
      e.key === "Escape" && !e.defaultPrevented && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div className="relative" ref={root}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className={cx(
          "inline-flex items-center gap-2 h-10 px-3.5 rounded-lg border text-sm font-semibold shadow-card",
          open
            ? "border-chip-line bg-brand-soft text-accent"
            : "border-line bg-panel text-ink-2 hover:border-line-strong hover:text-ink",
        )}
      >
        <ListFilter size={16} strokeWidth={1.7} aria-hidden="true" />
        Filters
        {active > 0 && (
          <span
            className="grid place-items-center min-w-5 h-5 px-1.5 rounded-full bg-btn text-on-btn text-xs tabular-nums"
            aria-label={`${active} active`}
          >
            {active}
          </span>
        )}
      </button>
      {open && (
        <div
          id={id}
          role="dialog"
          aria-label="Filters"
          className={cx(
            "absolute z-30 top-[calc(100%+8px)] w-[min(560px,calc(100vw-32px))] p-4 rounded-xl border border-line bg-panel shadow-pop animate-pop",
            "max-sm:fixed max-sm:inset-x-4 max-sm:top-32 max-sm:w-auto",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          <ul className="grid gap-3 sm:gap-2">
            {fields.map((f) => (
              <li
                key={f.key}
                className="grid gap-1 sm:grid-cols-[96px_72px_minmax(0,1fr)] sm:gap-2 sm:items-start"
              >
                <span className="text-[13px] font-semibold text-ink-2 sm:leading-10">
                  {f.label}
                </span>
                <span className="hidden sm:block text-[13px] leading-10 text-muted">
                  {f.multi ? "is any of" : "is"}
                </span>
                <div className="min-w-0">
                  {f.control ? (
                    f.control(value[f.key], (v) => onChange(f.key, v))
                  ) : (
                    <Select
                      label={f.label}
                      hideLabel
                      multiple={f.multi}
                      value={value[f.key] ?? blank(f)}
                      placeholder={f.placeholder}
                      options={f.options ?? []}
                      onChange={(v) => onChange(f.key, v)}
                      disabled={!f.options}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-line">
            <p className="text-[13px] text-muted">
              {active
                ? `${active} filter${active === 1 ? "" : "s"} applied`
                : "No filters applied"}
            </p>
            <button
              type="button"
              onClick={onClear}
              disabled={!active}
              className="min-h-8 px-2 rounded-md text-sm font-semibold text-accent hover:bg-brand-soft disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function FilterBar({ label, q, onQ, placeholder, count, children }) {
  return (
    <div
      className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 mb-4"
      role="search"
      aria-label={label}
    >
      <div className="relative basis-full sm:basis-[360px] sm:shrink">
        <Search
          size={16}
          strokeWidth={1.6}
          aria-hidden="true"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-grey pointer-events-none"
        />
        <input
          type="search"
          aria-label={placeholder}
          placeholder={placeholder}
          value={q}
          onChange={(e) => onQ(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && onQ("")}
          className="h-10 px-9 appearance-none"
        />
        {q && (
          <button
            type="button"
            onClick={() => onQ("")}
            aria-label="Clear search"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 grid place-items-center size-7 rounded-md text-muted hover:bg-ground hover:text-ink"
          >
            <X size={14} strokeWidth={1.8} aria-hidden="true" />
          </button>
        )}
      </div>
      {children}
      <p className="ml-auto text-[13px] text-muted" role="status">
        {count}
      </p>
    </div>
  );
}
