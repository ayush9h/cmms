"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// shadcn/ui Dialog, restyled on the CMMS tokens (bg-panel, border-line,
// shadow-pop) so it matches the rest of the app rather than shadcn defaults.

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({ className, children, ...props }: any) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] data-[state=open]:animate-pop" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-32px)] max-w-[480px]",
          "-translate-x-1/2 -translate-y-1/2",
          "rounded-2xl border border-line bg-panel p-6 shadow-pop",
          "focus:outline-none data-[state=open]:animate-pop",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          aria-label="Close"
          className="absolute right-3.5 top-3.5 grid size-8 place-items-center rounded-lg text-muted hover:bg-hover hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <X size={16} strokeWidth={1.8} aria-hidden="true" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: any) {
  return <div className={cn("grid gap-1.5 pr-8", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: any) {
  return (
    <DialogPrimitive.Title
      className={cn(
        "text-[19px] font-semibold leading-[1.2] tracking-[-0.02em] text-ink",
        className,
      )}
      {...props}
    />
  );
}

export function DialogDescription({ className, ...props }: any) {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm leading-[1.5] text-muted", className)}
      {...props}
    />
  );
}

export function DialogFooter({ className, ...props }: any) {
  return (
    <div
      className={cn(
        "mt-5 flex flex-wrap items-center justify-end gap-2.5",
        className,
      )}
      {...props}
    />
  );
}
