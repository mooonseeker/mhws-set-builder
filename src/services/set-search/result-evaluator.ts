/**
 * @fileoverview Evaluates and sorts final equipment sets.
 * This service provides functions to calculate scores for generated sets
 * and sort them based on criteria like remaining slots and extra skills.
 */

import type { Accessory, FinalSet, Skill, SkillWithLevel, Slot } from "@/types";

/**
 * Calculates a score based on the value of remaining slots.
 * The scoring is weighted: level 3 = 4, level 2 = 2, level 1 = 1.
 * @param slots An array of remaining slots.
 * @returns The total slot value score.
 */
function calculateSlotValue(slots: Slot[]): number {
  return slots.reduce((total, slot) => {
    switch (slot.level) {
      case 3:
        return total + 4;
      case 2:
        return total + 2;
      case 1:
        return total + 1;
      default:
        return total;
    }
  }, 0);
}

/**
 * Computes the total levels for every skill present in a final set.
 * @param set The final equipment set.
 * @returns A map of skill IDs to their total accumulated level.
 */
function computeTotalSkills(set: FinalSet): Map<string, number> {
  const totalSkills = new Map<string, number>();

  // 1. Accumulate skills from equipment pieces.
  (Object.keys(set.equipment) as (keyof FinalSet["equipment"])[]).forEach(
    (key) => {
      const slottedEq = set.equipment[key];
      if (slottedEq?.equipment?.skills) {
        slottedEq.equipment.skills.forEach((skill: SkillWithLevel) => {
          const current = totalSkills.get(skill.skillId) ?? 0;
          totalSkills.set(skill.skillId, current + skill.level);
        });
      }
    },
  );

  // 2. Accumulate skills from accessories.
  set.accessories.forEach((accessoryList) => {
    accessoryList.forEach((accessory: Accessory) => {
      accessory.skills.forEach((skill: SkillWithLevel) => {
        const current = totalSkills.get(skill.skillId) ?? 0;
        totalSkills.set(skill.skillId, current + skill.level);
      });
    });
  });

  return totalSkills;
}

/**
 * Calculates the extra skills in a set that are beyond the user's requirements.
 * @param set The final equipment set.
 * @param requiredSkills The list of skills requested by the user.
 * @returns A list of skills and their levels that exceed the requirements.
 */
export function calculateExtraSkills(
  set: FinalSet,
  requiredSkills: SkillWithLevel[],
): SkillWithLevel[] {
  const totalSkills = computeTotalSkills(set);
  const extraSkills: SkillWithLevel[] = [];

  totalSkills.forEach((totalLevel, skillId) => {
    const required = requiredSkills.find((s) => s.skillId === skillId);
    const requiredLevel = required?.level ?? 0;
    if (totalLevel > requiredLevel) {
      extraSkills.push({
        skillId,
        level: totalLevel - requiredLevel,
      });
    }
  });

  return extraSkills;
}

/**
 * Evaluates and sorts a list of final sets based on a comprehensive set of criteria.
 * The primary sorting goals are to maximize useful remaining slots and minimize unwanted extra skills.
 * @param sets The list of sets to evaluate and sort.
 * @param requiredSkills The user's required skills.
 * @param skillDetails A map of skill details for reference.
 * @returns A new array of sorted `FinalSet` objects.
 */
export function evaluateAndSortResults(
  sets: FinalSet[],
  requiredSkills: SkillWithLevel[],
  skillDetails: Map<string, Skill>,
): FinalSet[] {
  if (sets.length <= 1) {
    return sets;
  }

  // Sort using a multi-level comparison.
  return sets.sort((a, b) => {
    // 1. Sort by remaining slot value (descending).
    const aSlotValue = calculateSlotValue(a.remainingSlots);
    const bSlotValue = calculateSlotValue(b.remainingSlots);
    if (aSlotValue !== bSlotValue) {
      return bSlotValue - aSlotValue;
    }

    // 2. Sort by the total level of extra "key" skills (ascending).
    // This penalizes sets with more unwanted high-value skills.
    const aExtraSkills = calculateExtraSkills(a, requiredSkills);
    const bExtraSkills = calculateExtraSkills(b, requiredSkills);

    const aExtraKeySum = aExtraSkills
      .filter((skill) => skillDetails.get(skill.skillId)?.isKey)
      .reduce((sum, skill) => sum + skill.level, 0);

    const bExtraKeySum = bExtraSkills
      .filter((skill) => skillDetails.get(skill.skillId)?.isKey)
      .reduce((sum, skill) => sum + skill.level, 0);

    return aExtraKeySum - bExtraKeySum;
  });
}
