/**
 * @fileoverview Hook for charm operations in the MHWS Set Builder.
 *
 * This hook encapsulates complex operations for creating, validating,
 * and updating charms.
 */

import { useCallback } from "react";

import type { Charm, SkillWithLevel, Slot } from "@/types";
import { generateCharmId, isOfficialCharmId, validateCharm } from "@/utils";

import { useCharms } from "./useCharms";
import { useSkills } from "./useSkills";

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
      // Create the charm object
      const newCharm: Charm = {
        id: generateCharmId(),
        name: generateCharmNameByRarity(data.rarity),
        rarity: data.rarity,
        skills: data.skills,
        slots: data.slots,
        createdAt: new Date().toISOString(),
      };

      // Add to the state
      addCharm(newCharm);

      return newCharm;
    },
    [addCharm],
  );

  /**
   * Validates a new charm.
   *
   * Checks if a charm should be added, including:
   * - Whether it is outclassed by an existing charm.
   *
   * @param data - The base data for the charm (rarity, skills, slots).
   * @returns A validation result, including whether it passed.
   */
  const validateNewCharm = useCallback(
    (data: Omit<Charm, "id" | "createdAt">) => {
      // Create a temporary full Charm object for validation
      const fullCharm: Charm = {
        ...data,
        id: "temp-validation-id",
        createdAt: new Date().toISOString(),
      };
      return validateCharm(fullCharm, charms, skills);
    },
    [charms, skills],
  );

  /**
   * Updates a charm.
   *
   * Finds a charm by its ID and updates its core data.
   *
   * @param id - The ID of the charm to update.
   * @param data - The updated base data for the charm (rarity, skills, slots).
   * @returns The updated charm object.
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

      // Create the updated charm object
      const updatedCharm: Charm = {
        id,
        name: generateCharmNameByRarity(data.rarity),
        rarity: data.rarity,
        skills: data.skills,
        slots: data.slots,
        createdAt: existingCharm.createdAt, // Keep the original creation time
      };

      // Update the state
      updateCharmInContext(updatedCharm);

      return updatedCharm;
    },
    [charms, updateCharmInContext],
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
