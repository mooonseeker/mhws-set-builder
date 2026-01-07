/**
 * @fileoverview Helper functions for the set search algorithm.
 * This includes utility functions for pruning the search space and validating skill requirements.
 */

import type {
  ArmorType,
  CategorizedSkills,
  EquipmentSet,
  PreprocessedData,
  SkillWithLevel,
  Slot,
} from "@/types";

/**
 * Core potential-based pruning function.
 *
 * Determines if a search branch should be pruned by checking if it's still possible
 * to meet the required skills (`noAccessorySkills` and `armorSkills`) given the
 * current equipment and the maximum potential of the remaining armor slots.
 *
 * @param currentSkills A map of skill levels provided by the current equipment set (excluding accessories).
 * @param remainingArmorTypes A list of armor types that are yet to be selected.
 * @param skillDeficits The skills that still need to be satisfied.
 * @param preprocessedData Contains pre-calculated data like `maxPotentialPerArmorType`.
 * @param availableSlots The currently available slots from selected equipment.
 * @returns `true` if the branch is guaranteed to fail and should be pruned.
 */
export function shouldPrune(
  currentSkills: Map<string, number>,
  remainingArmorTypes: ArmorType[],
  skillDeficits: CategorizedSkills,
  preprocessedData: PreprocessedData,
  availableSlots?: { weapon: Slot[]; armor: Slot[] },
): boolean {
  const skillsToEvaluate: SkillWithLevel[] = [
    ...skillDeficits.noAccessorySkills,
    ...skillDeficits.armorSkills,
  ];

  for (const targetSkill of skillsToEvaluate) {
    const { skillId, level: requiredLevel } = targetSkill;
    const currentLevel = currentSkills.get(skillId) ?? 0;

    // If the skill requirement is already met, skip to the next one.
    if (currentLevel >= requiredLevel) {
      continue;
    }

    // 1. Calculate the potential from the skills and slots of remaining armor pieces.
    let remainingPotential = 0;
    for (const armorType of remainingArmorTypes) {
      const potentialOnType =
        preprocessedData.maxPotentialPerArmorType.get(armorType);
      if (potentialOnType) {
        remainingPotential += potentialOnType.get(skillId) ?? 0;
      }
    }

    // 2. Calculate the potential from currently available slots (only for `armorSkills`).
    let currentSlotsPotential = 0;
    if (availableSlots && preprocessedData.accessoriesBySkill.has(skillId)) {
      const accessories =
        preprocessedData.accessoriesBySkill.get(skillId) ?? [];
      if (accessories.length > 0) {
        // A simple greedy estimation: assume all available slots are filled with the best accessory for the skill.
        // This doesn't distinguish between weapon/armor slots, assuming most armorSkill accessories are generic.
        // For stricter cases, a more detailed check would be needed.
        const allSlots = [...availableSlots.weapon, ...availableSlots.armor];

        for (const slot of allSlots) {
          let maxLevelForSlot = 0;
          for (const acc of accessories) {
            if (acc.slotLevel <= slot.level) {
              const skillVal =
                acc.skills.find((s) => s.skillId === skillId)?.level ?? 0;
              maxLevelForSlot = Math.max(maxLevelForSlot, skillVal);
            }
          }
          currentSlotsPotential += maxLevelForSlot;
        }
      }
    }

    // If the current level plus all remaining potential is less than the required level, prune the branch.
    if (
      currentLevel + remainingPotential + currentSlotsPotential <
      requiredLevel
    ) {
      return true; // Prune this branch.
    }
  }

  return false; // Do not prune.
}

/**
 * Validates if a final equipment set satisfies the requirements for Series and Group skills.
 * Both skill types are satisfied by accumulating skill levels from each piece of equipment.
 *
 * @param equipment The final set of 5 armor pieces, weapon, and charm.
 * @param skillDeficits The required skills to be validated.
 * @returns `true` if all series and group skill requirements are met.
 */
export function validateBaseSkills(
  equipment: EquipmentSet,
  skillDeficits: CategorizedSkills,
): boolean {
  const ARMOR_TYPES: ArmorType[] = ["helm", "body", "arm", "waist", "leg"];
  const skillsToValidate = [
    ...skillDeficits.seriesSkills,
    ...skillDeficits.groupSkills,
  ];

  for (const targetSkill of skillsToValidate) {
    const { skillId, level: requiredLevel } = targetSkill;

    let currentLevel = 0;
    // Accumulate skills from armor pieces.
    ARMOR_TYPES.forEach((type) => {
      const armorPiece = equipment[type]?.equipment;
      if (armorPiece) {
        const skillOnPiece = armorPiece.skills.find(
          (s) => s.skillId === skillId,
        );
        if (skillOnPiece) {
          currentLevel += skillOnPiece.level;
        }
      }
    });

    // Accumulate skills from weapon.
    const weapon = equipment.weapon?.equipment;
    if (weapon) {
      const skillOnWeapon = weapon.skills.find((s) => s.skillId === skillId);
      if (skillOnWeapon) {
        currentLevel += skillOnWeapon.level;
      }
    }
    // Accumulate skills from charm.
    const charm = equipment.charm?.equipment;
    if (charm) {
      const skillOnCharm = charm.skills.find((s) => s.skillId === skillId);
      if (skillOnCharm) {
        currentLevel += skillOnCharm.level;
      }
    }

    if (currentLevel < requiredLevel) {
      return false; // Skill level is insufficient.
    }
  }

  // All series and group skill requirements have been met.
  return true;
}
