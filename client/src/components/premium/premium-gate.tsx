"use client";

import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/auth/provider";
import { ErrorState, PageHead } from "@/components/ui";
import { UpgradeDialog } from "./upgrade-dialog";

// Hiding the nav item is cosmetic; the API enforces the tier too (require_premium).
// This is what a free user sees if they reach a Premium URL directly.
export function PremiumGate({ children }: any) {
  const { loading, isPremium } = useAuth();
  const [open, setOpen] = useState(true);

  if (loading)
    return (
      <main className="px-[clamp(16px,2.5vw,28px)] pt-2 pb-10">
        <div
          className="h-[220px] rounded-sm bg-[linear-gradient(90deg,var(--ground),var(--panel-2),var(--ground))] bg-[length:200%_100%] animate-shimmer"
          role="status"
          aria-label="Loading"
        />
      </main>
    );

  if (isPremium) return children;

  return (
    <>
      <PageHead
        title="Premium feature"
        sub="Upgrade to unlock OEE analytics and the asset register."
      />
      <main className="px-[clamp(16px,2.5vw,28px)] pt-2 pb-10 transition-opacity">
        <ErrorState title="This page is part of Premium">
          <p>
            Your account is on the free tier. Breakdown and production rejection
            logging are still available to you.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className={buttonVariants()}
            >
              See what’s included
            </button>
            <Link
              href="/breakdowns/new"
              className={buttonVariants({ variant: "secondary" })}
            >
              Log a breakdown
            </Link>
          </div>
        </ErrorState>
      </main>
      <UpgradeDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
