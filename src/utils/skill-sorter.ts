import type { Skill } from "@/types";

/**
 * 比较两个技能的优先级
 *
 * 排序规则：
 * 1. 技能分类：武器技能 > 防具技能 > 系列技能 > 组合技能
 * 2. 技能等级：降序
 * 3. 满级优先：当前等级 >= 最大等级
 * 4. 核心技能：isKey 为 true 优先
 * 5. SortId：升序
 */
export function compareSkills(
  a: { level: number; skillData?: Skill | null },
  b: { level: number; skillData?: Skill | null },
): number {
  // 处理缺失数据的情况，有数据的排前面
  if (!a.skillData && !b.skillData) return 0;
  if (!a.skillData) return 1;
  if (!b.skillData) return -1;

  const categoryOrder = ["weapon", "armor", "series", "group"];
  const aCategoryIndex = categoryOrder.indexOf(a.skillData.category);
  const bCategoryIndex = categoryOrder.indexOf(b.skillData.category);

  // 1. Category
  if (aCategoryIndex !== bCategoryIndex) {
    // 如果某个分类不在列表中（比如未知分类），indexOf 返回 -1，应该排在最后
    if (aCategoryIndex === -1) return 1;
    if (bCategoryIndex === -1) return -1;
    return aCategoryIndex - bCategoryIndex;
  }

  // 2. Level (Desc)
  if (a.level !== b.level) {
    return b.level - a.level;
  }

  // 3. Max Level (Full level first)
  const aIsMax = a.level >= a.skillData.maxLevel;
  const bIsMax = b.level >= b.skillData.maxLevel;
  if (aIsMax !== bIsMax) {
    return aIsMax ? -1 : 1;
  }

  // 4. Is Key (Key first)
  if (a.skillData.isKey !== b.skillData.isKey) {
    return a.skillData.isKey ? -1 : 1;
  }

  // 5. SortId (Asc)
  return a.skillData.sortId - b.skillData.sortId;
}
