import { useContext } from "react";
import { ThemeContext } from "@/contexts/ThemeContext";
import type { ThemeContextType } from "@/contexts/ThemeContext";

/**
 * 使用主题Context的Hook
 *
 * @returns 主题Context
 * @throws {Error} 如果在ThemeProvider外部使用
 *
 * @example
 * ```tsx
 * function ThemeToggle() {
 *   const { theme, setTheme, effectiveTheme } = useTheme();
 *
 *   return (
 *     <div>
 *       <button onClick={() => setTheme('light')}>亮色</button>
 *       <button onClick={() => setTheme('dark')}>暗色</button>
 *       <button onClick={() => setTheme('system')}>跟随系统</button>
 *       <div>当前主题: {theme} (实际: {effectiveTheme})</div>
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
