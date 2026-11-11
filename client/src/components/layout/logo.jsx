import { cx } from "@/components/ui";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

// Sized by the font-size the caller passes; the tagline scales from it in em.
export function Logo({ className, label, compact }) {
  const a11y = label
    ? { role: "img", "aria-label": label }
    : { "aria-hidden": true };

  return (
    <span
      className={cx(
        "inline-flex items-baseline gap-[0.45em] leading-none",
        className,
      )}
      {...a11y}
    >
      <span className="font-extrabold tracking-[-0.03em] text-logo-blue">
        {APP_NAME}
      </span>
      {!compact && (
        <span className="text-[0.36em] font-semibold uppercase tracking-[0.08em] text-logo-grey">
          {APP_TAGLINE}
        </span>
      )}
    </span>
  );
}
