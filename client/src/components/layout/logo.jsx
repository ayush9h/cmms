import { cx } from "@/components/ui";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export function Logo({ className, label, compact }) {
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };
  const mark = <text x="50%" y="150" textAnchor="middle" className="text-[150px] font-extrabold fill-logo-blue">{APP_NAME}</text>;

  if (compact) {
    return (
      <svg viewBox="0 0 480 200" className={cx("block h-auto", className)} {...a11y}>
        {mark}
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 880 266" className={cx("block h-auto", className)} {...a11y}>
      {mark}
      <text x="50%" y="228" textAnchor="middle" className="text-[44px] font-medium fill-logo-grey">{APP_TAGLINE}</text>
    </svg>
  );
}
