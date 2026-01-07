/**
 * @fileoverview Utility for combining and merging CSS classes.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * A utility function that wraps `clsx` and `tailwind-merge` to conditionally
 * apply and merge Tailwind CSS classes.
 * @param inputs A list of class values to process.
 * @returns The merged and optimized class string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
