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
import {
  BuilderUIProvider,
  EquipmentProvider,
  SearchProvider,
} from "./set-builder";
import { SettingsProvider } from "./SettingsProvider";
import { SkillProvider } from "./SkillProvider";
import { ThemeProvider } from "./ThemeProvider";
import { WeaponProvider } from "./WeaponProvider";

/**
 * The root context provider for the application.
 *
 * It composes all individual context providers in the correct dependency order:
 * 1.  `ThemeProvider` - Global theme settings (no dependencies).
 * 2.  `SettingsProvider` - Global application settings.
 * 3.  `SkillProvider` - Provides skill data, a dependency for many other contexts.
 * 4.  `AccessoryProvider` - Manages accessory data.
 * 5.  `ArmorProvider` - Manages armor data.
 * 6.  `WeaponProvider` - Manages weapon data.
 * 7.  `CharmProvider` - Manages charm data.
 * 8.  `EquipmentProvider` - Base equipment state for the Set Builder.
 * 9.  `SearchProvider` - Search service for the Set Builder (depends on equipment).
 * 10. `BuilderUIProvider` - UI and selection flow (depends on equipment and search).
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
      <SettingsProvider>
        <SkillProvider>
          <AccessoryProvider>
            <ArmorProvider>
              <WeaponProvider>
                <CharmProvider>
                  <EquipmentProvider>
                    <SearchProvider>
                      <BuilderUIProvider>{children}</BuilderUIProvider>
                    </SearchProvider>
                  </EquipmentProvider>
                </CharmProvider>
              </WeaponProvider>
            </ArmorProvider>
          </AccessoryProvider>
        </SkillProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
