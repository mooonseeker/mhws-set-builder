/**
 * @fileoverview Provides a global state for theme management in the MHWS Set Builder.
 *
 * This provider handles loading and saving the user's theme preference,
 * detecting the system theme, and applying it to the application.
 */

import { useEffect, useState, type ReactNode } from "react";

import {
  ThemeContext,
  type Theme,
  type ThemeContextType,
} from "./ThemeContext";

/**
 * Provides the theme state to its children.
 *
 * This component manages the global theme state, including:
 * - Loading the user's theme preference from localStorage.
 * - Detecting and responding to the system's color scheme.
 * - Applying the theme class to the root HTML element.
 * - Persisting the user's choice to localStorage.
 *
 * @param children - The child components to be rendered within this provider.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // 1. Initialize theme state from localStorage or default to "system".
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return "system";
    }
    try {
      const stored = localStorage.getItem("theme");
      return (stored as Theme) || "system";
    } catch (error) {
      console.warn("Failed to read theme from localStorage:", error);
      return "system";
    }
  });

  // 2. Calculate the effective theme to be applied.
  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">(() => {
    if (theme !== "system") {
      return theme;
    }
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light"; // Default for SSR or non-browser environments.
  });

  // 3. Listen for changes in the system's color scheme.
  useEffect(() => {
    // This effect should only run when the theme is set to 'system'.
    if (theme !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      setEffectiveTheme(mediaQuery.matches ? "dark" : "light");
    };

    // Set the initial state correctly.
    handleChange();

    // Add listener for future changes.
    mediaQuery.addEventListener("change", handleChange);

    // Clean up the listener on component unmount or when theme changes.
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [theme]);

  // 4. Apply the effective theme to the root DOM element.
  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove("light", "dark");
    root.classList.add(effectiveTheme);
  }, [effectiveTheme]);

  // 5. Provide a function to update the theme.
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);

    // Persist the new theme to localStorage.
    try {
      localStorage.setItem("theme", newTheme);
    } catch (error) {
      console.warn("Failed to save theme to localStorage:", error);
    }

    // Update the effective theme immediately.
    if (newTheme !== "system") {
      setEffectiveTheme(newTheme);
    } else {
      // When switching to 'system', re-evaluate the system's current preference.
      setEffectiveTheme(
        window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light",
      );
    }
  };

  const value: ThemeContextType = {
    theme,
    setTheme,
    effectiveTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
