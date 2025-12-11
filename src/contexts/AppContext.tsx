/**
 * MHWS护石管理器 - 应用Context
 *
 * 组合所有Context Provider，提供统一的应用状态管理
 */

import type { ReactNode } from "react";

import { AccessoryProvider } from "./AccessoryContext";
import { ArmorProvider } from "./ArmorContext";
import { CharmProvider } from "./CharmContext";
import { SkillProvider } from "./SkillContext";
import { ThemeProvider } from "./ThemeContext";
import { WeaponProvider } from "./WeaponContext";

/**
 * 应用的根Context Provider
 *
 * 组合所有Context Provider，按照依赖顺序嵌套：
 * 1. ThemeProvider - 主题设置（全局，不依赖其他Context）
 * 2. SkillProvider - 技能数据（护石依赖技能数据）
 * 3. AccessoryProvider - 装饰品数据
 * 4. ArmorProvider - 防具数据
 * 5. WeaponProvider - 武器数据
 * 6. CharmProvider - 护石数据
 *
 * @param children - 应用的根组件
 *
 * @example
 * ```tsx
 * import { AppProvider } from '@/contexts';
 *
 * function App() {
 *   return (
 *     <AppProvider>
 *       <MainContent />
 *     </AppProvider>
 *   );
 * }
 * ```
 */
export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SkillProvider>
        <AccessoryProvider>
          <ArmorProvider>
            <WeaponProvider>
              <CharmProvider>{children}</CharmProvider>
            </WeaponProvider>
          </ArmorProvider>
        </AccessoryProvider>
      </SkillProvider>
    </ThemeProvider>
  );
}
