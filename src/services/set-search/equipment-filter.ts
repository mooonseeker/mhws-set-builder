/**
 * @fileoverview Provides filtering mechanisms for equipment (armors, charms) to optimize the search space.
 * This module implements a dominance check (Pareto optimization) to remove items
 * that are strictly inferior to others.
 */

import type { Armor, ArmorType, Charm, Equipment, Skill } from "@/types";
import { isSuperior } from "@/utils";

/**
 * Generic helper to filter a list of candidates based on dominance check.
 * O(N^2) complexity.
 */
function filterCandidates<T extends Equipment>(
  candidates: T[],
  skillsData: Skill[] | Map<string, Skill>,
): T[] {
  const dominatedIndices = new Set<number>();

  for (let i = 0; i < candidates.length; i++) {
    if (dominatedIndices.has(i)) continue;
    const candidateA = candidates[i];

    for (let j = 0; j < candidates.length; j++) {
      if (i === j) continue;
      if (dominatedIndices.has(j)) continue;

      const candidateB = candidates[j];

      if (isSuperior(candidateA, candidateB, skillsData)) {
        dominatedIndices.add(j);
      }
    }
  }

  const keptCandidates = candidates.filter(
    (_, index) => !dominatedIndices.has(index),
  );

  return keptCandidates;
}

/**
 * Filters the list of available armors by removing those that are strictly dominated
 * by another armor in the same category (e.g., Helm vs Helm).
 *
 * This uses a "Global Dominance" check based on skill gap alignment.
 *
 * @param allArmors The list of all candidate armors.
 * @param skillsData Complete skill data for meta-data lookups.
 * @returns A filtered list of armors containing only non-dominated pieces.
 */
export function filterArmors(
  allArmors: Armor[],
  skillsData: Skill[] | Map<string, Skill>,
): Armor[] {
  const armorsByType = new Map<ArmorType, Armor[]>();
  const ARMOR_TYPES: ArmorType[] = ["helm", "body", "arm", "waist", "leg"];

  // Group armors by type
  ARMOR_TYPES.forEach((type) => {
    armorsByType.set(
      type,
      allArmors.filter((a) => a.type === type),
    );
  });

  const filteredArmors: Armor[] = [];

  for (const type of ARMOR_TYPES) {
    const armors = armorsByType.get(type) ?? [];
    const keptArmors = filterCandidates(armors, skillsData);
    filteredArmors.push(...keptArmors);

    console.log(
      `[ArmorFilter] ${type}: Reduced from ${armors.length} to ${
        keptArmors.length
      } (${armors.length - keptArmors.length} pruned)`,
    );
  }

  return filteredArmors;
}

/**
 * Filters the list of charms by removing strictly dominated ones.
 *
 * @param allCharms The list of all candidate charms.
 * @param skillsData Complete skill data for meta-data lookups.
 * @returns A filtered list of charms containing only non-dominated pieces.
 */
export function filterCharms(
  allCharms: Charm[],
  skillsData: Skill[] | Map<string, Skill>,
): Charm[] {
  const keptCharms = filterCandidates(allCharms, skillsData);
  console.log(
    `[CharmFilter] Reduced from ${allCharms.length} to ${
      keptCharms.length
    } (${allCharms.length - keptCharms.length} pruned)`,
  );
  return keptCharms;
}
