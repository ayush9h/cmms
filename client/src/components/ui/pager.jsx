"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Select } from "./select";
import { cx } from "./styles";

const SIZES = [25, 50, 100].map((n) => ({
  value: String(n),
  label: String(n),
}));
const BTN =
  "grid place-items-center min-w-[34px] h-[34px] px-2 rounded-lg border text-[13.5px] tabular-nums disabled:opacity-40 disabled:cursor-not-allowed";
const IDLE =
  "border-transparent font-medium text-ink-2 enabled:hover:bg-hover enabled:hover:text-ink";

function pageList(page, pages) {
  const keep = [...new Set([1, pages, page - 1, page, page + 1])]
    .filter((n) => n >= 1 && n <= pages)
    .sort((a, b) => a - b);
  const out = [];
  keep.forEach((n, i) => {
    if (i && n - keep[i - 1] > 1) out.push(`gap-${n}`);
    out.push(n);
  });
  return out;
}

export function Pager({ page, pages, total, size, noun, onPage, onSize }) {
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
            className={cx(BTN, IDLE)}
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
                className={cx(
                  BTN,
                  n === page
                    ? "border-chip-line bg-brand-soft font-[650] text-accent"
                    : IDLE,
                )}
              >
                {n}
              </button>
            </li>
          ),
        )}
        <li>
          <button
            type="button"
            className={cx(BTN, IDLE)}
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
