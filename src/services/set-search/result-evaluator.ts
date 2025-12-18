import type { Accessory, FinalSet, Skill, SkillWithLevel, Slot } from "@/types";

/**
 * Calculates the slot value score for remaining slots.
 * @param slots Array of remaining slots
 * @returns Total slot value score (level 3 = 4, level 2 = 2, level 1 = 1)
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
 * 计算套装的总技能等级
 */
function computeTotalSkills(set: FinalSet): Map<string, number> {
  const totalSkills = new Map<string, number>();

  // 装备自带技能
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

  // 装饰品技能
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
 * 计算溢出技能
 * @param set 配装方案
 * @param requiredSkills 所需技能
 * @param skillDetails 技能详情Map
 * @returns 溢出技能列表
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
 * Evaluates and sorts a list of final sets based on comprehensive criteria.
 * @param sets The list of sets to evaluate.
 * @param requiredSkills 用户所需技能
 * @param skillDetails 技能详情映射
 * @returns A sorted list of evaluated sets.
 */
export function evaluateAndSortResults(
  sets: FinalSet[],
  requiredSkills: SkillWithLevel[],
  skillDetails: Map<string, Skill>,
): FinalSet[] {
  if (sets.length <= 1) {
    return sets;
  }

  // Sort using multi-level comparison
  return sets.sort((a, b) => {
    // 1. 剩余孔位价值 (高 -> 低)
    const aSlotValue = calculateSlotValue(a.remainingSlots);
    const bSlotValue = calculateSlotValue(b.remainingSlots);
    if (aSlotValue !== bSlotValue) {
      return bSlotValue - aSlotValue;
    }

    // 2. 溢出核心技能总等级 (低 -> 高)
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
