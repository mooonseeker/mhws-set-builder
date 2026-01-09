/**
 * @fileoverview Navigation component for switching between application modules.
 */

import { Database, List, Settings, TextSearch } from "lucide-react";

import { Button } from "@/components/ui/button";

export type NavigationTab = "database" | "charms" | "set-builder" | "settings";

/** Props for the Navigation component. */
interface NavigationProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

/**
 * Navigation bar using tabs to switch between different functional modules.
 */
export function Navigation({ currentTab, onTabChange }: NavigationProps) {
  const tabs = [
    { id: "database" as const, label: "数据库管理", icon: Database },
    { id: "charms" as const, label: "护石管理", icon: List },
    { id: "set-builder" as const, label: "配装器", icon: TextSearch },
    { id: "settings" as const, label: "设置", icon: Settings },
  ];

  return (
    <nav className="bg-card">
      <div className="mx-auto w-[98%] px-4 sm:px-6 md:px-8 lg:px-10 2xl:w-[80%]">
        <div className="flex gap-0.5 sm:gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              onClick={() => onTabChange(id)}
              className={`mobile-landscape:py-1.5 -mb-px flex min-w-30 items-center justify-center gap-1.5 rounded-t-md rounded-b-none border-2 px-6 py-2 transition-colors sm:min-w-35 sm:gap-2 sm:px-8 sm:py-2.5 md:min-w-40 md:px-12 md:py-3 landscape:py-2 ${
                currentTab === id
                  ? "bg-background text-foreground border-foreground border-b-background"
                  : "border-transparent"
              } `}
            >
              <Icon className="mobile-landscape:h-4 mobile-landscape:w-4 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="mobile-landscape:text-sm hidden text-sm sm:inline md:text-base">
                {label}
              </span>
            </Button>
          ))}
        </div>
      </div>
    </nav>
  );
}
