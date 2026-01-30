/**
 * @fileoverview Context definition for equipment state management.
 * Defines the contract for accessing and modifying the current equipment set.
 */

import { createContext } from "react";

import type {
  Accessory,
  Armor,
  Charm,
  EquipmentCellType,
  EquipmentSet,
  FinalSet,
  Weapon,
} from "@/types";

/**
 * Defines the shape of the Equipment Context.
 */
export interface EquipmentContextValue {
  /** The current configuration of equipment selected by the user. */
  currentEquipmentSet: EquipmentSet;

  /**
   * A map indicating which equipment slots are locked.
   * Locked slots are preserved during automated searches or bulk clearing.
   */
  lockedSlots: Record<EquipmentCellType, boolean>;

  /**
   * Updates the equipment for a specific slot type.
   * @param type The type of equipment slot (e.g., 'helm', 'weapon').
   * @param item The equipment item to equip.
   */
  updateEquipment: (
    type: EquipmentCellType,
    item: Armor | Weapon | Charm,
  ) => void;

  /**
   * Updates an accessory within a specific equipment slot.
   * @param slotType The type of the parent equipment (e.g., 'helm').
   * @param slotIndex The index of the decoration slot (0-based).
   * @param accessory The accessory to insert.
   */
  updateAccessory: (
    slotType: EquipmentCellType,
    slotIndex: number,
    accessory: Accessory,
  ) => void;

  /**
   * Toggles the lock state of a specific equipment slot.
   * @param type The slot type to toggle.
   */
  toggleSlotLock: (type: EquipmentCellType) => void;

  /** Locks all equipment slots. */
  lockAllEqSlots: () => void;

  /** Unlocks all equipment slots. */
  unlockAllEqSlots: () => void;

  /**
   * Clears a specific equipment slot if it is not locked.
   * @param type The slot type to clear.
   */
  clearEquipmentSlot: (type: EquipmentCellType) => void;

  /** Clears all unlocked equipment slots. */
  clearAllEqSlots: () => void;

  /**
   * Applies a complete set (usually from search results) to the builder.
   * This action typically locks all slots after application.
   * @param finalSet The calculated set to apply.
   */
  applyFinalSet: (finalSet: FinalSet) => void;
}

export const EquipmentContext = createContext<
  EquipmentContextValue | undefined
>(undefined);
