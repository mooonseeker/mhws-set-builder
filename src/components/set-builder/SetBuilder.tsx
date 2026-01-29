/**
 * @fileoverview Main container component for the Set Builder feature.
 */

import { Hand, Search } from "lucide-react";

import {
  AccessorySelector,
  EquipmentCell,
  EquipmentSelector,
} from "@/components/entities";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSetBuilder } from "@/hooks";
import type { Slot } from "@/types";
import type { EquipmentCellType } from "@/types/set-builder";

import { SearchConfirmationDialog } from "./SearchConfirmationDialog";
import { SearchResultsView } from "./SearchResultsView";
import {
  AutoModeViewToggle,
  SetBuilderActions,
  SetBuilderAutoActions,
} from "./SetBuilderToolbar";
import { SetSummary } from "./SetSummary";
import { SkillRequirements } from "./SkillRequirements";

const cellTypes: EquipmentCellType[] = [
  "weapon",
  "helm",
  "body",
  "arm",
  "waist",
  "leg",
  "charm",
];

/**
 * The primary Set Builder component that coordinates between manual and automatic modes.
 */
export function SetBuilder() {
  const {
    mode,
    setMode,
    currentEquipmentSet,
    selectionContext,
    handleEqSlotClick,
    handleSlotClick,
    handleEqSelect,
    handleAccessorySelect,
    lockedSlots,
    toggleSlotLock,
    autoModeView,
    clearEquipmentSlot,
  } = useSetBuilder();

  return (
    <>
      <div className="flex h-full flex-col gap-6">
        <div className="flex shrink-0 flex-col gap-8 lg:flex-row">
          <div className="flex w-full items-center justify-between lg:w-2/5">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">配装器</h1>
              <ToggleGroup
                type="single"
                value={mode}
                onValueChange={(v) => v && setMode(v as "manual" | "auto")}
                size="sm"
                className="border-border rounded-md border p-1"
              >
                <ToggleGroupItem value="manual" tooltip="手动模式">
                  <Hand className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="auto" tooltip="自动模式">
                  <Search className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <SetBuilderActions />
          </div>
          <div className="flex w-full items-center justify-between lg:w-3/5">
            <div>{mode === "auto" && <SetBuilderAutoActions />}</div>
            {mode === "auto" && <AutoModeViewToggle />}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-8 lg:flex-row">
          <div className="flex h-full w-full flex-col items-start justify-between gap-2 lg:w-2/5">
            {cellTypes.map((type) => (
              <EquipmentCell
                key={type}
                type={type}
                isSelected={
                  selectionContext?.type === "equipment" &&
                  selectionContext.equipmentType === type
                }
                slottedEquipment={
                  currentEquipmentSet[type as keyof typeof currentEquipmentSet]
                }
                onEquipmentClick={() => handleEqSlotClick(type)}
                onSlotClick={(slotIndex: number, slot: Slot) =>
                  handleSlotClick(type, slotIndex, slot)
                }
                isLocked={lockedSlots[type]}
                onToggleLock={() => toggleSlotLock(type)}
                onClear={
                  currentEquipmentSet[type] && !lockedSlots[type]
                    ? () => clearEquipmentSlot(type)
                    : undefined
                }
              />
            ))}
          </div>

          <div className="h-full w-full overflow-y-auto lg:w-3/5">
            {selectionContext ? (
              selectionContext.type === "equipment" ? (
                <EquipmentSelector
                  selectingFor={selectionContext.equipmentType}
                  currentEquipment={
                    currentEquipmentSet[
                      selectionContext.equipmentType as keyof typeof currentEquipmentSet
                    ]?.equipment
                  }
                  onSelect={handleEqSelect}
                />
              ) : (
                <AccessorySelector
                  slot={selectionContext.slot}
                  onAccessorySelect={handleAccessorySelect}
                />
              )
            ) : mode === "manual" ? (
              <SetSummary equipmentSet={currentEquipmentSet} />
            ) : // View switching in auto mode
            autoModeView === "requirements" ? (
              <SkillRequirements />
            ) : autoModeView === "results" ? (
              <SearchResultsView />
            ) : (
              <SetSummary equipmentSet={currentEquipmentSet} />
            )}
          </div>
        </div>
      </div>
      <SearchConfirmationDialog />
    </>
  );
}
