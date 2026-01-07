/**
 * @fileoverview Pre-processes raw game data for efficient use in the set search algorithm.
 * It converts data arrays into Maps and calculates potential skill values for pruning.
 */

import type {
  Accessory,
  Armor,
  ArmorType,
  Charm,
  PreprocessedData,
  Skill,
  SkillProviders,
  Weapon,
} from "@/types";

/**
 * Pre-processes raw game data into efficient Map-based structures for the search algorithm.
 * Key outputs include:
 * - `skillProviderMap`: A detailed index of all sources for each skill.
 * - `maxPotentialPerArmorType`: The theoretical maximum skill points achievable for each skill on each armor type,
 *   which is crucial for pruning.
 *
 * @param allArmors Raw list of all armors.
 * @param allWeapons Raw list of all weapons.
 * @param allCharms Raw list of all charms.
 * @param allAccessories Raw list of all accessories.
 * @param allSkills Raw list of all skills.
 * @returns A `PreprocessedData` object containing the structured data.
 */
export function preprocess(
  allArmors: Armor[],
  allWeapons: Weapon[],
  allCharms: Charm[],
  allAccessories: Accessory[],
  allSkills: Skill[],
): PreprocessedData {
  // Initialize the core data structures.
  const skillProviderMap = new Map<string, SkillProviders>();
  const maxPotentialPerArmorType = new Map<ArmorType, Map<string, number>>();
  const accessoriesBySkill = new Map<string, Accessory[]>();
  const skillDetails = new Map<string, Skill>();

  // 1. Initialize base Map structures.
  const armorTypes: ArmorType[] = ["helm", "body", "arm", "waist", "leg"];
  armorTypes.forEach((type) => {
    maxPotentialPerArmorType.set(type, new Map<string, number>());
  });

  allSkills.forEach((skill) => {
    skillDetails.set(skill.id, skill);
    // Ensure every skill has an entry in the provider map.
    skillProviderMap.set(skill.id, {
      armors: [],
      weapons: [],
      charms: [],
      accessories: [],
    });
  });

  // 2. Build `accessoriesBySkill` map and populate `skillProviderMap` for accessories.
  allAccessories.forEach((accessory) => {
    accessory.skills.forEach((skill) => {
      if (!accessoriesBySkill.has(skill.skillId)) {
        accessoriesBySkill.set(skill.skillId, []);
      }
      accessoriesBySkill.get(skill.skillId)!.push(accessory);

      // Also add to the main provider map.
      const providers = skillProviderMap.get(skill.skillId);
      if (providers) {
        providers.accessories.push(accessory);
      }
    });
  });

  // 3. Populate `skillProviderMap` for armors, weapons, and charms.
  allArmors.forEach((armor) => {
    armor.skills.forEach((skill) => {
      skillProviderMap.get(skill.skillId)?.armors.push(armor);
    });
  });

  allWeapons.forEach((weapon) => {
    weapon.skills.forEach((skill) => {
      skillProviderMap.get(skill.skillId)?.weapons.push(weapon);
    });
  });

  allCharms.forEach((charm) => {
    charm.skills.forEach((skill) => {
      skillProviderMap.get(skill.skillId)?.charms.push(charm);
    });
  });

  // 4. [CORE] Calculate `maxPotentialPerArmorType`.
  armorTypes.forEach((armorType) => {
    const armorsOfType = allArmors.filter((a) => a.type === armorType);
    const skillPotentialMap = maxPotentialPerArmorType.get(armorType)!;

    allSkills.forEach((skill) => {
      let maxPotential = 0;

      for (const armor of armorsOfType) {
        // a. Calculate potential from innate skills on the armor piece.
        const innatePotential =
          armor.skills.find((s) => s.skillId === skill.id)?.level ?? 0;

        // b. Calculate potential from slots on the armor piece.
        let slotPotential = 0;
        const relevantAccessories = accessoriesBySkill.get(skill.id) ?? [];

        // Iterate over each slot on the armor.
        for (const slot of armor.slots) {
          let maxSkillForThisSlot = 0;
          // Find the best accessory that can fit in this slot.
          for (const acc of relevantAccessories) {
            if (acc.slotLevel !== -1 && acc.slotLevel <= slot.level) {
              const accSkillLevel =
                acc.skills.find((s) => s.skillId === skill.id)?.level ?? 0;
              maxSkillForThisSlot = Math.max(
                maxSkillForThisSlot,
                accSkillLevel,
              );
            }
          }
          slotPotential += maxSkillForThisSlot;
        }

        // c. Calculate the total potential for this single armor piece.
        const totalPotential = innatePotential + slotPotential;

        // d. Update the maximum potential for this armor type and skill.
        maxPotential = Math.max(maxPotential, totalPotential);
      }

      skillPotentialMap.set(skill.id, maxPotential);
    });
  });

  // 5. Return the completed pre-processed data object.
  return {
    skillProviderMap,
    maxPotentialPerArmorType,
    accessoriesBySkill,
    skillDetails,
  };
}
