"use client";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Select } from "./select";

const SIZES = [25, 50, 100].map((n) => ({
  value: String(n),
  label: String(n),
}));
const BTN =
  "min-w-[34px] h-[34px] px-2 border border-transparent text-[13.5px] font-medium tabular-nums disabled:opacity-40";
const IDLE = buttonVariants({ variant: "ghost", size: "icon-sm" });
const CURRENT = buttonVariants({ variant: "soft", size: "icon-sm" });

function pageList(page: number, pages: number) {
  const keep = [...new Set([1, pages, page - 1, page, page + 1])]
    .filter((n) => n >= 1 && n <= pages)
    .sort((a, b) => a - b);
  const out: any[] = [];
  keep.forEach((n, i) => {
    if (i && n - keep[i - 1] > 1) out.push(`gap-${n}`);
    out.push(n);
  });
  return out;
}

export function Pager({ page, pages, total, size, noun, onPage, onSize }: any) {
  const from = total ? (page - 1) * size + 1 : 0;
  const to = Math.min(total, page * size);
  return (
    <nav
      className="flex flex-wrap items-center gap-x-4 gap-y-3 mt-4 pt-4 border-t border-line"
      aria-label="Pagination"
    >
      <p className="text-[13px] text-muted tabular-nums" aria-live="polite">
        <b className="font-semibold text-ink">
          {from}–{to}
        </b>{" "}
        of {total} {noun}
      </p>
      <Select
        label="Rows"
        value={String(size)}
        options={SIZES}
        onChange={(v) => onSize(Number(v))}
        up
        small
      />
      <ul className="flex items-center justify-center gap-1 w-full sm:w-auto sm:ml-auto">
        <li>
          <button
            type="button"
            className={cn(IDLE, BTN)}
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </li>
        {pageList(page, pages).map((n) =>
          typeof n === "string" ? (
            <li
              key={n}
              className="min-w-5 text-center text-muted"
              aria-hidden="true"
            >
              …
            </li>
          ) : (
            <li key={n}>
              <button
                type="button"
                aria-current={n === page ? "page" : undefined}
                aria-label={`Page ${n}`}
                onClick={() => onPage(n)}
                className={cn(n === page ? CURRENT : IDLE, BTN)}
              >
                {n}
              </button>
            </li>
          ),
        )}
        <li>
          <button
            type="button"
            className={cn(IDLE, BTN)}
            onClick={() => onPage(page + 1)}
            disabled={page >= pages}
            aria-label="Next page"
          >
            <ChevronRight size={16} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
