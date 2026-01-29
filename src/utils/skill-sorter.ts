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
 * 3. SortId: ascending
 *
 * @param a The first skill object to compare.
 * @param b The second skill object to compare.
 * @returns A number indicating the sort order.
 */
export function compareSkillsPriority(
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

  // 3. SortId (Ascending)
  return a.skillData.sortId - b.skillData.sortId;
}
