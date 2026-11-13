import { APP_NAME } from "@/lib/constants";

// Sized by the font-size the caller passes; the tagline scales from it in em.
export function Logo({ className, label, compact }: any) {
  const a11y = label
    ? { role: "img", "aria-label": label }
    : { "aria-hidden": true };

  return (
    <span
      className={`inline-flex items-baseline gap-[0.45em] leading-none ${className || ""}`}
      {...a11y}
    >
      <span className="font-extrabold tracking-[-0.03em] text-logo-blue">
        {APP_NAME}
      </span>
    </span>
  );
}
