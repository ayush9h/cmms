"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export function Select({
  label,
  value = "",
  options,
  onChange,
  placeholder,
  name,
  disabled,
  hideLabel,
  required,
  up,
  small,
  field,
  multiple,
  className,
}: any) {
  const id = useId();
  const root = useRef<any>(null);
  const list = useRef<any>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const all =
    placeholder == null || required || multiple
      ? options
      : [{ value: "", label: placeholder }, ...options];
  const picked = multiple ? options.filter((o) => value.includes(o.value)) : [];
  const current = multiple ? picked[0] : all.find((o) => o.value === value);
  const isOn = (o) => (multiple ? value.includes(o.value) : o.value === value);

  useEffect(() => {
    if (!open) return;
    const close = (e) => !root.current?.contains(e.target) && setOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  useEffect(() => {
    if (open)
      list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const show = () => {
    setActive(Math.max(0, all.findIndex(isOn)));
    setOpen(true);
  };
  const choose = (o) => {
    if (!multiple) {
      onChange(o.value);
      return setOpen(false);
    }
    onChange(
      value.includes(o.value)
        ? value.filter((v) => v !== o.value)
        : [...value, o.value],
    );
  };
  const onKey = (e) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        show();
      }
      return;
    }
    const step = {
      ArrowDown: active + 1,
      ArrowUp: active - 1,
      Home: 0,
      End: all.length - 1,
      PageDown: active + 8,
      PageUp: active - 8,
    }[e.key];
    if (step !== undefined) {
      e.preventDefault();
      setActive(Math.min(all.length - 1, Math.max(0, step)));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(all[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false);
    } else if (e.key.length === 1) {
      const k = e.key.toLowerCase();
      const hit = [...all.slice(active + 1), ...all.slice(0, active + 1)].find(
        (o) => o.label.toLowerCase().startsWith(k),
      );
      if (hit) setActive(all.indexOf(hit));
    }
  };

  const empty = !current?.value;

  return (
    <div className={`relative min-w-0 ${className || ""}`} ref={root}>
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}l`}
        aria-labelledby={`${id}n ${id}v`}
        aria-activedescendant={open ? `${id}o${active}` : undefined}
        aria-required={required || undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKey}
        className={`flex items-center gap-2 w-full min-w-0 px-3 rounded-sm border bg-panel text-ink text-left transition-[border-color,box-shadow] hover:border-field-hover focus-visible:outline-none focus-visible:border-accent focus-visible:shadow-[inset_0_0_0_1px_var(--accent)] disabled:opacity-60 disabled:cursor-progress ${small ? "h-[34px]" : "h-10"} ${
          open
            ? "border-accent shadow-[inset_0_0_0_1px_var(--accent)]"
            : "border-line-strong shadow-card"
        }`}
      >
        <span
          id={`${id}n`}
          className={
            hideLabel ? "sr-only" : "text-[13px] font-medium text-muted"
          }
        >
          {label}
        </span>
        <span
          id={`${id}v`}
          className={`flex-1 min-w-0 truncate ${field ? "text-[15px]" : "text-sm font-semibold"} ${empty && hideLabel ? "font-normal text-muted" : ""}`}
        >
          {current?.label ?? placeholder}
        </span>
        {picked.length > 1 && (
          <span className="shrink-0 px-1.5 rounded-sm border border-line bg-panel-2 text-xs font-semibold text-muted">
            +{picked.length - 1}
          </span>
        )}
        <ChevronDown
          size={16}
          strokeWidth={1.6}
          aria-hidden="true"
          className={`shrink-0 transition-[rotate] duration-200 ease-snap ${open ? "rotate-180 text-accent" : "text-brand-grey"}`}
        />
      </button>
      {open && (
        <ul
          id={`${id}l`}
          role="listbox"
          aria-multiselectable={multiple || undefined}
          onMouseDown={(e) => e.preventDefault()}
          aria-labelledby={`${id}n`}
          ref={list}
          className={`absolute z-20 left-0 min-w-full max-h-80 overflow-y-auto p-1 rounded-sm border border-line bg-panel shadow-pop animate-pop ${up ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]"}`}
        >
          {all.map((o, i) => {
            const selected = isOn(o);
            return (
              <li
                key={o.value || "_all"}
                id={`${id}o${i}`}
                role="option"
                aria-selected={selected}
                onPointerEnter={() => setActive(i)}
                onClick={() => choose(o)}
                className={`flex items-center justify-between gap-4 min-h-9 px-2.5 rounded-sm text-sm whitespace-nowrap cursor-pointer ${i === active ? "bg-ground" : ""} ${selected ? "font-semibold text-accent" : ""}`}
              >
                {o.label}
                <Check
                  size={16}
                  strokeWidth={2}
                  aria-hidden="true"
                  className={`shrink-0 ${!selected ? "invisible" : ""}`}
                />
              </li>
            );
          })}
        </ul>
      )}
      {name && <input type="hidden" name={name} value={String(value)} />}
    </div>
  );
}
