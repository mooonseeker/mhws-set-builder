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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSetBuilder } from "@/hooks";

/**
 * General action buttons for the Set Builder (Lock All, Unlock All, Reset).
 */
export function SetBuilderActions() {
  const { clearAllEqSlots, lockAllEqSlots, unlockAllEqSlots } = useSetBuilder();

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="px-2.5"
              onClick={lockAllEqSlots}
            >
              <Lock className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>全部锁定</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="px-2.5"
              onClick={unlockAllEqSlots}
            >
              <Unlock className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>全部解锁</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="px-2.5"
              onClick={clearAllEqSlots}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>重置</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

/**
 * Action buttons for Auto Mode (Search, Stop).
 */
export function SetBuilderAutoActions() {
  const { startSearch, isSearching, stopSearch } = useSetBuilder();

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Button onClick={startSearch} disabled={isSearching} size="sm">
          <Search className="mr-2 h-4 w-4" />
          搜索
        </Button>
        {isSearching && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="px-2.5"
                onClick={stopSearch}
              >
                <Square className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>停止搜索</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
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
      <ToggleGroupItem value="requirements" tooltip="技能需求" className="px-3">
        <Sparkles className="h-4 w-4" />
        技能需求
      </ToggleGroupItem>
      <ToggleGroupItem value="results" tooltip="搜索结果" className="px-3">
        <ClipboardList className="h-4 w-4" />
        搜索结果
      </ToggleGroupItem>
      <ToggleGroupItem value="summary" tooltip="套装汇总" className="px-3">
        <ScrollText className="h-4 w-4" />
        套装汇总
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
