/**
 * MHWS护石管理器 - 配装器Context定义
 *
 * 仅包含Context定义和类型，以避免React Fast Refresh警告
 */

import { createContext } from "react";

import type {
  Accessory,
  Armor,
  Charm,
  EquipmentSet,
  EquipmentCellType,
  Slot,
  SkillWithLevel,
  Weapon,
} from "@/types";
import type { FinalSet, SelectionContext } from "@/types/set-builder";

interface SetBuilderState {
  mode: "manual" | "auto";
  requiredSkills: SkillWithLevel[];
  searchResults: FinalSet[];
  isSearching: boolean;
  currentEquipmentSet: EquipmentSet;
  selectionContext: SelectionContext | null;
  isResultsModalOpen: boolean;
  lockedSlots: Record<EquipmentCellType, boolean>;
  autoModeView: "requirements" | "results" | "summary";
  isSearchConfirmOpen: boolean;
}

interface SetBuilderActions {
  setMode: (mode: "manual" | "auto") => void;
  addRequiredSkill: (skill: SkillWithLevel) => void;
  updateRequiredSkillLevel: (skillId: string, newLevel: number) => void;
  startSearch: () => void;
  confirmSearch: () => Promise<void>;
  cancelSearch: () => void;
  loadSetToBuilder: (set: FinalSet) => void;
  handleEqSlotClick: (type: EquipmentCellType) => void;
  handleEqSelect: (item: Armor | Weapon | Charm) => void;
  handleSlotClick: (
    slotType: EquipmentCellType,
    slotIndex: number,
    slot: Slot,
  ) => void;
  handleAccessorySelect: (accessory: Accessory) => void;
  setIsResultsModalOpen: (isOpen: boolean) => void;
  toggleSlotLock: (type: EquipmentCellType) => void;
  setAutoModeView: (view: "requirements" | "results" | "summary") => void;
  resetBuilder: () => void;
  clearEquipmentSlot: (type: EquipmentCellType) => void;
}

export const SetBuilderContext = createContext<
  (SetBuilderState & SetBuilderActions) | undefined
>(undefined);
