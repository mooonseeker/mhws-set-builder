/**
 * @fileoverview Hook for accessing the theme context.
 */

import { useContext } from "react";

import { ThemeContext, type ThemeContextType } from "@/contexts/ThemeContext";

/**
 * Hook for using the Theme context.
 *
 * @returns The theme context.
 * @throws {Error} If used outside of a ThemeProvider.
 *
 * @example
 * ```tsx
 * function ThemeToggle() {
 *   const { theme, setTheme, effectiveTheme } = useTheme();
 *
 *   return (
 *     <div>
 *       <button onClick={() => setTheme('light')}>Light</button>
 *       <button onClick={() => setTheme('dark')}>Dark</button>
 *       <button onClick={() => setTheme('system')}>System</button>
 *       <div>Current Theme: {theme} (Effective: {effectiveTheme})</div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
