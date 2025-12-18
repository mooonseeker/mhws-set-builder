/**
 * MHWS护石管理器 - 护石计算工具
 *
 * 提供等效孔位和核心技能价值的计算功能
 */

import type { Skill, SkillWithLevel, Slot, EquivalentSlots } from "@/types";

/**
 * 计算单个技能的等效孔位
 *
 * 根据技能分类、装饰品等级和技能等级，计算该技能等效的孔位数量
 *
 * 规则：
 * - 武器技能：level个对应装饰品等级的武器孔位
 * - 防具技能：level个对应装饰品等级的防具孔位
 *
 * @param skill - 技能定义
 * @param level - 技能等级
 * @returns 等效孔位统计对象
 *
 * @example
 * // 武器技能，2级装饰品，等级3
 * calculateSkillEquivalentSlots(skill, 3)
 * // 返回: { weaponSlot2: 3, 其他为0 }
 *
 * @example
 * // 防具技能"精神抖擞"，2级装饰品，等级2
 * calculateSkillEquivalentSlots(skill, 2)
 * // 返回: { armorSlot2: 2, 其他为0 }
 */
export function calculateSkillEquivalentSlots(
  skill: Skill,
  level: number,
): EquivalentSlots {
  // 初始化等效孔位为全0
  const equivalentSlots: EquivalentSlots = {
    weaponSlot1: 0,
    weaponSlot2: 0,
    weaponSlot3: 0,
    armorSlot1: 0,
    armorSlot2: 0,
    armorSlot3: 0,
  };

  // 边界检查：等级必须在有效范围内
  if (level <= 0 || level > skill.maxLevel) {
    return equivalentSlots;
  }

  // 检查装饰品等级是否有效
  if (skill.accessoryLevel <= 0) {
    return equivalentSlots;
  }

  // 根据技能分类和装饰品等级，累加对应的孔位
  const accessoryLevel = skill.accessoryLevel;

  if (skill.category === "weapon") {
    // 武器技能对应武器孔位
    if (accessoryLevel === 1) {
      equivalentSlots.weaponSlot1 = level;
    } else if (accessoryLevel === 2) {
      equivalentSlots.weaponSlot2 = level;
    } else if (accessoryLevel === 3) {
      equivalentSlots.weaponSlot3 = level;
    }
  } else if (skill.category === "armor") {
    // 防具技能对应防具孔位
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
 * 计算护石的总等效孔位
 *
 * 将护石的所有技能转换为等效孔位，并加上护石自身的实际孔位
 *
 * @param skills - 护石的技能列表
 * @param slots - 护石的孔位列表
 * @param skillsData - 完整的技能数据（用于查找技能定义）
 * @returns 总等效孔位统计对象
 *
 * @example
 * const skills = [{ skillId: 'skill1', level: 2 }];
 * const slots = [{ type: 'weapon', level: 1 }];
 * calculateCharmEquivalentSlots(skills, slots, skillsData)
 * // 返回技能等效孔位 + 实际孔位的总和
 */
export function calculateCharmEquivalentSlots(
  skills: SkillWithLevel[],
  slots: Slot[],
  skillsData: Skill[],
): EquivalentSlots {
  // 初始化总等效孔位为全0
  const totalEquivalentSlots: EquivalentSlots = {
    weaponSlot1: 0,
    weaponSlot2: 0,
    weaponSlot3: 0,
    armorSlot1: 0,
    armorSlot2: 0,
    armorSlot3: 0,
  };

  // 1. 累加技能的等效孔位
  for (const skillWithLevel of skills) {
    // 查找技能定义
    const skill = skillsData.find((s) => s.id === skillWithLevel.skillId);

    if (!skill) {
      // 技能不存在，跳过
      console.warn(`技能ID ${skillWithLevel.skillId} 未找到`);
      continue;
    }

    // 计算该技能的等效孔位
    const skillSlots = calculateSkillEquivalentSlots(
      skill,
      skillWithLevel.level,
    );

    // 累加到总等效孔位
    totalEquivalentSlots.weaponSlot1 += skillSlots.weaponSlot1;
    totalEquivalentSlots.weaponSlot2 += skillSlots.weaponSlot2;
    totalEquivalentSlots.weaponSlot3 += skillSlots.weaponSlot3;
    totalEquivalentSlots.armorSlot1 += skillSlots.armorSlot1;
    totalEquivalentSlots.armorSlot2 += skillSlots.armorSlot2;
    totalEquivalentSlots.armorSlot3 += skillSlots.armorSlot3;
  }

  // 2. 累加护石自身的实际孔位
  for (const slot of slots) {
    if (slot.type === "weapon") {
      // 武器孔位
      if (slot.level === 1) {
        totalEquivalentSlots.weaponSlot1 += 1;
      } else if (slot.level === 2) {
        totalEquivalentSlots.weaponSlot2 += 1;
      } else if (slot.level === 3) {
        totalEquivalentSlots.weaponSlot3 += 1;
      }
    } else if (slot.type === "armor") {
      // 防具孔位
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
 * 计算核心技能价值
 *
 * 根据护石的技能和孔位直接计算核心技能价值。
 *
 * 规则：
 * 1. 核心技能价值：只计算核心技能（isKey=true）的等级，直接累加。
 * 2. 孔位价值：
 *    - 武器孔位：1级=1, 2级=2, 3级=3
 *    - 防具孔位：1级=0, 2级=1, 3级=1
 *
 * @param skills - 护石的技能列表
 * @param slots - 护石的孔位列表
 * @param skillsData - 完整的技能数据（用于查找技能定义）
 * @returns 核心技能价值（整数）
 *
 * @example
 * // 护石有 2 级核心技能 A，3 级非核心技能 B，以及一个 2 级武器孔位
 * // 核心技能价值 = (A 技能等级 2) + (2 级武器孔位价值 2) = 4
 * calculateKeySkillValue(skills, slots, skillsData)
 * // 返回: 4
 */
export function calculateKeySkillValue(
  skills: SkillWithLevel[],
  slots: Slot[],
  skillsData: Skill[],
): number {
  let keySkillValue = 0;

  // 1. 计算核心技能的价值 (直接累加技能等级)
  for (const skillWithLevel of skills) {
    // 查找技能定义
    const skill = skillsData.find((s) => s.id === skillWithLevel.skillId);

    if (skill?.isKey) {
      // 如果是核心技能，直接累加其等级
      keySkillValue += skillWithLevel.level;
    }
  }

  // 2. 计算孔位的价值
  for (const slot of slots) {
    if (slot.type === "weapon") {
      // 武器孔位：1级=1, 2级=2, 3级=3
      keySkillValue += slot.level;
    } else if (slot.type === "armor") {
      // 防具孔位：2级=1, 3级=1（1级不计入）
      if (slot.level === 2 || slot.level === 3) {
        keySkillValue += 1;
      }
    }
  }

  return keySkillValue;
}
