import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// shadcn's class helper: merges conditional classes and lets a later
// Tailwind utility win over an earlier conflicting one.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
