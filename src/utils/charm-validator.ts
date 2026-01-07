/**
 * @fileoverview Charm validation utilities for MHWS Set Builder.
 *
 * Provides functions to validate and compare charms to decide if a new
 * charm is worth keeping.
 */

import {
  KEY_SKILL_VALUE_THRESHOLD,
  type Charm,
  type CharmValidationResult,
  type CharmValidationStatus,
  type EquivalentSlots,
  type Skill,
  type SkillWithLevel,
  type Slot,
} from "@/types";

type SlotComparisonResult = "superior" | "inferior" | "equal" | "incomparable";

/**
 * Compares two sets of equivalent slots.
 * @param newSlots The equivalent slots of the new charm.
 * @param existingSlots The equivalent slots of the existing charm.
 * @returns 'superior', 'inferior', 'equal', or 'incomparable'.
 */
function compareEquivalentSlots(
  newSlots: EquivalentSlots,
  existingSlots: EquivalentSlots,
): SlotComparisonResult {
  let isSuperior = false;
  let isInferior = false;

  const keys = Object.keys(newSlots) as (keyof EquivalentSlots)[];

  for (const key of keys) {
    if (newSlots[key] > existingSlots[key]) {
      isSuperior = true;
    } else if (newSlots[key] < existingSlots[key]) {
      isInferior = true;
    }
  }

  if (isSuperior && !isInferior) {
    return "superior";
  }
  if (isInferior && !isSuperior) {
    return "inferior";
  }
  if (!isSuperior && !isInferior) {
    return "equal";
  }
  return "incomparable";
}

/**
 * Checks if a charm dominates another, meaning it is better or equal in all
 * aspects and strictly better in at least one.
 * @param dominator The potential dominating charm.
 * @param dominated The potential dominated charm.
 * @returns True if the dominator charm is strictly better.
 */
function isDominating(
  dominator: Omit<Charm, "id" | "createdAt">,
  dominated: Charm,
): boolean {
  const slotComparison = compareEquivalentSlots(
    dominator.equivalentSlots,
    dominated.equivalentSlots,
  );

  // 1. Slots cannot be inferior.
  if (slotComparison === "inferior") {
    return false;
  }

  const dominatorSkillsMap = new Map(
    dominator.skills.map((s) => [s.skillId, s.level]),
  );
  let isSkillStrictlySuperior = false;

  // 2. Check if the dominator covers all skills of the dominated charm
  //    with at least the same level.
  for (const dominatedSkill of dominated.skills) {
    const dominatorLevel = dominatorSkillsMap.get(dominatedSkill.skillId);
    // If the dominator is missing a skill or has a lower level, it can't dominate.
    if (!dominatorLevel || dominatorLevel < dominatedSkill.level) {
      return false;
    }
    if (dominatorLevel > dominatedSkill.level) {
      isSkillStrictlySuperior = true;
    }
  }

  // If the dominator has more skills, it's also considered superior in skills.
  // (This assumes it already covers all of the dominated charm's skills).
  if (dominator.skills.length > dominated.skills.length) {
    isSkillStrictlySuperior = true;
  }

  // 3. The charms cannot be identical; at least one aspect must be strictly superior.
  const isSlotStrictlySuperior = slotComparison === "superior";

  return isSlotStrictlySuperior || isSkillStrictlySuperior;
}

/**
 * Validates if a new charm should be added to the collection using a domination check.
 * @param newCharm The new charm (with pre-calculated `equivalentSlots` and `keySkillValue`).
 * @param existingCharms The list of existing charms.
 * @param skillsData Complete skill data for lookups.
 * @returns A detailed validation result.
 */
