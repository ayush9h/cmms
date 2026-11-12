"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/auth/provider";
import { Logo } from "@/components/layout/logo";
import { APP_FULL_NAME } from "@/lib/constants";
import { ThemeSwitch } from "@/components/layout/theme";
import { Field } from "@/components/ui";

const HEAD = "flex items-center justify-between gap-3 min-h-8 px-2.5 pb-1.5";
const POINTS = [
  "Plant reliability at a glance: downtime, MTTR and MTBF",
  "Daily breakdown entry by the shop-floor team",
  "Asset register maintained by managers",
];

export function LoginForm() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(userId, password);
      router.replace("/");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const Toggle = show ? EyeOff : Eye;

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
      <section
        className="hidden lg:flex flex-col justify-between gap-8 py-10 px-[clamp(28px,3.5vw,56px)] text-ink"
        aria-hidden="true"
      >
        <Logo className="text-[30px]" />
        <p className="max-w-[22ch] text-[clamp(26px,2.5vw,34px)] font-semibold leading-[1.15] tracking-[-0.03em] text-balance">
          Every breakdown logged. Every hour of downtime accounted for.
        </p>
        <ul className="grid gap-3 text-sm text-ink-2">
          {POINTS.map((p) => (
            <li
              key={p}
              className="flex gap-2.5 before:size-1.5 before:mt-2 before:shrink-0 before:rounded-full before:bg-brand"
            >
              {p}
            </li>
          ))}
        </ul>
      </section>

      <main className="relative grid content-center justify-items-center gap-3 px-4 pt-6 pb-10 sm:pt-18 bg-canvas lg:my-2 lg:mr-2 lg:rounded-2xl lg:border lg:border-line lg:shadow-card">
        <div
          className={
            "min-w-0 rounded-2xl border border-line bg-shell p-1.5 w-full max-w-100"
          }
        >
          <div className={HEAD}>
            <h1 className="text-[13px] font-medium text-ink-2">Sign in</h1>
          </div>

          <form
            className="grid gap-4 p-5 sm:p-6 rounded-xl border border-line bg-panel shadow-card"
            onSubmit={submit}
          >
            <Logo
              className="lg:hidden text-[22px] mb-1"
              label={APP_FULL_NAME}
            />
            <Field label="User ID">
              <input
                name="user_id"
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value.toLowerCase())}
                placeholder="e.g. ayushkumar"
                className="font-inter"
              />
            </Field>
            <Field label="Password">
              <span className="relative block">
                <input
                  name="password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-11"
                />
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
            {error && (
              <p className={"text-[13px] font-medium text-crit"} role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              className={
                "inline-flex items-center justify-center gap-2 rounded-md bg-btn text-on-btn font-semibold whitespace-nowrap hover:bg-btn-hover disabled:opacity-60 disabled:cursor-progress disabled:hover:bg-btn w-full min-h-10.5 px-4"
              }
              disabled={busy}
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
            <p className="text-center text-[12.5px] text-muted">
              Trying it out? Sign in as{" "}
              <button
                type="button"
                onClick={() => {
                  setUserId("demo");
                  setPassword("demo1234");
                }}
                className="font-mono text-[0.86em] font-semibold text-accent underline underline-offset-3 decoration-1 hover:decoration-2"
              >
                demo / demo1234
              </button>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
