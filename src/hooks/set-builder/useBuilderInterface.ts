/**
 * @fileoverview Logic for managing the UI state and selection flow.
 * Handles view switching, modal states, and the orchestration of the search workflow.
 */

import { useState } from "react";

import type {
  EquipmentCellType,
  EquipmentSet,
  FinalSet,
  SelectionContext,
  Slot,
} from "@/types";

interface BuilderInterfaceOptions {
  lockedSlots: Record<EquipmentCellType, boolean>;
  currentEquipmentSet: EquipmentSet;
  /** The raw search function to be executed. */
  performSearch: () => Promise<void>;
  /** Function to apply a selected set to the builder. */
  applyFinalSet: (set: FinalSet) => void;
}

/**
 * Manages the user interface state for the set builder.
 * @param options Configuration and dependencies.
 * @returns The UI state and event handlers.
 */
export function useBuilderInterface({
  lockedSlots,
  currentEquipmentSet,
  performSearch,
  applyFinalSet,
}: BuilderInterfaceOptions) {
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [autoModeView, setAutoModeViewState] = useState<
    "requirements" | "results" | "summary"
  >("requirements");
  const [selectionContext, setSelectionContext] =
    useState<SelectionContext | null>(null);
  const [isSearchConfirmOpen, setIsSearchConfirmOpen] = useState(false);

  const handleEqSlotClick = (type: EquipmentCellType) => {
    if (lockedSlots[type]) {
      return;
    }

    // Toggle selection: if clicking the same slot, deselect it.
    if (
      selectionContext?.type === "equipment" &&
      selectionContext.equipmentType === type
    ) {
      setSelectionContext(null);
    } else {
      setSelectionContext({ type: "equipment", equipmentType: type });
    }
  };

  const handleSlotClick = (
    slotType: EquipmentCellType,
    slotIndex: number,
    slot: Slot,
  ) => {
    setSelectionContext({ type: "accessory", slotType, slotIndex, slot });
  };

  const setAutoModeView = (view: "requirements" | "results" | "summary") => {
    setAutoModeViewState(view);
  };

  const openSearchConfirm = () => setIsSearchConfirmOpen(true);
  const closeSearchConfirm = () => setIsSearchConfirmOpen(false);

  // Wrapper for the search action that handles UI side effects
  const confirmSearch = async () => {
    setIsSearchConfirmOpen(false);
    setAutoModeView("results"); // Switch to results view immediately
    await performSearch();
  };

  const startSearch = () => {
    // Check if there are any items that might be lost if a search is started
    const hasUnlockedItems = Object.entries(currentEquipmentSet).some(
      ([type, eq]) => eq && !lockedSlots[type as EquipmentCellType],
    );
    const hasAccessories = (
      Object.values(currentEquipmentSet) as (
        | { accessories: unknown[] }
        | undefined
      )[]
    ).some((eq) => {
      if (!eq) return false;
      return eq.accessories.some((acc) => acc !== null);
    });

    if (hasUnlockedItems || hasAccessories) {
      setIsSearchConfirmOpen(true);
    } else {
      void confirmSearch();
    }
  };

  const loadSetToBuilder = (finalSet: FinalSet) => {
    applyFinalSet(finalSet);
    setAutoModeView("summary");
  };

  return {
    mode,
    setMode,
    autoModeView,
    setAutoModeView,
    selectionContext,
    setSelectionContext,
    handleEqSlotClick,
    handleSlotClick,
    isSearchConfirmOpen,
    openSearchConfirm,
    closeSearchConfirm,
    startSearch,
    confirmSearch,
    loadSetToBuilder,
  };
}
