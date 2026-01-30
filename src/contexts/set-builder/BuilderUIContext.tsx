/**
 * @fileoverview Context definition for UI and selection state.
 * Defines the contract for view modes, selection interactions, and workflow orchestration.
 */

import { createContext } from "react";

import type {
  EquipmentCellType,
  FinalSet,
  SelectionContext,
  Slot,
} from "@/types";

/**
 * Defines the shape of the Builder UI Context.
 */
export interface BuilderUIContextValue {
  /** The current operating mode of the builder. */
  mode: "manual" | "auto";

  /** Sets the builder mode. */
  setMode: (mode: "manual" | "auto") => void;

  /** The current view displayed in Auto Mode. */
  autoModeView: "requirements" | "results" | "summary";

  /** Sets the view for Auto Mode. */
  setAutoModeView: (view: "requirements" | "results" | "summary") => void;

  /** The current context for item selection (e.g., which slot is being modified). */
  selectionContext: SelectionContext | null;

  /** Updates the selection context. Pass null to close selectors. */
  setSelectionContext: (context: SelectionContext | null) => void;

  /**
   * Handles a click on an equipment slot.
   * Toggles selection or opens the equipment selector.
   */
  handleEqSlotClick: (type: EquipmentCellType) => void;

  /**
   * Handles a click on an accessory slot.
   * Opens the accessory selector.
   */
  handleSlotClick: (
    slotType: EquipmentCellType,
    slotIndex: number,
    slot: Slot,
  ) => void;

  /** Whether the search confirmation dialog is currently open. */
  isSearchConfirmOpen: boolean;

  /** Opens the search confirmation dialog. */
  openSearchConfirm: () => void;

  /** Closes the search confirmation dialog. */
  closeSearchConfirm: () => void;

  /**
   * Initiates the search flow.
   * May open a confirmation dialog if there are existing unlocked items,
   * otherwise triggers the search immediately.
   */
  startSearch: () => void;

  /**
   * Executes the search and switches the view to 'results'.
   * Should be called after confirmation.
   */
  confirmSearch: () => Promise<void>;

  /**
   * Loads a search result into the builder and switches to the summary view.
   * @param set The selected final set.
   */
  loadSetToBuilder: (set: FinalSet) => void;
}

export const BuilderUIContext = createContext<
  BuilderUIContextValue | undefined
>(undefined);
