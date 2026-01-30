/**
 * @fileoverview Logic for managing the equipment set and slot locks.
 * Handles the CRUD operations for the equipment data model.
 */

import { useState } from "react";

import { cloneDeep } from "lodash-es";

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
 * Manages the state of the equipment set and lock status.
 * @returns The equipment state and manipulation methods.
 */
export function useEquipmentModel() {
  const [currentEquipmentSet, setCurrentEquipmentSet] = useState<EquipmentSet>(
    {},
  );
  const [lockedSlots, setLockedSlots] = useState<
    Record<EquipmentCellType, boolean>
  >({
    weapon: false,
    helm: false,
    body: false,
    arm: false,
    waist: false,
    leg: false,
    charm: false,
  });

  const updateEquipment = (
    type: EquipmentCellType,
    item: Armor | Weapon | Charm,
  ) => {
    // Initialize accessories array with nulls matching the slot count
    const newSlottedEq = {
      equipment: item,
      accessories: Array(item.slots.length).fill(null) as (Accessory | null)[],
    };

    setCurrentEquipmentSet((prev) => ({
      ...prev,
      [type]: newSlottedEq,
    }));
  };

  const updateAccessory = (
    slotType: EquipmentCellType,
    slotIndex: number,
    accessory: Accessory,
  ) => {
    setCurrentEquipmentSet((prev) => {
      const newSet = { ...prev };
      const targetSlot = newSet[slotType as keyof EquipmentSet];
      if (targetSlot) {
        const newAccessories = [...targetSlot.accessories];
        newAccessories[slotIndex] = accessory;
        return {
          ...newSet,
          [slotType]: { ...targetSlot, accessories: newAccessories },
        };
      }
      return newSet;
    });
  };

  const toggleSlotLock = (type: EquipmentCellType) => {
    setLockedSlots((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const lockAllEqSlots = () => {
    setLockedSlots({
      weapon: true,
      helm: true,
      body: true,
      arm: true,
      waist: true,
      leg: true,
      charm: true,
    });
  };

  const unlockAllEqSlots = () => {
    setLockedSlots({
      weapon: false,
      helm: false,
      body: false,
      arm: false,
      waist: false,
      leg: false,
      charm: false,
    });
  };

  const clearEquipmentSlot = (type: EquipmentCellType) => {
    setCurrentEquipmentSet((prev) => {
      const newSet = { ...prev };
      if (!lockedSlots[type]) {
        delete newSet[type];
      }
      return newSet;
    });
  };

  const clearAllEqSlots = () => {
    setCurrentEquipmentSet((prev) => {
      const newSet = { ...prev };
      Object.keys(newSet).forEach((key) => {
        const equipmentType = key as EquipmentCellType;
        if (!lockedSlots[equipmentType]) {
          delete newSet[equipmentType];
        }
      });
      return newSet;
    });
  };

  const applyFinalSet = (finalSet: FinalSet) => {
    const newEquipmentSet = cloneDeep(finalSet.equipment);

    // Hydrate the accessories from the FinalSet map into the EquipmentSet structure
    for (const key in newEquipmentSet) {
      const equipmentKey = key as keyof EquipmentSet;
      const slottedEquipment = newEquipmentSet[equipmentKey];

      if (slottedEquipment) {
        const equipmentId = slottedEquipment.equipment.id;
        const decorationsForEquipment =
          finalSet.accessories.get(equipmentId) ?? [];

        const newAccessories = Array(
          slottedEquipment.equipment.slots.length,
        ).fill(null) as (Accessory | null)[];

        decorationsForEquipment.forEach((acc, index) => {
          if (index < newAccessories.length) {
            newAccessories[index] = acc;
          }
        });

        slottedEquipment.accessories = newAccessories;
      }
    }

    setCurrentEquipmentSet(newEquipmentSet);
    // Lock all slots to prevent accidental changes after loading a set
    lockAllEqSlots();
  };

  return {
    currentEquipmentSet,
    lockedSlots,
    updateEquipment,
    updateAccessory,
    toggleSlotLock,
    lockAllEqSlots,
    unlockAllEqSlots,
    clearEquipmentSlot,
    clearAllEqSlots,
    applyFinalSet,
    setCurrentEquipmentSet,
  };
}
