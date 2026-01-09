/**
 * @fileoverview ThemeToggle component for switching between light, dark, and system themes.
 */

import { Monitor, Moon, Sun } from "lucide-react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useTheme } from "@/hooks";

/**
 * Theme toggle component providing options for light, dark, and system themes.
 * Uses a ToggleGroup for selection.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <ToggleGroup
      type="single"
      value={theme}
      onValueChange={(newTheme) => {
        if (newTheme) setTheme(newTheme as "light" | "dark" | "system");
      }}
      className="rounded-md border p-1"
    >
      <ToggleGroupItem value="light" tooltip="亮色模式">
        <Sun className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" tooltip="暗色模式">
        <Moon className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="system" tooltip="跟随系统">
        <Monitor className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
