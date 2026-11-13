import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "font-semibold",

    // Disabled
    "disabled:pointer-events-none",
    "disabled:opacity-60",
    "disabled:cursor-not-allowed",

    // SVG
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-sky-500 via-sky-600 to-sky-800 text-white border border-sky-400/30 shadow-sm hover:shadow-md hover:from-sky-400 hover:via-sky-600 hover:to-sky-700 active:brightness-95 transition-all duration-500",

        secondary:
          "bg-panel text-ink border border-line-strong shadow-card hover:border-steel hover:bg-hover active:bg-panel-2 transition-colors duration-200",

        // Quiet: icon buttons, pagination, toolbar toggles.
        ghost:
          "text-ink-2 hover:bg-hover hover:text-ink transition-colors duration-200",

        // Selected / active state of a quiet control.
        soft: "border border-chip-line bg-brand-soft text-accent",

        // Inline text action inside a sentence.
        link: "text-accent underline decoration-1 underline-offset-3 hover:decoration-2",
      },

      // Sizes carry the box, so `inline` can stay part of the text flow.
      size: {
        xs: "inline-flex items-center justify-center gap-2 shrink-0 whitespace-nowrap rounded-sm h-7 px-2.5 text-xs",
        sm: "inline-flex items-center justify-center gap-2 shrink-0 whitespace-nowrap rounded-sm h-8 px-3 text-[13px]",
        md: "inline-flex items-center justify-center gap-2 shrink-0 whitespace-nowrap rounded-sm h-10 px-4",
        lg: "inline-flex items-center justify-center gap-2 shrink-0 whitespace-nowrap rounded-sm h-11 px-5",
        icon: "inline-grid place-items-center shrink-0 rounded-sm size-9",
        "icon-sm": "inline-grid place-items-center shrink-0 rounded-sm size-8",
        "icon-lg": "inline-grid place-items-center shrink-0 rounded-sm size-10",
        inline: "inline",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  loadingText?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      loadingText,
      leadingIcon,
      trailingIcon,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {loading ? (
          <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
        ) : (
          leadingIcon
        )}

        {loading ? (loadingText ?? children) : children}

        {!loading && trailingIcon}
      </button>
    );
  },
);

Button.displayName = "Button";

export { buttonVariants };
