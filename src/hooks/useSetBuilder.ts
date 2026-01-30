/**
 * @fileoverview Facade hook for accessing the Set Builder feature.
 * Aggregates functionality from Equipment, Search, and UI contexts into a single API.
 */

import { useCallback, useContext } from "react";

import {
  BuilderUIContext,
  EquipmentContext,
  SearchContext,
} from "@/contexts/set-builder";

/**
 * Hook for using the Set Builder context.
 *
 * This hook acts as a facade, aggregating state and actions from the underlying
 * modular contexts (Equipment, Search, UI) to provide a unified interface for consumers.
 *
 * @returns The aggregated set builder context and actions.
 * @throws {Error} If used outside of the required provider hierarchy.
 */
export const useSetBuilder = () => {
  const eq = useContext(EquipmentContext);
  const search = useContext(SearchContext);
  const ui = useContext(BuilderUIContext);

  if (!eq || !search || !ui) {
    throw new Error(
      "useSetBuilder must be used within EquipmentProvider, SearchProvider, and BuilderUIProvider",
    );
  }

  // Orchestration logic: Reset the entire builder state across all domains.
  const resetBuilder = useCallback(() => {
    search.resetRequiredSkills();
    search.setSearchResults([]);
    eq.clearAllEqSlots();
  }, [search, eq]);

  // Return an aggregated object matching the original SetBuilderContext shape.
  return {
    // UI State
    mode: ui.mode,
    autoModeView: ui.autoModeView,
    isSearchConfirmOpen: ui.isSearchConfirmOpen,
    selectionContext: ui.selectionContext,

    // Search State
    requiredSkills: search.requiredSkills,
    searchResults: search.searchResults,
    isSearching: search.isSearching,
    searchProgress: search.searchProgress,
    searchStatus: search.searchStatus,

    // Equipment State
    currentEquipmentSet: eq.currentEquipmentSet,
    lockedSlots: eq.lockedSlots,

    // Actions
    setMode: ui.setMode,
    setAutoModeView: ui.setAutoModeView,

    // Search Actions
    addRequiredSkill: search.addRequiredSkill,
    updateRequiredSkillLevel: search.updateRequiredSkillLevel,
    resetRequiredSkills: search.resetRequiredSkills,
    startSearch: ui.startSearch, // Uses UI wrapper for view switching
    confirmSearch: ui.confirmSearch, // Uses UI wrapper for view switching
    cancelSearch: ui.closeSearchConfirm,

    // Equipment Actions
    loadSetToBuilder: ui.loadSetToBuilder, // Uses UI wrapper for view switching
    handleEqSlotClick: ui.handleEqSlotClick,
    handleSlotClick: ui.handleSlotClick,
    handleEqSelect: eq.updateEquipment,
    handleAccessorySelect: eq.updateAccessory,

    // Locking & Clearing
    toggleSlotLock: eq.toggleSlotLock,
    lockAllEqSlots: eq.lockAllEqSlots,
    unlockAllEqSlots: eq.unlockAllEqSlots,
    clearAllEqSlots: eq.clearAllEqSlots,
    clearEquipmentSlot: eq.clearEquipmentSlot,

    // Orchestration
    resetBuilder,

    // Expose raw contexts for advanced usage if needed
    _eq: eq,
    _search: search,
    _ui: ui,
  };
};
