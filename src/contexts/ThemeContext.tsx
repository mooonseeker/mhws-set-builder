/**
 * @fileoverview Defines the context and types for theme management in the MHWS Set Builder.
 *
 * This file contains only the context definition and related types to prevent
 * React Fast Refresh warnings.
 */

import { createContext } from "react";

/**
 * Represents the available theme options.
 * - `light`: Light mode.
 * - `dark`: Dark mode.
 * - `system`: Follow the operating system's theme setting.
 */
export type Theme = "light" | "dark" | "system";

/**
 * Defines the shape of the ThemeContext.
 */
export interface ThemeContextType {
  /** The user-selected theme preference. */
  theme: Theme;
  /** Function to change the current theme. */
  setTheme: (theme: Theme) => void;
  /** The actual theme being applied (light or dark), resolved from the 'system' preference. */
  effectiveTheme: "light" | "dark";
}

/**
 * React context for managing the application theme.
 */
export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);
