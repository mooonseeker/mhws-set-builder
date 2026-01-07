/**
 * @fileoverview Utility functions for the set search service.
 */

import type { CategorizedSkills, Skill, SkillWithLevel } from "@/types";

/**
 * Categorizes target skills based on their type and how they can be acquired.
 * This separation is crucial for the hierarchical search algorithm.
 *
 * @param requiredSkills The list of skills requested by the user.
 * @param skillDetails A map containing detailed information about each skill.
 * @returns A `CategorizedSkills` object with skills sorted into their respective buckets.
 */
export function categorizeTargetSkills(
  requiredSkills: SkillWithLevel[],
  skillDetails: Map<string, Skill>,
): CategorizedSkills {
  const categorized: CategorizedSkills = {
    seriesSkills: [],
    groupSkills: [],
    noAccessorySkills: [],
    weaponSkills: [],
    armorSkills: [],
  };

  for (const skillWithLevel of requiredSkills) {
    const skill = skillDetails.get(skillWithLevel.skillId);
    if (!skill) continue;

    // Categorization logic
    if (skill.category === "series") {
      categorized.seriesSkills.push(skillWithLevel);
    } else if (skill.category === "group") {
      categorized.groupSkills.push(skillWithLevel);
    } else if (
      skill.accessoryLevel === -1 &&
      (skill.category === "weapon" || skill.category === "armor")
    ) {
      // Skills that cannot be obtained from accessories.
      categorized.noAccessorySkills.push(skillWithLevel);
    } else if (skill.category === "weapon" && skill.accessoryLevel !== -1) {
      // Skills that can be obtained from weapon-specific accessories.
      categorized.weaponSkills.push(skillWithLevel);
    } else if (skill.category === "armor" && skill.accessoryLevel !== -1) {
      // Skills that can be obtained from armor/generic accessories.
      categorized.armorSkills.push(skillWithLevel);
    }
  }

  return categorized;
}