export function validateCharm(
  newCharm: Omit<Charm, "id" | "createdAt">,
  existingCharms: Charm[],
  skillsData: Skill[],
): CharmValidationResult {
  // Phase 0: If the database is empty, accept it.
  if (existingCharms.length === 0) {
    return { isValid: true, status: "ACCEPTED_AS_FIRST" };
  }

  // Phase 1: Domination Check
  // 1.1: Check if the new charm is dominated by any existing charm.
  for (const existingCharm of existingCharms) {
    if (isDominating(existingCharm, newCharm as Charm)) {
      return {
        isValid: false,
        status: "REJECTED_AS_INFERIOR",
        betterCharm: existingCharm,
      };
    }
  }

  // 1.2: Find which existing charms are dominated by the new charm.
  const outclassedCharms = existingCharms.filter((existingCharm) =>
    isDominating(newCharm, existingCharm),
  );

  // Phase 2: Determine acceptance reason.
  let status: CharmValidationStatus = "ACCEPTED";

  const stats = existingCharms.reduce(
    (acc, charm) => {
      acc.maxKeySkillValue = Math.max(
        acc.maxKeySkillValue,
        charm.keySkillValue,
      );
      acc.maxEqSlots.weaponSlot1 = Math.max(
        acc.maxEqSlots.weaponSlot1,
        charm.equivalentSlots.weaponSlot1,
      );
      acc.maxEqSlots.weaponSlot2 = Math.max(
        acc.maxEqSlots.weaponSlot2,
        charm.equivalentSlots.weaponSlot2,
      );
      acc.maxEqSlots.weaponSlot3 = Math.max(
        acc.maxEqSlots.weaponSlot3,
        charm.equivalentSlots.weaponSlot3,
      );
      acc.maxEqSlots.armorSlot1 = Math.max(
        acc.maxEqSlots.armorSlot1,
        charm.equivalentSlots.armorSlot1,
      );
      acc.maxEqSlots.armorSlot2 = Math.max(
        acc.maxEqSlots.armorSlot2,
        charm.equivalentSlots.armorSlot2,
      );
      acc.maxEqSlots.armorSlot3 = Math.max(
        acc.maxEqSlots.armorSlot3,
        charm.equivalentSlots.armorSlot3,
      );
      acc.totalKeySkillValue += charm.keySkillValue;
      return acc;
    },
    {
      maxKeySkillValue: 0,
      totalKeySkillValue: 0,
      maxEqSlots: {
        weaponSlot1: 0,
        weaponSlot2: 0,
        weaponSlot3: 0,
        armorSlot1: 0,
        armorSlot2: 0,
        armorSlot3: 0,
      },
    },
  );

  if (newCharm.keySkillValue > stats.maxKeySkillValue) {
    status = "ACCEPTED_BY_MAX_VALUE";
  } else if (
    newCharm.equivalentSlots.weaponSlot1 > stats.maxEqSlots.weaponSlot1 ||
    newCharm.equivalentSlots.weaponSlot2 > stats.maxEqSlots.weaponSlot2 ||
    newCharm.equivalentSlots.weaponSlot3 > stats.maxEqSlots.weaponSlot3 ||
    newCharm.equivalentSlots.armorSlot1 > stats.maxEqSlots.armorSlot1 ||
    newCharm.equivalentSlots.armorSlot2 > stats.maxEqSlots.armorSlot2 ||
    newCharm.equivalentSlots.armorSlot3 > stats.maxEqSlots.armorSlot3
  ) {
    status = "ACCEPTED_BY_MAX_SLOTS";
  } else {
    // Check for unique skills (based on old anchor skill logic).
    const newCharmSkillsWithData = newCharm.skills.map((s) => ({
      ...s,
      skillData: skillsData.find((sd) => sd.id === s.skillId),
    }));
    const coreSkills = newCharmSkillsWithData.filter((s) => s.skillData?.isKey);
    let anchorSkills: typeof newCharmSkillsWithData = [];

    if (coreSkills.length > 0) {
      anchorSkills = coreSkills;
    } else if (newCharmSkillsWithData.length > 0) {
      const maxLevel = Math.max(...newCharmSkillsWithData.map((s) => s.level));
      anchorSkills = newCharmSkillsWithData.filter((s) => s.level === maxLevel);
    }

    if (anchorSkills.length > 0) {
      const hasUniqueAnchor = anchorSkills.some(
        (anchor) =>
          !existingCharms.some((c) =>
            c.skills.some((s) => s.skillId === anchor.skillId),
          ),
      );
      if (hasUniqueAnchor) {
        status = "ACCEPTED_AS_UNIQUE_SKILL";
      }
    }
  }

  // Phase 3: Generate warnings.
  const warnings: string[] = [];
  if (existingCharms.length > 0) {
    const avgKeySkillValue = stats.totalKeySkillValue / existingCharms.length;
    if (newCharm.keySkillValue < avgKeySkillValue - KEY_SKILL_VALUE_THRESHOLD) {
      warnings.push(
        `Key skill value (${newCharm.keySkillValue.toFixed(1)}) is significantly below average (${avgKeySkillValue.toFixed(1)}).`,
      );
    }
  }

  // Phase 4: Assemble and return the final result.
  return {
    isValid: true,
    status,
    warnings: warnings.length > 0 ? warnings : undefined,
    outclassedCharms:
      outclassedCharms.length > 0 ? outclassedCharms : undefined,
  };
}

/**
 * Checks if two skill lists are identical (including levels).
 * @param skills1 The first list of skills.
 * @param skills2 The second list of skills.
 * @returns True if the skill lists are identical.
 */
export function areSkillsIdentical(
  skills1: SkillWithLevel[],
  skills2: SkillWithLevel[],
): boolean {
  if (skills1.length !== skills2.length) {
    return false;
  }

  for (const skill1 of skills1) {
    const skill2 = skills2.find((s) => s.skillId === skill1.skillId);
    if (skill2?.level !== skill1.level) {
      return false;
    }
  }

  return true;
}

/**
 * Checks if two slot lists are identical.
 * @param slots1 The first list of slots.
 * @param slots2 The second list of slots.
 * @returns True if the slot lists are identical.
 */
export function areSlotsIdentical(slots1: Slot[], slots2: Slot[]): boolean {
  if (slots1.length !== slots2.length) {
    return false;
  }

  const counts1 = {
    weapon1: 0,
    weapon2: 0,
    weapon3: 0,
    armor1: 0,
    armor2: 0,
    armor3: 0,
  };
  const counts2 = {
    weapon1: 0,
    weapon2: 0,
    weapon3: 0,
    armor1: 0,
    armor2: 0,
    armor3: 0,
  };

  for (const slot of slots1) {
    const key = `${slot.type}${slot.level}` as keyof typeof counts1;
    counts1[key]++;
  }

  for (const slot of slots2) {
    const key = `${slot.type}${slot.level}` as keyof typeof counts2;
    counts2[key]++;
  }

  for (const key in counts1) {
    if (
      counts1[key as keyof typeof counts1] !==
      counts2[key as keyof typeof counts2]
    ) {
      return false;
    }
  }

  return true;
}
