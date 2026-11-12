"use client";

import {
  Box,
  ChevronDown,
  ClipboardList,
  Factory,
  Gauge,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  Lock,
  PanelLeftOpen,
  ScrollText,
  ClipboardClock,
  MonitorActivity,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useAuth } from "@/auth/provider";
import { UpgradeDialog } from "@/components/premium/upgrade-dialog";
import { Logo } from "@/components/layout/logo";
import { APP_NAME } from "@/lib/constants";
import { ThemeSwitch } from "@/components/layout/theme";

const NAV = [
  {
    label: "Dashboard",
    Icon: LayoutDashboard,
    // "/" only ever matches itself: startsWith("//") is never true
    match: ["/"],
    exact: ["/oee"],
    children: [
      {
        href: "/",
        label: "Equipment Performance",
        hint: "OEE: availability, performance and quality",
        Icon: Gauge,
        premium: true,
      },
      {
        href: "/oee",
        label: "Mfg. Performance",
        hint: "Breakdowns, downtime, MTTR and MTBF",
        Icon: MonitorActivity,
      },
    ],
  },
  {
    label: "Mfg. Excellence",
    Icon: ClipboardList,
    premium: true,
    match: ["/oee/ppc"],
    children: [
      {
        href: "/oee/ppc",
        label: "PPC Entry",
        hint: "Shift production data that OEE is calculated from",
        Icon: ClipboardList,
      },
    ],
  },
  {
    label: "Maint. Excellence",
    Icon: ClipboardClock,
    match: ["/breakdowns", "/rejections"],
    children: [
      {
        href: "/breakdowns/new",
        label: "Log Breakdown",
        hint: "Machine stoppage and repair time",
        Icon: Wrench,
        tone: "bd",
      },
      {
        href: "/rejections/new",
        label: "Log Production & Rejection",
        hint: "Parts rejected by machine, shift and defect",
        Icon: Factory,
        tone: "pr",
      },
    ],
  },
  { href: "/assets", label: "Assets", Icon: Box, premium: true },
];
const DESKTOP = "(min-width: 861px)";
const ITEM =
  "relative flex items-center justify-center gap-2.5 w-10 min-w-0 min-h-[38px] rounded-lg border text-sm transition-colors md:w-auto";
const ON =
  "border-line bg-nav-active-bg text-nav-active-ink font-semibold shadow-card";
const OFF =
  "border-transparent font-medium text-ink-2 hover:bg-line hover:text-ink";

// dot on the icon rail / mobile, padlock when the sidebar is expanded
function LockMark({ collapsed }: any) {
  return (
    <>
      <span
        aria-hidden="true"
        className={`absolute right-1 top-1 size-1.5 rounded-full bg-accent ${!collapsed ? "md:hidden" : ""}`}
      />
      <Lock
        size={13}
        strokeWidth={2}
        aria-hidden="true"
        className={`hidden ml-auto shrink-0 text-muted ${!collapsed ? "md:block" : ""}`}
      />
      <span className="sr-only">(Premium)</span>
    </>
  );
}

