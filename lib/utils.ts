import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export type { ClassValue }

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Placeholder when a label or table cell has no value (not an em dash). */
export const EMPTY_FIELD = "N/A"
