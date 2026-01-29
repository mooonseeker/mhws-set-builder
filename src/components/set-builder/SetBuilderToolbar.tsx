/**
 * @fileoverview Toolbar components for Set Builder actions and view toggles.
 */

import {
  ClipboardList,
  Lock,
  RefreshCw,
  ScrollText,
  Search,
  Sparkles,
  Square,
  Unlock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSetBuilder } from "@/hooks";

/**
 * General action buttons for the Set Builder (Lock All, Unlock All, Reset).
 */
export function SetBuilderActions() {
  const { clearAllEqSlots, lockAllEqSlots, unlockAllEqSlots } = useSetBuilder();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="px-2.5"
        onClick={lockAllEqSlots}
        title="全部锁定"
      >
        <Lock className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="px-2.5"
        onClick={unlockAllEqSlots}
        title="全部解锁"
      >
        <Unlock className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="px-2.5"
        onClick={clearAllEqSlots}
        title="重置"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
}

/**
 * Action buttons for Auto Mode (Search, Stop).
 */
export function SetBuilderAutoActions() {
  const { startSearch, isSearching } = useSetBuilder();

  return (
    <div className="flex items-center gap-2">
      <Button onClick={startSearch} disabled={isSearching} size="sm">
        <Search className="mr-2 h-4 w-4" />
        搜索
      </Button>
      {isSearching && (
        <Button
          variant="outline"
          size="sm"
          className="px-2.5"
          onClick={() => console.log("Stop clicked")}
        >
          <Square className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

/**
 * Toggle group for switching between different views in auto mode.
 */
export function AutoModeViewToggle() {
  const { autoModeView, setAutoModeView } = useSetBuilder();

  return (
    <ToggleGroup
      type="single"
      value={autoModeView}
      onValueChange={(v) =>
        v && setAutoModeView(v as "requirements" | "results" | "summary")
      }
      size="sm"
      className="border-border rounded-md border p-1"
    >
      <ToggleGroupItem
        value="requirements"
        aria-label="技能需求"
        className="px-3"
      >
        <Sparkles className="h-4 w-4" />
        技能需求
      </ToggleGroupItem>
      <ToggleGroupItem value="results" aria-label="搜索结果" className="px-3">
        <ClipboardList className="h-4 w-4" />
        搜索结果
      </ToggleGroupItem>
      <ToggleGroupItem value="summary" aria-label="套装汇总" className="px-3">
        <ScrollText className="h-4 w-4" />
        套装汇总
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
