import { cx } from "./ui";

export function Logo({ className, label, compact }) {
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };
  const mark = <image href="/omr-mark.png" width="480" height="200" className="[filter:var(--logo-filter)]" />;

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
      <text x="504" y="160" textLength="372" lengthAdjust="spacingAndGlyphs" className="text-[104px] font-extrabold fill-logo-blue">BAGLA</text>
      <text x="506" y="199" textLength="368" lengthAdjust="spacingAndGlyphs" className="text-[31px] font-medium fill-logo-grey">Automotive Systems India Ltd.</text>
      <rect y="226" width="880" height="40" className="fill-logo-blue" />
      <text x="866" y="256" textAnchor="end" className="text-[27px] font-extrabold tracking-[3px] fill-white">INDIA</text>
    </svg>
  );
}
