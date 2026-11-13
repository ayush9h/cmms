"use client";

import { ChevronsUpDown, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ThemeSwitch } from "@/components/layout/theme";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const initials = (name) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function UserMenu({ user, logout, collapsed }: any) {
  const root = useRef<any>(null);
  const [open, setOpen] = useState(false);
  const role = user.role === "manager" ? "Manager" : "Employee";

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
      {open && (
        // Mobile puts the sidebar in a top bar, so the menu drops down there
        // and rises above the account row on the wide layout.
        <div
          role="dialog"
          aria-label="Account"
          className={cn(
            "absolute right-0 top-full z-30 mt-2 grid w-max min-w-56 max-w-[min(280px,80vw)] gap-1 rounded-sm border border-line bg-panel p-1.5 shadow-pop animate-pop",
            "md:bottom-full md:left-0 md:right-auto md:top-auto md:mb-2 md:mt-0",
            // expanded rail: match the account row; collapsed rail is too
            // narrow, so the menu keeps its own width there
            !collapsed && "md:w-full md:min-w-[224px] md:max-w-none",
          )}
        >
          <div className="border-b border-line px-2 pb-2 pt-1">
            <p className="truncate text-[13px] font-semibold">{user.name}</p>
            <p className="truncate text-[11.5px] text-muted">
              {user.id} · {role}
            </p>
          </div>

          <div className="grid gap-1.5 px-1 py-1.5">
            <p className="px-1 text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
              Theme
            </p>
            <ThemeSwitch labels />
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "w-full justify-start text-crit hover:bg-danger-bg hover:text-crit",
            )}
          >
            <LogOut size={16} strokeWidth={1.8} aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Account: ${user.name}. Theme and sign out`}
        title={`${user.name} · ${role}`}
        className={cn(
          "flex w-full items-center gap-2.5 min-w-0 rounded-sm text-left hover:bg-hover",
          collapsed
            ? "md:justify-center md:p-1.5"
            : "md:border md:border-line md:bg-panel md:p-2 md:shadow-card md:hover:border-line-strong",
        )}
      >
        <span
          className="grid size-8 shrink-0 place-items-center rounded-sm bg-brand-soft text-xs font-bold text-accent"
          aria-hidden="true"
        >
          {initials(user.name)}
        </span>

        {!collapsed && (
          <>
            <span className="hidden min-w-0 flex-1 md:grid">
              <span className="truncate text-[13px] font-semibold">
                {user.name}
              </span>
              <span className="truncate text-[11.5px] text-muted">
                {user.id} · {role}
              </span>
            </span>

            <ChevronsUpDown
              size={15}
              strokeWidth={1.8}
              aria-hidden="true"
              className="hidden shrink-0 text-muted md:block"
            />
          </>
        )}
      </button>
    </div>
  );
}