function NavGroup({
  group,
  path,
  collapsed,
  label,
  locked,
  onLocked,
  isPremium,
}: any) {
  const id = useId();
  const root = useRef<any>(null);
  const inGroup =
    group.match.some((m) => path === m || path.startsWith(`${m}/`)) ||
    (group.exact ?? []).includes(path);
  const [open, setOpen] = useState(inGroup);
  const [fly, setFly] = useState(false);

  useEffect(() => setFly(false), [path, collapsed]);

  // navigating into a group reveals where you are; leaving it does not force it shut
  useEffect(() => {
    if (inGroup) setOpen(true);
  }, [inGroup]);

  useEffect(() => {
    if (!fly) return;
    const away = (e) => !root.current?.contains(e.target) && setFly(false);
    const esc = (e) => e.key === "Escape" && setFly(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [fly]);

  const inline = !locked && !collapsed && open;
  const childLocked = (c: any) => Boolean(c.premium) && !isPremium;
  const click = () =>
    locked
      ? onLocked()
      : !collapsed && matchMedia(DESKTOP).matches
        ? setOpen((o) => !o)
        : setFly((f) => !f);

  return (
    <li className="relative" ref={root}>
      <button
        type="button"
        onClick={click}
        aria-expanded={locked ? undefined : collapsed ? fly : inline || fly}
        aria-controls={locked ? undefined : id}
        title={collapsed ? group.label : undefined}
        className={`${ITEM} md:w-full ${collapsed ? "md:px-0" : "md:justify-start md:px-2.5"} ${inGroup ? ON : OFF}`}
      >
        <group.Icon
          size={18}
          strokeWidth={1.8}
          aria-hidden="true"
          className="shrink-0"
        />
        <span className={label}>{group.label}</span>
        {locked ? (
          <LockMark collapsed={collapsed} />
        ) : (
          <ChevronDown
            size={15}
            strokeWidth={1.8}
            aria-hidden="true"
            className={`hidden ml-auto text-muted transition-[rotate] duration-200 ease-snap ${!collapsed ? "md:block" : ""} ${inline ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {inline && (
        <ul
          id={id}
          className="hidden md:grid gap-0.5 mt-1.5 mb-1 ml-[18px] border-l-2 border-line-strong"
        >
          {group.children.map((c) => {
            const lock = childLocked(c);
            const current = !lock && path === c.href;
            const cls = `relative flex w-full items-center gap-2 min-h-8 pl-3.5 pr-1 -ml-0.5 text-[13.5px] whitespace-nowrap transition-colors ${
              current
                ? "font-semibold text-accent before:absolute before:left-0 before:inset-y-1 before:w-0.5 before:rounded-full before:bg-accent"
                : "font-medium text-ink-2 hover:text-ink hover:before:absolute hover:before:left-0 hover:before:inset-y-1 hover:before:w-0.5 hover:before:rounded-full hover:before:bg-line-strong"
            }`;
            const body = (
              <>
                <c.Icon
                  size={15}
                  strokeWidth={1.9}
                  aria-hidden="true"
                  className={`shrink-0 ${c.tone === "bd" ? "text-bd" : c.tone === "pr" ? "text-pr" : ""}`}
                />
                <span className="min-w-0 flex-1 truncate">{c.label}</span>
                {lock && (
                  <>
                    <Lock
                      size={12}
                      strokeWidth={2}
                      aria-hidden="true"
                      className="ml-auto mr-1.5 shrink-0 text-muted"
                    />
                    <span className="sr-only">(Premium)</span>
                  </>
                )}
              </>
            );
            return (
              <li key={c.href}>
                {lock ? (
                  <button type="button" onClick={onLocked} className={cls}>
                    {body}
                  </button>
                ) : (
                  <Link
                    href={c.href}
                    title={c.label}
                    aria-current={current ? "page" : undefined}
                    className={cls}
                  >
                    {body}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {fly && (
        <div
          id={id}
          role="menu"
          aria-label={group.label}
          className={
            "absolute z-40 top-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-72 p-1.5 rounded-xl border border-line bg-panel shadow-pop animate-pop md:top-0 md:left-[calc(100%+14px)] md:translate-x-0"
          }
        >
          <p className="px-2.5 pt-1.5 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            {group.label}
          </p>
          {group.children.map((c) => {
            const lock = childLocked(c);
            const current = !lock && path === c.href;
            const cls = `flex w-full items-start gap-3 p-2.5 rounded-lg text-left ${current ? "bg-shell" : "hover:bg-hover"}`;
            const body = (
              <>
                <span
                  className={`grid place-items-center size-8 shrink-0 rounded-md ${c.tone === "bd" ? "bg-bd-soft text-bd" : c.tone === "pr" ? "bg-pr-soft text-pr" : "bg-shell text-ink-2"}`}
                >
                  <c.Icon size={16} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span className="grid">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                    {c.label}
                    {lock && (
                      <>
                        <Lock
                          size={12}
                          strokeWidth={2}
                          aria-hidden="true"
                          className="shrink-0 text-muted"
                        />
                        <span className="sr-only">(Premium)</span>
                      </>
                    )}
                  </span>
                  <span className="text-xs text-muted">{c.hint}</span>
                </span>
              </>
            );
            return lock ? (
              <button
                key={c.href}
                type="button"
                role="menuitem"
                onClick={onLocked}
                className={cls}
              >
                {body}
              </button>
            ) : (
              <Link
                key={c.href}
                href={c.href}
                role="menuitem"
                aria-current={current ? "page" : undefined}
                className={cls}
              >
                {body}
              </Link>
            );
          })}
        </div>
      )}
    </li>
  );
}
const KEY = "cmms.sidebar.collapsed";

const initials = (name) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function Sidebar() {
  const path = usePathname();
  const { user, logout, isPremium } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [upgrade, setUpgrade] = useState(false);
  // Premium options stay visible for free users, marked, and open the dialog
  const lockedFor = (n: any) => Boolean(n.premium) && !isPremium;

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(KEY) === "1");
    } catch {}
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(KEY, next ? "1" : "0");
    } catch {}
  };
  const tip = (text) => (collapsed ? text : undefined);
  const active = (href) =>
    href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);
  const label = `sr-only ${!collapsed ? "md:not-sr-only md:block md:min-w-0 md:flex-1 md:truncate md:whitespace-nowrap md:text-left" : ""}`;
  const Toggle = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <aside
      className={`sticky top-0 z-20 flex items-center gap-1.5 h-14 px-4 py-2 border-b border-line bg-panel md:bg-transparent md:flex-col md:items-stretch md:gap-0 md:h-screen md:p-0 md:border-b-0 md:transition-[width] md:duration-200 md:ease-snap ${collapsed ? "md:w-[72px]" : "md:w-[260px]"}`}
    >
      <div
        className={`contents md:flex md:items-center md:gap-2 md:h-[72px] ${
          collapsed ? "md:justify-center" : "md:justify-between md:pl-5 md:pr-3"
        }`}
      >
        <Link
          href="/"
          className={`order-[-2] flex pr-1.5 md:order-none md:pr-0 ${collapsed ? "md:hidden" : ""}`}
          aria-label={`${APP_NAME} maintenance dashboard`}
        >
          <Logo className="text-[20px]" compact />
        </Link>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="group hidden md:grid place-items-center size-9 shrink-0 rounded-lg text-muted hover:bg-line hover:text-ink"
        >
          {collapsed && (
            <svg
              viewBox="0 0 32 32"
              aria-hidden="true"
              className="[grid-area:1/1] size-[30px] transition-opacity group-hover:opacity-0 group-focus-visible:opacity-0"
            >
              <circle
                cx="16"
                cy="16"
                r="13.5"
                className="fill-panel stroke-brand-grey stroke-[5]"
              />
              <path d="M16 6.5l8.2 14.2H7.8z" className="fill-brand" />
              <path d="M13 15.9h6l-3 4.8z" className="fill-panel" />
            </svg>
          )}
          <Toggle
            size={20}
            strokeWidth={1.8}
            aria-hidden="true"
            className={`[grid-area:1/1] transition-opacity ${collapsed ? "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100" : ""}`}
          />
        </button>
      </div>

      <div className="contents md:flex md:flex-col md:gap-5 md:px-3 md:pt-2 md:pb-4">
        <nav aria-labelledby="nav-h" className="grid gap-1.5">
          <p
            id="nav-h"
            className={`hidden px-2.5 text-[11px] font-medium uppercase tracking-[0.06em] text-muted ${!collapsed ? "md:block" : ""}`}
          >
            Menu
          </p>
          <ul className="grid grid-flow-col md:grid-flow-row md:grid-cols-[minmax(0,1fr)] gap-0.5">
            {NAV.map((n) => {
              const locked = lockedFor(n);
              if (n.children)
                return (
                  <NavGroup
                    key={n.label}
                    group={n}
                    path={path}
                    collapsed={collapsed}
                    label={label}
                    locked={locked}
                    onLocked={() => setUpgrade(true)}
                    isPremium={isPremium}
                  />
                );
              const { href, label: name, Icon } = n;
              const current = active(href);
              const inner = (
                <>
                  <Icon
                    size={18}
                    strokeWidth={1.8}
                    aria-hidden="true"
                    className="shrink-0"
                  />
                  <span className={label}>{name}</span>
                  {locked && <LockMark collapsed={collapsed} />}
                </>
              );
              const cls = `${ITEM} ${collapsed ? "md:px-0" : "md:justify-start md:px-2.5"} ${current && !locked ? ON : OFF}`;
              return (
                <li key={href}>
                  {locked ? (
                    <button
                      type="button"
                      onClick={() => setUpgrade(true)}
                      title={tip(name)}
                      className={`${cls} md:w-full`}
                    >
                      {inner}
                    </button>
                  ) : (
                    <Link
                      href={href}
                      title={tip(name)}
                      aria-current={current ? "page" : undefined}
                      className={cls}
                    >
                      {inner}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div
        className={`order-2 grid gap-2.5 md:order-none md:mt-auto ${collapsed ? "md:justify-items-center md:py-3" : "md:p-3"}`}
      >
        <ThemeSwitch className={`hidden ${!collapsed ? "md:grid" : ""}`} />
        <div
          className={`flex items-center gap-0.5 min-w-0 md:gap-2.5 ${
            collapsed
              ? "md:flex-col md:gap-1.5"
              : "md:p-2 md:rounded-xl md:border md:border-line md:bg-panel md:shadow-card"
          }`}
        >
          <span
            className="hidden md:grid place-items-center size-8 shrink-0 rounded-lg bg-brand-soft text-accent text-xs font-bold"
            aria-hidden="true"
          >
            {initials(user.name)}
          </span>
          <span
            className={`hidden flex-1 min-w-0 ${!collapsed ? "md:grid" : ""}`}
          >
            <span className="truncate text-[13px] font-semibold">
              {user.name}
            </span>
            <span className="truncate text-[11.5px] text-muted">
              {user.id} · {user.role === "manager" ? "Manager" : "Employee"}
            </span>
          </span>
          <ThemeSwitch
            compact
            className={collapsed ? undefined : "md:hidden"}
          />
          <button
            type="button"
            className={
              "grid place-items-center size-8 shrink-0 rounded-lg text-muted hover:bg-hover hover:text-ink"
            }
            onClick={() => logout()}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={18} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
      </div>
      <UpgradeDialog open={upgrade} onOpenChange={setUpgrade} />
    </aside>
  );
}
