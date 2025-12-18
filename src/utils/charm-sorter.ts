/**
 * MHWS护石管理器 - 护石排序工具
 *
 * 提供护石排序功能，支持多种排序字段和方向
 */

import type {
  Charm,
  CharmSortField,
  SortDirection,
  EquivalentSlots,
} from "@/types";

/**
 * 护石排序函数
 *
 * 根据指定的字段和方向对护石数组进行排序
 *
 * @param charms - 待排序的护石数组
 * @param sortField - 排序字段（支持核心技能价值、稀有度、创建时间、各类孔位）
 * @param direction - 排序方向（asc升序/desc降序）
 * @returns 排序后的新护石数组（不修改原数组）
 *
 * @example
 * // 按核心技能价值降序排序
 * sortCharms(charms, 'keySkillValue', 'desc')
 *
 * @example
 * // 按创建时间升序排序
 * sortCharms(charms, 'createdAt', 'asc')
 *
 * @example
 * // 按武器孔位2级降序排序
 * sortCharms(charms, 'weaponSlot2', 'desc')
 */
export function sortCharms(
  charms: Charm[],
  sortField: CharmSortField,
  direction: SortDirection,
): Charm[] {
  // 创建数组副本，避免修改原数组
  const sorted = [...charms].sort((a, b) => {
    let aValue: number;
    let bValue: number;

    // 根据排序字段获取对应的值
    if (sortField === "createdAt") {
      // 创建时间需要转换为时间戳进行比较
      aValue = new Date(a.createdAt).getTime();
      bValue = new Date(b.createdAt).getTime();
    } else if (sortField === "keySkillValue" || sortField === "rarity") {
      // 直接使用数值字段
      aValue = a[sortField];
      bValue = b[sortField];
    } else {
      // 等效孔位字段（weaponSlot1/2/3, armorSlot1/2/3）
      aValue = a.equivalentSlots[sortField as keyof EquivalentSlots];
      bValue = b.equivalentSlots[sortField as keyof EquivalentSlots];
    }

    // 根据排序方向返回比较结果
    return direction === "asc" ? aValue - bValue : bValue - aValue;
  });

  return sorted;
}

/**
 * 默认排序：优先核心技能价值，其次稀有度
 *
 * 按照origin.md第36行的规则：
 * - 首先按核心技能价值降序排列
 * - 核心技能价值相同时，按稀有度降序排列
 *
 * @param charms - 待排序的护石数组
 * @returns 排序后的新护石数组（不修改原数组）
 *
 * @example
 * const sorted = sortCharmsDefault(charms);
 * // 核心技能价值高的排在前面
 * // 核心技能价值相同时，稀有度高的排在前面
 */
export function sortCharmsDefault(charms: Charm[]): Charm[] {
  // 创建数组副本，避免修改原数组
  return [...charms].sort((a, b) => {
    // 首先按核心技能价值降序
    if (a.keySkillValue !== b.keySkillValue) {
      return b.keySkillValue - a.keySkillValue;
    }

    // 核心技能价值相同时，按稀有度降序
    return b.rarity - a.rarity;
  });
}

/**
 * 多字段排序
 *
 * 支持按多个字段进行复合排序
 *
 * @param charms - 待排序的护石数组
 * @param sortFields - 排序字段数组，按优先级排列
 * @param directions - 对应的排序方向数组
 * @returns 排序后的新护石数组（不修改原数组）
 *
 * @example
 * // 先按核心技能价值降序，再按稀有度降序，最后按创建时间升序
 * sortCharmsMultiple(
 *   charms,
 *   ['keySkillValue', 'rarity', 'createdAt'],
 *   ['desc', 'desc', 'asc']
 * )
 */
export function sortCharmsMultiple(
  charms: Charm[],
  sortFields: CharmSortField[],
  directions: SortDirection[],
): Charm[] {
  // 确保两个数组长度一致
  if (sortFields.length !== directions.length) {
    throw new Error("排序字段和排序方向数组长度必须一致");
  }

  // 创建数组副本，避免修改原数组
  return [...charms].sort((a, b) => {
    // 依次比较每个排序字段
    for (let i = 0; i < sortFields.length; i++) {
      const field = sortFields[i];
      const direction = directions[i];

      let aValue: number;
      let bValue: number;

      // 获取字段值
      if (field === "createdAt") {
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
      } else if (field === "keySkillValue" || field === "rarity") {
        aValue = a[field];
        bValue = b[field];
      } else {
        aValue = a.equivalentSlots[field as keyof EquivalentSlots];
        bValue = b.equivalentSlots[field as keyof EquivalentSlots];
      }

      // 如果当前字段的值不相等，返回比较结果
      if (aValue !== bValue) {
        return direction === "asc" ? aValue - bValue : bValue - aValue;
      }

      // 如果相等，继续比较下一个字段
    }

    // 所有字段都相等
    return 0;
  });
}

/**
 * 按技能过滤并排序
 *
 * 筛选包含指定技能的护石，并按核心技能价值排序
 * 用于在添加护石时高亮显示包含相同核心技能的护石（origin.md第42行）
 *
 * @param charms - 护石数组
 * @param skillId - 技能ID
 * @param isKeySkill - 是否为核心技能
 * @returns 包含指定技能的护石数组，按核心技能价值降序排列
 *
 * @example
 * // 查找包含特定核心技能的护石
 * const filtered = filterAndSortBySkill(charms, 'skill-123', true);
 */
export function filterAndSortBySkill(
  charms: Charm[],
  skillId: string,
  isKeySkill = false,
): Charm[] {
  // 筛选包含指定技能的护石
  const filtered = charms.filter((charm) =>
    charm.skills.some((skill) => skill.skillId === skillId),
  );

  // 如果是核心技能，优先显示
  // 按核心技能价值降序排列
  if (isKeySkill) {
    return sortCharmsDefault(filtered);
  }

  // 非核心技能也按默认规则排序
  return sortCharmsDefault(filtered);
}
