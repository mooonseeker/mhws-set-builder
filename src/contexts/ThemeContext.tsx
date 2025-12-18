/**
 * MHWS护石管理器 - 主题Context定义
 *
 * 仅包含Context定义和类型，以避免React Fast Refresh警告
 */

import { createContext } from "react";

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
export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);
