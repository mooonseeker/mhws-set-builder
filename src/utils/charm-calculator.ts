/**
 * @fileoverview Charm calculation utilities for MHWS Set Builder.
 *
 * Provides functions to calculate equivalent slots and key skill value for charms.
 */

import type { EquivalentSlots, Skill, SkillWithLevel, Slot } from "@/types";

/**
 * Calculates the equivalent slots for a single skill.
 *
 * The number of equivalent slots is determined by the skill's category,
 * accessory level, and current level.
 *
 * Rules:
 * - Weapon Skill: `level` slots of the corresponding accessory level for weapons.
 * - Armor Skill: `level` slots of the corresponding accessory level for armor.
 *
 * @param skill - The skill definition.
 * @param level - The level of the skill.
 * @returns An object representing the equivalent slots.
 */
export function calculateSkillEquivalentSlots(
  skill: Skill,
  level: number,
): EquivalentSlots {
  const equivalentSlots: EquivalentSlots = {
    weaponSlot1: 0,
    weaponSlot2: 0,
    weaponSlot3: 0,
    armorSlot1: 0,
    armorSlot2: 0,
    armorSlot3: 0,
  };

  // Boundary check: level must be within a valid range.
  if (level <= 0 || level > skill.maxLevel) {
    return equivalentSlots;
  }

  // Check for valid accessory level.
  if (skill.accessoryLevel <= 0) {
    return equivalentSlots;
  }

  // Accumulate slots based on skill category and accessory level.
  const { accessoryLevel } = skill;

  if (skill.category === "weapon") {
    if (accessoryLevel === 1) {
      equivalentSlots.weaponSlot1 = level;
    } else if (accessoryLevel === 2) {
      equivalentSlots.weaponSlot2 = level;
    } else if (accessoryLevel === 3) {
      equivalentSlots.weaponSlot3 = level;
    }
  } else if (skill.category === "armor") {
    if (accessoryLevel === 1) {
      equivalentSlots.armorSlot1 = level;
    } else if (accessoryLevel === 2) {
      equivalentSlots.armorSlot2 = level;
    } else if (accessoryLevel === 3) {
      equivalentSlots.armorSlot3 = level;
    }
  }

  return equivalentSlots;
}

/**
 * Calculates the total equivalent slots for a charm.
 *
 * This includes the equivalent slots from all its skills plus its own actual slots.
 *
 * @param skills - The list of skills on the charm.
 * @param slots - The list of slots on the charm.
 * @param skillsData - The complete skill data for lookup.
 * @returns An object representing the total equivalent slots.
 */
export function calculateCharmEquivalentSlots(
  skills: SkillWithLevel[],
  slots: Slot[],
  skillsData: Skill[],
): EquivalentSlots {
  const totalEquivalentSlots: EquivalentSlots = {
    weaponSlot1: 0,
    weaponSlot2: 0,
    weaponSlot3: 0,
    armorSlot1: 0,
    armorSlot2: 0,
    armorSlot3: 0,
  };

  // 1. Accumulate equivalent slots from skills.
  for (const skillWithLevel of skills) {
    const skill = skillsData.find((s) => s.id === skillWithLevel.skillId);

    if (!skill) {
      console.warn(`Skill ID ${skillWithLevel.skillId} not found.`);
      continue;
    }

    const skillSlots = calculateSkillEquivalentSlots(
      skill,
      skillWithLevel.level,
    );

    totalEquivalentSlots.weaponSlot1 += skillSlots.weaponSlot1;
    totalEquivalentSlots.weaponSlot2 += skillSlots.weaponSlot2;
    totalEquivalentSlots.weaponSlot3 += skillSlots.weaponSlot3;
    totalEquivalentSlots.armorSlot1 += skillSlots.armorSlot1;
    totalEquivalentSlots.armorSlot2 += skillSlots.armorSlot2;
    totalEquivalentSlots.armorSlot3 += skillSlots.armorSlot3;
  }

  // 2. Add the charm's own actual slots.
  for (const slot of slots) {
    if (slot.type === "weapon") {
      if (slot.level === 1) {
        totalEquivalentSlots.weaponSlot1 += 1;
      } else if (slot.level === 2) {
        totalEquivalentSlots.weaponSlot2 += 1;
      } else if (slot.level === 3) {
        totalEquivalentSlots.weaponSlot3 += 1;
      }
    } else if (slot.type === "armor") {
      if (slot.level === 1) {
        totalEquivalentSlots.armorSlot1 += 1;
      } else if (slot.level === 2) {
        totalEquivalentSlots.armorSlot2 += 1;
      } else if (slot.level === 3) {
        totalEquivalentSlots.armorSlot3 += 1;
      }
    }
  }

  return totalEquivalentSlots;
}

/**
 * Calculates the key skill value of a charm.
 *
 * Rules:
 * 1. Key Skill Value: Sum of levels of key skills (based on keySkillIds).
 * 2. Slot Value:
 *    - Weapon Slots: Level 1=1, Level 2=2, Level 3=3
 *    - Armor Slots: Level 1=0, Level 2=1, Level 3=1
 *
 * @param skills - The list of skills on the charm.
 * @param slots - The list of slots on the charm.
 * @param keySkillIds - The list of IDs of skills marked as key skills.
 * @returns The integer key skill value.
 */
export function calculateKeySkillValue(
  skills: SkillWithLevel[],
  slots: Slot[],
  keySkillIds: string[],
): number {
  let keySkillValue = 0;

  // 1. Calculate value from key skills by summing their levels.
  for (const skillWithLevel of skills) {
    if (keySkillIds.includes(skillWithLevel.skillId)) {
      keySkillValue += skillWithLevel.level;
    }
  }

  // 2. Calculate value from slots.
  for (const slot of slots) {
    if (slot.type === "weapon") {
      // Weapon slots: L1=1, L2=2, L3=3
      keySkillValue += slot.level;
    } else if (slot.type === "armor") {
      // Armor slots: L1=0, L2=1, L3=1
      if (slot.level === 2 || slot.level === 3) {
        keySkillValue += 1;
      }
    }
  }

  return keySkillValue;
}
