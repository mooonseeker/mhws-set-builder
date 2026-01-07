/**
 * @fileoverview Composes all context providers for the MHWS Set Builder application.
 *
 * This component wraps the entire application, providing a unified state
 * management layer by nesting all necessary context providers.
 */

import type { ReactNode } from "react";

import { AccessoryProvider } from "./AccessoryProvider";
import { ArmorProvider } from "./ArmorProvider";
import { CharmProvider } from "./CharmProvider";
import { SetBuilderProvider } from "./SetBuilderProvider";
import { SkillProvider } from "./SkillProvider";
import { ThemeProvider } from "./ThemeProvider";
import { WeaponProvider } from "./WeaponProvider";

/**
 * The root context provider for the application.
 *
 * It composes all individual context providers in the correct dependency order:
 * 1.  `ThemeProvider` - Global theme settings (no dependencies).
 * 2.  `SkillProvider` - Provides skill data, a dependency for many other contexts.
 * 3.  `AccessoryProvider` - Manages accessory data.
 * 4.  `ArmorProvider` - Manages armor data.
 * 5.  `WeaponProvider` - Manages weapon data.
 * 6.  `CharmProvider` - Manages charm data.
 * 7.  `SetBuilderProvider` - The main feature, depends on all the above data contexts.
 *
 * @param {object} props - The component props.
 * @param {ReactNode} props.children - The root component of the application.
 * @returns {JSX.Element} The nested provider structure.
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
              <CharmProvider>
                <SetBuilderProvider>{children}</SetBuilderProvider>
              </CharmProvider>
            </WeaponProvider>
          </ArmorProvider>
        </AccessoryProvider>
      </SkillProvider>
    </ThemeProvider>
  );
}
