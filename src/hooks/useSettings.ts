/**
 * @fileoverview Custom hook for consuming the SettingsContext.
 */

import { useContext } from "react";

import { SettingsContext } from "@/contexts";

/**
 * Hook to access global application settings and related operations.
 * Must be used within a SettingsProvider.
 *
 * @returns The settings context value.
 * @throws {Error} If used outside of a SettingsProvider.
 */
export function useSettings() {
  const context = useContext(SettingsContext);

  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }

  return context;
}
