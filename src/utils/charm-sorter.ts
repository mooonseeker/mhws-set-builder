/**
 * @fileoverview Charm sorting utilities for MHWS Set Builder.
 *
 * Provides functions to sort charms by various fields and directions.
 */

import type {
  Charm,
  CharmSortField,
  EquivalentSlots,
  SortDirection,
} from "@/types";

/**
 * Sorts an array of charms by a specified field and direction.
 *
 * @param charms - The array of charms to sort.
 * @param sortField - The field to sort by (e.g., keySkillValue, rarity, createdAt, slot types).
 * @param direction - The sort direction ('asc' or 'desc').
 * @returns A new, sorted array of charms without modifying the original.
 */
export function sortCharms(
  charms: Charm[],
  sortField: CharmSortField,
  direction: SortDirection,
): Charm[] {
  const sorted = [...charms].sort((a, b) => {
    let aValue: number;
    let bValue: number;

    // Get the values to compare based on the sort field.
    if (sortField === "createdAt") {
      aValue = new Date(a.createdAt).getTime();
      bValue = new Date(b.createdAt).getTime();
    } else if (sortField === "keySkillValue" || sortField === "rarity") {
      aValue = a[sortField];
      bValue = b[sortField];
    } else {
      // Handle equivalent slot fields.
      aValue = a.equivalentSlots[sortField as keyof EquivalentSlots];
      bValue = b.equivalentSlots[sortField as keyof EquivalentSlots];
    }

    return direction === "asc" ? aValue - bValue : bValue - aValue;
  });

  return sorted;
}

/**
 * Default sort: by keySkillValue, then by rarity.
 *
 * - Sorts by keySkillValue in descending order.
 * - If keySkillValue is equal, sorts by rarity in descending order.
 *
 * @param charms - The array of charms to sort.
 * @returns A new, sorted array of charms.
 */
export function sortCharmsDefault(charms: Charm[]): Charm[] {
  return [...charms].sort((a, b) => {
    // Primary sort: keySkillValue descending.
    if (a.keySkillValue !== b.keySkillValue) {
      return b.keySkillValue - a.keySkillValue;
    }

    // Secondary sort: rarity descending.
    return b.rarity - a.rarity;
  });
}

/**
 * Sorts charms by multiple fields with corresponding directions.
 *
 * @param charms - The array of charms to sort.
 * @param sortFields - An array of fields to sort by, in order of priority.
 * @param directions - An array of corresponding sort directions.
 * @returns A new, sorted array of charms.
 */
export function sortCharmsMultiple(
  charms: Charm[],
  sortFields: CharmSortField[],
  directions: SortDirection[],
): Charm[] {
  if (sortFields.length !== directions.length) {
    throw new Error(
      "Sort fields and directions arrays must have the same length.",
    );
  }

  return [...charms].sort((a, b) => {
    for (let i = 0; i < sortFields.length; i++) {
      const field = sortFields[i];
      const direction = directions[i];

      let aValue: number;
      let bValue: number;

      if (field === "createdAt") {
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
      } else if (field === "keySkillValue" || field === "rarity") {
        aValue = a[field];
        bValue = b[field];
      } else {
        aValue = a.equivalentSlots[field as keyof EquivalentSlots];
        bValue = b.equivalentSlots[field as keyof EquivalentSlots];
      }

      if (aValue !== bValue) {
        return direction === "asc" ? aValue - bValue : bValue - aValue;
      }
    }
    // All fields are equal.
    return 0;
  });
}

/**
 * Filters charms that contain a specific skill and sorts them.
 * This is used to highlight charms with the same key skill when adding a new one.
 *
 * @param charms - The array of charms.
 * @param skillId - The ID of the skill to filter by.
 * @param isKeySkill - Whether the skill is a key skill.
 * @returns A sorted array of charms containing the specified skill.
 */
export function filterAndSortBySkill(
  charms: Charm[],
  skillId: string,
): Charm[] {
  const filtered = charms.filter((charm) =>
    charm.skills.some((skill) => skill.skillId === skillId),
  );

  // Always sort by the default rule (key skill value, then rarity).
  return sortCharmsDefault(filtered);
}
