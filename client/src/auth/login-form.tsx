"use client";

import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, type SubmitEvent } from "react";
import { useAuth } from "@/auth/provider";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/form";

export function LoginForm() {
  const router = useRouter();
  const { user, loading, login } = useAuth();

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  async function submit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await login(userId.trim().toLowerCase(), password);
      router.replace("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.35fr)_minmax(420px,0.65fr)]">
      <section
        className="relative hidden overflow-hidden lg:flex lg:flex-col"
        aria-hidden="true"
      >
        <Image
          src="/login-bg.jpg"
          alt=""
          fill
          sizes="60vw"
          priority
          className="object-cover dark:hidden"
        />

        <Image
          src="/login-bg-dark.jpg"
          alt=""
          fill
          sizes="60vw"
          className="hidden object-cover dark:block"
        />

        <div className="relative px-10 pt-10">
          <Logo className="text-[30px] [&>span]:text-white" />

          <p className="mt-1.5 text-[13px] font-medium uppercase tracking-[0.16em] text-white/85">
            Operational Excellence Maximizing
          </p>
        </div>

        <div className="relative grid flex-1 place-items-center px-10 pb-14">
          <figure className="w-full max-w-[1100px]">
            <Image
              src="/dashboard-light.webp"
              alt=""
              width={1917}
              height={1052}
              priority
              className="h-auto w-full rounded-sm border border-white/30 shadow-[0_18px_60px_-12px_rgb(0_0_0/0.45)] dark:hidden"
            />

            <Image
              src="/dashboard-dark.webp"
              alt=""
              width={1917}
              height={1053}
              className="hidden h-auto w-full rounded-sm border border-white/20 shadow-[0_18px_60px_-12px_rgb(0_0_0/0.6)] dark:block"
            />

            <figcaption className="mt-3 text-center text-xs text-white/80">
              Image shown is for demonstration purposes only.
            </figcaption>
          </figure>
        </div>
      </section>

      <main className="grid content-center justify-items-center bg-canvas px-4 pb-10 pt-6 sm:pt-18 lg:border-l lg:border-line">
        <div className="w-full max-w-100">
          <header className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-ink">
              Welcome back<span className="text-brand">.</span>
            </h1>

            <p className="mt-3 text-[13px] leading-[1.45] text-muted">
              Your plant operations, asset performance, and maintenance insights
              — all in one place. Log in to continue.
            </p>
          </header>

          <form className="grid gap-4" onSubmit={submit}>
            <Field label="User ID">
              <input
                name="user_id"
                autoComplete="username"
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value.toLowerCase())}
                placeholder="e.g. ayushkumar"
                className="rounded-sm font-mono"
              />
            </Field>

            <Field label="Password">
              <span className="relative block">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-sm pr-11"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-sm text-muted hover:bg-brand-soft hover:text-accent"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </Field>

            {error && (
              <p role="alert" className="text-[13px] font-medium text-crit">
                Error occurred while logging in. Please try after some time.
              </p>
            )}

            <Button
              size="lg"
              type="submit"
              loading={busy}
              disabled={loading || busy}
              loadingText="Logging in..."
              className="mt-1 w-full"
            >
              Log in
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
