import type { CategorizedSkills } from "@/types";
import type { SkillWithLevel, Skill } from "@/types";

/**
 * 将目标技能按照技能分类和装饰品可获得性进行精确分类
 *
 * @param requiredSkills 用户请求的技能列表
 * @param skillDetails 技能详细信息映射
 * @returns 分类后的技能结果
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

    // 分类逻辑
    if (skill.category === "series") {
      categorized.seriesSkills.push(skillWithLevel);
    } else if (skill.category === "group") {
      categorized.groupSkills.push(skillWithLevel);
    } else if (
      skill.accessoryLevel === -1 &&
      (skill.category === "weapon" || skill.category === "armor")
    ) {
      categorized.noAccessorySkills.push(skillWithLevel);
    } else if (skill.category === "weapon" && skill.accessoryLevel !== -1) {
      categorized.weaponSkills.push(skillWithLevel);
    } else if (skill.category === "armor" && skill.accessoryLevel !== -1) {
      categorized.armorSkills.push(skillWithLevel);
    }
  }

  return categorized;
}
