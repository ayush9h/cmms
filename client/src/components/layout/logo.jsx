import { cx } from "@/components/ui";
import { APP_TAGLINE } from "@/lib/constants";

// Natural size of acme_logo.webp; the full variant adds a tagline line beneath it.
const W = 960;
const H = 241;
const TAGLINE = 89;

export function Logo({ className, label, compact }) {
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };
  const height = compact ? H : H + TAGLINE;

  return (
    <svg viewBox={`0 0 ${W} ${height}`} className={cx("block h-auto", className)} {...a11y}>
      <image href="/acme_logo.webp" width={W} height={H} />
      {!compact && (
        <text x="50%" y={H + 74} textAnchor="middle" className="text-[44px] font-medium fill-logo-grey">
          {APP_TAGLINE}
        </text>
      )}
    </svg>
  );
}
