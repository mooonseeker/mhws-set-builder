/**
 * @fileoverview Hook for charm operations in the MHWS Set Builder.
 *
 * This hook encapsulates complex operations for creating, validating,
 * and updating charms.
 */

import { useCallback } from "react";

import { useCharms, useSkills } from "@/hooks";
import type { Charm, SkillWithLevel, Slot } from "@/types";
import {
  calculateCharmEquivalentSlots,
  calculateKeySkillValue,
  generateCharmId,
  isOfficialCharmId,
  validateCharm,
} from "@/utils";

/**
 * Generates a charm name based on its rarity.
 * @param rarity The rarity of the charm.
 * @returns The name of the charm.
 */
const generateCharmNameByRarity = (rarity: number): string => {
  switch (rarity) {
    case 5:
      return "不明护石";
    case 6:
      return "史传护石";
    case 7:
      return "秘史护石";
    case 8:
      return "盛世护石";
    default:
      return "非法护石";
  }
};

/**
 * Hook for charm operations.
 *
 * Provides convenient methods for creating and validating charms, automatically
 * handling:
 * - Equivalent slot calculation
 * - Key skill value calculation
 * - ID generation
 * - Charm validation
 *
 * @returns A collection of charm operation methods.
 *
 * @example
 * ```tsx
 * function CharmForm() {
 *   const { createCharm, validateNewCharm } = useCharmOperations();
 *
 *   const handleSubmit = (data) => {
 *     // First, validate the charm
 *     const validation = validateNewCharm(data);
 *     if (!validation.isValid) {
 *       alert(validation.warnings.join('\n'));
 *       return;
 *     }
 *
 *     // Create the charm
 *     const newCharm = createCharm(data);
 *     console.log('New charm created:', newCharm);
 *   };
 * }
 * ```
 */
export function useCharmOperations() {
  const {
    charms,
    addCharm,
    updateCharm: updateCharmInContext,
    deleteCharm: deleteCharmInContext,
  } = useCharms();
  const { skills } = useSkills();

  /**
   * Creates and adds a new charm.
   *
   * Automatically calculates equivalent slots, key skill value, and generates
   * an ID and timestamp.
   *
   * @param data - The base data for the charm (rarity, skills, slots).
   * @returns The fully created charm object.
   *
   * @example
   * ```tsx
   * const charm = createCharm({
   *   rarity: 10,
   *   skills: [{ skillId: 'skill-001', level: 2 }],
   *   slots: [{ type: 'weapon', level: 1 }]
   * });
   * ```
   */
  const createCharm = useCallback(
    (data: {
      rarity: number;
      skills: SkillWithLevel[];
      slots: Slot[];
    }): Charm => {
      // Calculate equivalent slots
      const equivalentSlots = calculateCharmEquivalentSlots(
        data.skills,
        data.slots,
        skills,
      );

      // Calculate key skill value
      const keySkillValue = calculateKeySkillValue(
        data.skills,
        data.slots,
        skills,
      );

      // Create the charm object
      const newCharm: Charm = {
        id: generateCharmId(),
        name: generateCharmNameByRarity(data.rarity),
        rarity: data.rarity,
        skills: data.skills,
        slots: data.slots,
        equivalentSlots,
        keySkillValue,
        createdAt: new Date().toISOString(),
      };

      // Add to the state
      addCharm(newCharm);

      return newCharm;
    },
    [skills, addCharm],
  );

  /**
   * Validates a new charm.
   *
   * Checks if a charm should be added, including:
   * - Whether it is outclassed by an existing charm.
   * - Whether its key skill value is below average.
   *
   * @param data - The base data for the charm (rarity, skills, slots).
   * @returns A validation result, including whether it passed and any warnings.
   *
   * @example
   * ```tsx
   * const result = validateNewCharm({
   *   rarity: 8,
   *   skills: [{ skillId: 'skill-001', level: 1 }],
   *   slots: []
   * });
   *
   * if (!result.isValid) {
   *   console.warn('Charm validation failed:', result.warnings);
   * }
   *
   * if (result.isBelowAverage) {
   *   console.warn('Key skill value is below average.');
   * }
   * ```
   */
  const validateNewCharm = useCallback(
    (data: Omit<Charm, "id" | "createdAt">) => {
      return validateCharm(data, charms, skills);
    },
    [charms, skills],
  );

  /**
   * Updates a charm and recalculates its values.
   *
   * Finds a charm by its ID, updates its data, and recalculates its
   * equivalent slots and key skill value.
   *
   * @param id - The ID of the charm to update.
   * @param data - The updated base data for the charm (rarity, skills, slots).
   * @returns The updated charm object.
   *
   * @example
   * ```tsx
   * const updatedCharm = updateAndRecalculateCharm('charm-001', {
   *   rarity: 11,
   *   skills: [{ skillId: 'skill-002', level: 3 }],
   *   slots: [{ type: 'weapon', level: 2 }]
   * });
   * ```
   */
  const updateAndRecalculateCharm = useCallback(
    (
      id: string,
      data: {
        rarity: number;
        skills: SkillWithLevel[];
        slots: Slot[];
      },
    ): Charm => {
      // Find the existing charm
      const existingCharm = charms.find((c) => c.id === id);
      if (!existingCharm) {
        throw new Error(`Charm with id ${id} not found`);
      }

      // Prevent updating official charms
      if (isOfficialCharmId(id)) {
        throw new Error("Cannot update official charms");
      }

      // Calculate equivalent slots
      const equivalentSlots = calculateCharmEquivalentSlots(
        data.skills,
        data.slots,
        skills,
      );

      // Calculate key skill value
      const keySkillValue = calculateKeySkillValue(
        data.skills,
        data.slots,
        skills,
      );

      // Create the updated charm object
      const updatedCharm: Charm = {
        id,
        name: generateCharmNameByRarity(data.rarity),
        rarity: data.rarity,
        skills: data.skills,
        slots: data.slots,
        equivalentSlots,
        keySkillValue,
        createdAt: existingCharm.createdAt, // Keep the original creation time
      };

      // Update the state
      updateCharmInContext(updatedCharm);

      return updatedCharm;
    },
    [charms, skills, updateCharmInContext],
  );

  /**
   * Deletes a charm, but prevents deleting official charms.
   *
   * @param id - The ID of the charm to delete.
   * @throws {Error} If the charm is an official charm.
   */
  const deleteCharm = useCallback(
    (id: string) => {
      if (isOfficialCharmId(id)) {
        throw new Error("Cannot delete official charms");
      }
      deleteCharmInContext(id);
    },
    [deleteCharmInContext],
  );

  return {
    createCharm,
    validateNewCharm,
    updateAndRecalculateCharm,
    deleteCharm,
  };
}
