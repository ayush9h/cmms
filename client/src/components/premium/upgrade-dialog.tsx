"use client";

import { Sparkles } from "lucide-react";
import { SALES_EMAIL } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PERKS = [
  "OEE overview — availability, performance and quality",
  "PPC shift planning that OEE is calculated from",
  "The asset register, with full edit access for managers",
];

export function UpgradeDialog({ open, onOpenChange }: any) {
  const subject = encodeURIComponent("OPMAX Premium upgrade");
  const body = encodeURIComponent(
    "Hello,\n\nI'd like to upgrade my OPMAX account to Premium.\n\nUser ID:\nPlant:\n\nThanks",
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <span
            className="grid size-10 place-items-center rounded-lg bg-brand-soft text-brand"
            aria-hidden="true"
          >
            <Sparkles size={20} strokeWidth={1.8} />
          </span>
          <DialogTitle>Premium feature</DialogTitle>
          <DialogDescription>
            Your account is on the free tier. Breakdown and production rejection
            logging stay free — these are part of Premium:
          </DialogDescription>
        </DialogHeader>

        <ul className="mt-4 grid gap-2 text-sm text-ink-2">
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-start gap-2">
              <span
                className="mt-[7px] size-1.5 shrink-0 rounded-full bg-accent"
                aria-hidden="true"
              />
              {perk}
            </li>
          ))}
        </ul>

        <p className="mt-4 text-sm text-muted">
          Write to{" "}
          <a
            href={`mailto:${SALES_EMAIL}`}
            className="text-accent font-semibold underline underline-offset-3 decoration-1 hover:decoration-2"
          >
            {SALES_EMAIL}
          </a>{" "}
          and we’ll turn Premium on for your account.
        </p>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center min-h-10 px-4 rounded-lg border border-line-strong bg-panel text-ink font-semibold whitespace-nowrap shadow-card hover:border-steel hover:bg-hover"
          >
            Maybe later
          </button>
          <a
            href={`mailto:${SALES_EMAIL}?subject=${subject}&body=${body}`}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-btn text-on-btn font-semibold whitespace-nowrap hover:bg-btn-hover min-h-10 px-4"
          >
            Email us
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
