"use client";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const KEY = "opmax.theme";
const MODES = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

export function ThemeSwitch({ compact, labels, className }: any) {
  const [mode, setMode] = useState("system");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "light" || saved === "dark") setMode(saved);
    } catch {}
  }, []);

  const apply = (next) => {
    setMode(next);
    const root = document.documentElement;
    if (next === "system") delete root.dataset.theme;
    else root.dataset.theme = next;
    try {
      if (next === "system") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch {}
  };

  if (compact) {
    const current = MODES.find((m) => m.value === mode)!;
    const next = MODES[(MODES.indexOf(current) + 1) % MODES.length];
    const label = `Theme: ${current.label}. Switch to ${next.label}`;
    return (
      <button
        type="button"
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "text-muted",
          className,
        )}
        onClick={() => apply(next.value)}
        title={label}
        aria-label={label}
      >
        <current.Icon size={18} strokeWidth={1.8} aria-hidden="true" />
      </button>
    );
  }

  return (
    <div
      className={`grid-cols-3 gap-0.5 p-[3px] rounded-sm border border-line bg-line/60 ${(className ?? "grid") || ""}`}
      role="group"
      aria-label="Theme"
    >
      {MODES.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={mode === value}
          onClick={() => apply(value)}
          title={label}
          className={`inline-flex items-center justify-center gap-1.5 min-h-7 px-1.5 rounded-sm text-xs font-medium ${
            mode === value
              ? "bg-panel text-ink shadow-card"
              : "text-muted hover:text-ink"
          }`}
        >
          <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
          <span className={labels ? undefined : "sr-only"}>{label}</span>
        </button>
      ))}
    </div>
  );
}
