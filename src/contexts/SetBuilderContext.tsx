/**
 * @fileoverview Defines the context for the Set Builder feature in the MHWS Set Builder.
 *
 * This file contains the state shape, actions, and context definition for
 * managing the armor set creation process, both in manual and automatic modes.
 */

import { createContext } from "react";

import type {
  Accessory,
  Armor,
  Charm,
  EquipmentCellType,
  EquipmentSet,
  FinalSet,
  SelectionContext,
  SkillWithLevel,
  Slot,
  Weapon,
} from "@/types";

/**
 * Describes the state of the Set Builder.
 */
interface SetBuilderState {
  /** The current mode of the builder: 'manual' or 'auto'. */
  mode: "manual" | "auto";
  /** The list of skills required for the auto-search. */
  requiredSkills: SkillWithLevel[];
  /** The list of optimal sets found by the search algorithm. */
  searchResults: FinalSet[];
  /** True if the search is currently in progress. */
  isSearching: boolean;
  /** Current search progress (0-100), or null if not searching. */
  searchProgress: number | null;
  /** Current search status message. */
  searchStatus: string;
  /** The equipment set currently being built or displayed. */
  currentEquipmentSet: EquipmentSet;
  /** The context for the current selection (e.g., choosing a helmet or an accessory). */
  selectionContext: SelectionContext | null;
  /** True if the search results modal is open. */
  isResultsModalOpen: boolean;
  /** A record of which equipment slots are locked and should not be changed by the search. */
  lockedSlots: Record<EquipmentCellType, boolean>;
  /** The current view in auto mode ('requirements', 'results', or 'summary'). */
  autoModeView: "requirements" | "results" | "summary";
  /** True if the search confirmation dialog is open. */
  isSearchConfirmOpen: boolean;
}

/**
 * Defines the actions available in the Set Builder.
 */
interface SetBuilderActions {
  /** Sets the builder mode. */
  setMode: (mode: "manual" | "auto") => void;
  /** Adds a skill to the required skills list or updates its level if it already exists. */
  addRequiredSkill: (skill: SkillWithLevel) => void;
  /** Updates the level of a required skill. If level is <= 0, the skill is removed. */
  updateRequiredSkillLevel: (skillId: string, newLevel: number) => void;
  /** Initiates the search process, showing a confirmation if necessary. */
  startSearch: () => void;
  /** Confirms and executes the search for optimal sets. */
  confirmSearch: () => Promise<void>;
  /** Cancels the search confirmation. */
  cancelSearch: () => void;
  /** Loads a selected search result into the main builder view. */
  loadSetToBuilder: (set: FinalSet) => void;
  /** Handles a click on an equipment slot to open the selection panel. */
  handleEqSlotClick: (type: EquipmentCellType) => void;
  /** Handles the selection of an equipment piece (armor, weapon, charm). */
  handleEqSelect: (item: Armor | Weapon | Charm) => void;
  /** Handles a click on an accessory slot to open the accessory selection panel. */
  handleSlotClick: (
    slotType: EquipmentCellType,
    slotIndex: number,
    slot: Slot,
  ) => void;
  /** Handles the selection of an accessory for a specific slot. */
  handleAccessorySelect: (accessory: Accessory) => void;
  /** Sets the visibility of the search results modal. */
  setIsResultsModalOpen: (isOpen: boolean) => void;
  /** Toggles the locked state of an equipment slot. */
  toggleSlotLock: (type: EquipmentCellType) => void;
  /** Sets the current view in auto mode. */
  setAutoModeView: (view: "requirements" | "results" | "summary") => void;
  /** Resets the builder state, clearing required skills and non-locked equipment. */
  resetBuilder: () => void;
  /** Clears a single, non-locked equipment slot. */
  clearEquipmentSlot: (type: EquipmentCellType) => void;
}

/**
 * React context for the Set Builder.
 */
export const SetBuilderContext = createContext<
  (SetBuilderState & SetBuilderActions) | undefined
>(undefined);
