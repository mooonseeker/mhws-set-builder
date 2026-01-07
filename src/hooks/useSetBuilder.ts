/**
 * @fileoverview Hook for accessing the set builder context.
 */

import { useContext } from "react";

import { SetBuilderContext } from "@/contexts/SetBuilderContext";

/**
 * Hook for using the Set Builder context.
 *
 * @returns The set builder context.
 * @throws {Error} If used outside of a SetBuilderProvider.
 *
 * @example
 * ```tsx
 * function SetBuilderComponent() {
 *   const { buildSet, result, status } = useSetBuilder();
 *
 *   // ...
 * }
 * ```
 */
export const useSetBuilder = () => {
  const context = useContext(SetBuilderContext);
  if (context === undefined) {
    throw new Error("useSetBuilder must be used within a SetBuilderProvider");
  }
  return context;
};
