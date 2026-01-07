/**
 * @fileoverview Weapon grouping utility for MHWS Set Builder.
 */

import type { Weapon } from "@/types";

/**
 * Groups a list of weapons into rows based on rarity after sorting by sortId.
 * @param weapons - An array of `Weapon` objects (can be unsorted).
 * @returns A 2D array where each sub-array represents a row of weapons.
 */
export function groupWeaponsIntoRows(weapons: Weapon[]): Weapon[][] {
  if (weapons.length === 0) {
    return [];
  }

  // First, sort weapons by sortId in ascending order.
  const sortedWeapons = [...weapons].sort((a, b) => a.sortId - b.sortId);

  const rows: Weapon[][] = [[sortedWeapons[0]]];

  for (let i = 1; i < sortedWeapons.length; i++) {
    const currentWeapon = sortedWeapons[i];
    const previousWeapon = sortedWeapons[i - 1];

    if (currentWeapon.rarity > previousWeapon.rarity) {
      // If rarity increases, add to the end of the current row.
      rows[rows.length - 1].push(currentWeapon);
    } else {
      // If rarity is the same or decreases, start a new row.
      rows.push([currentWeapon]);
    }
  }

  return rows;
}
