/**
 * @fileoverview Skill sorting utility for MHWS Set Builder.
 */

import type { Skill } from "@/types";

/**
 * Compares the priority of two skills for sorting.
 *
 * Sorting Rules:
 * 1. Category: weapon > armor > series > group
 * 2. Level: descending
 * 3. Max Level: Skills at max level are prioritized.
 * 4. Key Skill: `isKey: true` is prioritized.
 * 5. SortId: ascending
 *
 * @param a The first skill object to compare.
 * @param b The second skill object to compare.
 * @returns A number indicating the sort order.
 */
export function compareSkills(
  a: { level: number; skillData?: Skill | null },
  b: { level: number; skillData?: Skill | null },
): number {
  // Handle cases with missing data, prioritizing items with data.
  if (!a.skillData && !b.skillData) return 0;
  if (!a.skillData) return 1;
  if (!b.skillData) return -1;

  const categoryOrder = ["weapon", "armor", "series", "group"];
  const aCategoryIndex = categoryOrder.indexOf(a.skillData.category);
  const bCategoryIndex = categoryOrder.indexOf(b.skillData.category);

  // 1. Category
  if (aCategoryIndex !== bCategoryIndex) {
    // A category not in the list (indexOf returns -1) should be last.
    if (aCategoryIndex === -1) return 1;
    if (bCategoryIndex === -1) return -1;
    return aCategoryIndex - bCategoryIndex;
  }

  // 2. Level (Descending)
  if (a.level !== b.level) {
    return b.level - a.level;
  }

  // 3. Max Level (Prioritize maxed-out skills)
  const aIsMax = a.level >= a.skillData.maxLevel;
  const bIsMax = b.level >= b.skillData.maxLevel;
  if (aIsMax !== bIsMax) {
    return aIsMax ? -1 : 1;
  }

  // 4. Is Key (Prioritize key skills)
  if (a.skillData.isKey !== b.skillData.isKey) {
    return a.skillData.isKey ? -1 : 1;
  }

  // 5. SortId (Ascending)
  return a.skillData.sortId - b.skillData.sortId;
}
