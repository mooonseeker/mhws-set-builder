/**
 * MHWS护石管理器 - 主题Context
 *
 * 使用Context API管理应用主题状态，支持亮色、暗色和跟随系统三种模式
 */

import { createContext, useContext, useEffect, useState } from "react";

import type { ReactNode } from "react";

/**
 * 主题类型
 */
export type Theme = "light" | "dark" | "system";

/**
 * 主题Context类型
 */
export interface ThemeContextType {
  /** 用户选择的主题 */
  theme: Theme;
  /** 切换主题方法 */
  setTheme: (theme: Theme) => void;
  /** 实际应用的主题（计算后） */
  effectiveTheme: "light" | "dark";
}

/**
 * 主题Context
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * 主题Provider组件
 *
 * 提供主题全局状态管理，包括：
 * - 从LocalStorage加载用户主题偏好
 * - 检测系统主题偏好
 * - 监听系统主题变化
 * - 应用主题到DOM
 * - 持久化用户选择
 *
 * @param children - 子组件
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // 1. 从localStorage读取初始主题
  const [theme, setThemeState] = useState<Theme>(() => {
    // 在客户端环境下读取localStorage
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("theme");
        return (stored as Theme) || "system";
      } catch (error) {
        console.warn("Failed to read theme from localStorage:", error);
        return "system";
      }
    }
    return "system";
  });

  // 2. 计算实际应用的主题
  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">(() => {
    // 初始计算
    if (theme === "system") {
      if (typeof window !== "undefined") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }
      return "light";
    }
    return theme;
  });

  // 3. 监听系统主题变化
  useEffect(() => {
    if (theme !== "system") {
      return; // 只有在系统模式下才监听
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    /**
     * 处理系统主题变化
     */
    const handleChange = () => {
      setEffectiveTheme(mediaQuery.matches ? "dark" : "light");
    };

    // 初始设置
    handleChange();

    // 添加监听器
    mediaQuery.addEventListener("change", handleChange);

    // 清理监听器
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [theme]);

  // 4. 应用主题到DOM
  useEffect(() => {
    const root = document.documentElement;

    // 移除现有的主题类
    root.classList.remove("light", "dark");
    // 添加当前主题类
    root.classList.add(effectiveTheme);
  }, [effectiveTheme]);

  // 5. 切换主题方法
  /**
   * 切换主题
   *
   * @param newTheme - 新的主题
   */
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);

    // 保存到localStorage
    try {
      localStorage.setItem("theme", newTheme);
    } catch (error) {
      console.warn("Failed to save theme to localStorage:", error);
    }

    // 如果切换到非系统模式，直接设置effectiveTheme
    if (newTheme !== "system") {
      setEffectiveTheme(newTheme);
    } else {
      // 如果切换到系统模式，重新计算effectiveTheme
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
