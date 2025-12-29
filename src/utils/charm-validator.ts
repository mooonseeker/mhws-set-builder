/**
 * MHWS护石管理器 - 护石验证工具
 *
 * 提供护石验证和比较功能，判断新护石是否值得添加
 */

import type {
  Charm,
  SkillWithLevel,
  Slot,
  CharmValidationResult,
  Skill,
  EquivalentSlots,
  CharmValidationStatus,
} from "@/types";
import { KEY_SKILL_VALUE_THRESHOLD } from "@/types";

type SlotComparisonResult = "superior" | "inferior" | "equal" | "incomparable";

/**
 * 比较两组等效孔位
 *
 * @param newSlots - 新护石的等效孔位
 * @param existingSlots - 现有护石的等效孔位
 * @returns 'superior', 'inferior', 'equal', 或 'incomparable'
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
 * 检查一个护石是否在所有方面都优于或等于另一个护石（“完爆”/ "Dominate"）
 *
 * @param dominator - 潜在的优胜护石
 * @param dominated - 潜在的劣势护石
 * @returns 如果 dominator 全方位优于或等于 dominated 且至少有一项严格更优，则返回 true
 */
function isDominating(
  dominator: Omit<Charm, "id" | "createdAt">,
  dominated: Charm,
): boolean {
  const slotComparison = compareEquivalentSlots(
    dominator.equivalentSlots,
    dominated.equivalentSlots,
  );

  // 1. 孔位不能比对方差
  if (slotComparison === "inferior") {
    return false;
  }

  const dominatorSkillsMap = new Map(
    dominator.skills.map((s) => [s.skillId, s.level]),
  );
  let isSkillStrictlySuperior = false;

  // 2. 检查 dominator 是否覆盖 dominated 的所有技能，且等级不低于对方
  for (const dominatedSkill of dominated.skills) {
    const dominatorLevel = dominatorSkillsMap.get(dominatedSkill.skillId);
    // 如果 dominator 缺少 dominated 的某个技能，或者等级更低，则不能完爆
    if (!dominatorLevel || dominatorLevel < dominatedSkill.level) {
      return false;
    }
    if (dominatorLevel > dominatedSkill.level) {
      isSkillStrictlySuperior = true;
    }
  }

  // 如果 dominator 的技能数量比 dominated 多，也算技能更优
  // （前提是它已经包含了 dominated 的所有技能，这一点已在上面的循环中确认）
  if (dominator.skills.length > dominated.skills.length) {
    isSkillStrictlySuperior = true;
  }

  // 3. 两者不能完全相同，必须至少有一项严格更优
  const isSlotStrictlySuperior = slotComparison === "superior";

  return isSlotStrictlySuperior || isSkillStrictlySuperior;
}

/**
 * 验证护石是否应该添加（V3版 - 采用完爆检查逻辑）
 *
 * @param newCharm - 新护石（需包含计算好的`equivalentSlots`和`keySkillValue`）
 * @param existingCharms - 现有护石列表
 * @param skillsData - 完整的技能数据
 * @returns 详细的验证结果
 */
export function validateCharm(
  newCharm: Omit<Charm, "id" | "createdAt">,
  existingCharms: Charm[],
  skillsData: Skill[],
): CharmValidationResult {
  // Phase 0: 如果数据库为空，直接接受
  if (existingCharms.length === 0) {
    return { isValid: true, status: "ACCEPTED_AS_FIRST" };
  }

  // Phase 1: 全面完爆检查
  // 1.1: 检查新护石是否被任何现有护石完爆（绝对劣势）
  for (const existingCharm of existingCharms) {
    if (isDominating(existingCharm, newCharm as Charm)) {
      return {
        isValid: false,
        status: "REJECTED_AS_INFERIOR",
        betterCharm: existingCharm,
      };
    }
  }

  // 1.2: 检查新护石完爆了哪些现有护石（绝对优势）
  const outclassedCharms = existingCharms.filter((existingCharm) =>
    isDominating(newCharm, existingCharm),
  );

  // Phase 2: 确定接受理由（不再提前返回）
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
    // 检查是否拥有独特技能（基于旧的锚点技能逻辑）
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

  // Phase 3: 生成警告
  const warnings: string[] = [];
  if (existingCharms.length > 0) {
    const avgKeySkillValue = stats.totalKeySkillValue / existingCharms.length;
    if (newCharm.keySkillValue < avgKeySkillValue - KEY_SKILL_VALUE_THRESHOLD) {
      warnings.push(
        `该护石核心价值(${newCharm.keySkillValue.toFixed(1)})明显低于平均值(${avgKeySkillValue.toFixed(1)})`,
      );
    }
  }

  // Phase 4: 组装并返回最终结果
  return {
    isValid: true,
    status,
    warnings: warnings.length > 0 ? warnings : undefined,
    outclassedCharms:
      outclassedCharms.length > 0 ? outclassedCharms : undefined,
  };
}

/**
 * 检查技能是否完全相同
 *
 * 辅助函数，用于判断两个护石的技能列表是否完全相同（包括等级）
 *
 * @param skills1 - 第一个技能列表
 * @param skills2 - 第二个技能列表
 * @returns true表示技能完全相同
 */
export function areSkillsIdentical(
  skills1: SkillWithLevel[],
  skills2: SkillWithLevel[],
): boolean {
  if (skills1.length !== skills2.length) {
    return false;
  }

  // 对每个技能进行比较
  for (const skill1 of skills1) {
    const skill2 = skills2.find((s) => s.skillId === skill1.skillId);
    if (!skill2 || skill2.level !== skill1.level) {
      return false;
    }
  }

  return true;
}

/**
 * 检查孔位是否完全相同
 *
 * 辅助函数，用于判断两个护石的孔位列表是否完全相同
 *
 * @param slots1 - 第一个孔位列表
 * @param slots2 - 第二个孔位列表
 * @returns true表示孔位完全相同
 */
export function areSlotsIdentical(slots1: Slot[], slots2: Slot[]): boolean {
  if (slots1.length !== slots2.length) {
    return false;
  }

  // 统计孔位
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

  // 比较每个类型等级的数量
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
