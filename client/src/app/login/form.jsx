"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { Logo } from "../logo";
import { ThemeSwitch } from "../theme";
import { Field, btnBase, cx, formError, mono } from "../ui";

const DEMO = [
  { id: "MGR001", name: "Maintenance Manager", role: "Manager", password: "Manager@123" },
  { id: "MGR002", name: "Plant Head", role: "Manager", password: "Manager@123" },
  { id: "MGR003", name: "Reliability Lead", role: "Manager", password: "Manager@123" },
  { id: "EMP101", name: "Technician 1", role: "Employee", password: "Tech@123" },
  { id: "EMP102", name: "Technician 2", role: "Employee", password: "Tech@123" },
];
const POINTS = [
  "Plant reliability at a glance: downtime, MTTR and MTBF",
  "Daily breakdown entry by the shop-floor team",
  "Asset register maintained by managers",
];

export function LoginForm({ next }) {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, next, router]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(userId, password);
      router.replace(next);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const Toggle = show ? EyeOff : Eye;

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
      <section
        className="hidden lg:flex flex-col justify-between gap-8 py-12 px-[clamp(28px,4vw,64px)] border-r border-line bg-panel text-ink"
        aria-hidden="true"
      >
        <Logo className="w-[220px]" />
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-accent">Maintenance</p>
          <p className="max-w-[18ch] mt-3 text-[clamp(28px,3vw,40px)] font-[650] leading-[1.15] tracking-[-0.025em]">Every breakdown logged. Every hour of downtime accounted for.</p>
        </div>
        <ul className="grid gap-3 text-sm text-ink-2">
          {POINTS.map((p) => (
            <li key={p} className="flex gap-2.5 before:size-1.5 before:mt-2 before:shrink-0 before:rounded-full before:bg-brand">{p}</li>
          ))}
        </ul>
      </section>

      <main className="relative grid content-center justify-items-center gap-6 px-6 pt-6 pb-10 sm:pt-[72px]">
        <ThemeSwitch labels className="grid w-full max-w-[380px] sm:absolute sm:top-5 sm:right-6 sm:w-60" />
        <form className="grid gap-4 w-full max-w-[380px] p-6 sm:p-8 rounded-2xl border border-line bg-panel shadow-pop" onSubmit={submit}>
          <Logo className="lg:hidden w-[170px]" label="OMR Bagla Automotive Systems India Ltd." />
          <h1 className="mt-1 text-xl font-[650] leading-[1.2] tracking-[-0.015em]">Sign in</h1>
          <p className="-mt-3 text-[13px] text-muted">Use your employee or manager ID.</p>
          <Field label="User ID">
            <input name="user_id" autoComplete="username" required value={userId} onChange={(e) => setUserId(e.target.value.toUpperCase())} placeholder="e.g. EMP101" className={mono} autoFocus />
          </Field>
          <Field label="Password">
            <span className="relative block">
              <input name="password" type={show ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pr-11" />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide password" : "Show password"}
                aria-pressed={show}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 grid place-items-center size-8 rounded-md text-muted hover:bg-brand-soft hover:text-accent"
              >
                <Toggle size={17} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </span>
          </Field>
          {error && <p className={formError} role="alert">{error}</p>}
          <button type="submit" className={cx(btnBase, "w-full min-h-[42px] px-4")} disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>

        <section className="w-full max-w-[380px]" aria-labelledby="demo-h">
          <h2 id="demo-h" className="text-[13px] font-semibold">Demo accounts</h2>
          <p className="mt-0.5 mb-2.5 text-[12.5px] text-muted">Placeholder IDs for the pilot. Managers can register assets; everyone can log breakdowns.</p>
          <ul className="grid divide-y divide-line overflow-hidden rounded-[10px] border border-line bg-panel">
            {DEMO.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => { setUserId(d.id); setPassword(d.password); setError(null); }}
                  className="grid grid-cols-[72px_1fr_auto] items-center gap-2.5 w-full min-h-10 px-3 text-left text-[13px] hover:bg-hover"
                >
                  <span className={mono}>{d.id}</span>
                  <span>{d.name}</span>
                  <span className={cx("px-2 py-px rounded-full border text-[11.5px] font-semibold", d.role === "Manager" ? "border-chip-line bg-brand-soft text-accent" : "border-line bg-panel-2 text-muted")}>{d.role}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
