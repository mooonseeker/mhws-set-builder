import type {
  Accessory,
  AccessorySolution,
  Skill,
  SkillDeficit,
  Slot,
} from "@/types";

/**
 * 孔位计数类型，用于匿名化孔位
 */
interface SlotCounts {
  weapon: Map<number, number>; // 等级 -> 数量
  armor: Map<number, number>; // 等级 -> 数量
}

/**
 * 装饰品填充求解器
 * 使用回溯算法找出所有可行的装饰品组合方案
 * 现在支持多种组合方式和多次镶嵌满足单一技能缺口
 *
 * 算法策略：
 * 1. 孔位匿名化：将孔位按类型和等级计数，避免因sourceId产生重复组合
 * 2. 技能缺口排序：优先处理组合方式少的技能，其次是需要高级孔位的技能
 * 3. 回溯搜索：递归找出所有满足技能缺口的装饰品组合
 * 4. 结果具象化：将抽象组合映射回具体的孔位来源
 *
 * @param deficits - 技能缺口列表
 * @param availableSlots - 可用孔位对象，包含武器和防具孔位
 * @param accessoriesBySkill - 按技能分组的装饰品映射
 * @param skillDetails - 技能详情映射，用于获取技能类型
 * @returns 所有可行的装饰品填充方案数组
 */
export function solveAccessories(
  deficits: SkillDeficit[],
  availableSlots: { weapon: Slot[]; armor: Slot[] },
  accessoriesBySkill: Map<string, Accessory[]>,
  skillDetails: Map<string, Skill>,
): AccessorySolution[] {
  // 1. 孔位匿名化
  const slotCounts = abstractSlots(availableSlots);

  // 2. 技能缺口排序
  const sortedDeficits = sortDeficits(
    deficits,
    accessoriesBySkill,
    skillDetails,
  );

  // 3. 核心回溯计算
  const accessoryLists = findCombinations(
    sortedDeficits,
    slotCounts,
    accessoriesBySkill,
    skillDetails,
  );

  // 4. 结果具象化
  const solutions: AccessorySolution[] = [];
  for (const accessoryList of accessoryLists) {
    const solution = mapAccessoriesToSlots(accessoryList, availableSlots);
    if (solution) {
      solutions.push(solution);
    }
  }

  console.log("[Debug] solveAccessories found", solutions.length, "solutions");
  return solutions;
}

/**
 * 孔位匿名化：将孔位按类型和等级转换为计数
 */
function abstractSlots(availableSlots: {
  weapon: Slot[];
  armor: Slot[];
}): SlotCounts {
  const slotCounts: SlotCounts = {
    weapon: new Map<number, number>(),
    armor: new Map<number, number>(),
  };

  // 初始化所有可能的等级（1-3）
  for (let level = 1; level <= 3; level++) {
    slotCounts.weapon.set(level, 0);
    slotCounts.armor.set(level, 0);
  }

  // 统计武器孔位
  for (const slot of availableSlots.weapon) {
    const current = slotCounts.weapon.get(slot.level) || 0;
    slotCounts.weapon.set(slot.level, current + 1);
  }

  // 统计防具孔位
  for (const slot of availableSlots.armor) {
    const current = slotCounts.armor.get(slot.level) || 0;
    slotCounts.armor.set(slot.level, current + 1);
  }

  return slotCounts;
}

/**
 * 技能缺口排序：按照失败优先策略排序
 * 1. 组合方式数量（升序） - 可选珠子种类少的优先
 * 2. accessoryLevel（降序） - 需要高级孔位的优先
 * 3. missingLevel（降序） - 缺口大的优先
 */
function sortDeficits(
  deficits: SkillDeficit[],
  accessoriesBySkill: Map<string, Accessory[]>,
  skillDetails: Map<string, Skill>,
): SkillDeficit[] {
  return [...deficits].sort((a, b) => {
    const skillA = skillDetails.get(a.skillId);
    const skillB = skillDetails.get(b.skillId);

    if (!skillA || !skillB) {
      return 0;
    }

    // 计算组合方式数量（近似于可选珠子种类数量）
    const aCandidates = accessoriesBySkill.get(a.skillId) || [];
    const bCandidates = accessoriesBySkill.get(b.skillId) || [];

    // 去重后的珠子种类数量（按slotLevel和提供的技能等级组合）
    const aUniqueTypes = new Set(
      aCandidates.map(
        (acc) =>
          `${acc.slotLevel}-${acc.skills.find((s) => s.skillId === a.skillId)?.level}`,
      ),
    ).size;

    const bUniqueTypes = new Set(
      bCandidates.map(
        (acc) =>
          `${acc.slotLevel}-${acc.skills.find((s) => s.skillId === b.skillId)?.level}`,
      ),
    ).size;

    // 1. 组合方式数量（升序）
    if (aUniqueTypes !== bUniqueTypes) {
      return aUniqueTypes - bUniqueTypes;
    }

    // 2. accessoryLevel（降序）
    if (skillA.accessoryLevel !== skillB.accessoryLevel) {
      return skillB.accessoryLevel - skillA.accessoryLevel;
    }

    // 3. missingLevel（降序）
    return b.missingLevel - a.missingLevel;
  });
}

/**
 * 核心回溯函数：找出所有满足技能缺口的装饰品组合
 */
function findCombinations(
  deficits: SkillDeficit[],
  slotCounts: SlotCounts,
  accessoriesBySkill: Map<string, Accessory[]>,
  skillDetails: Map<string, Skill>,
): Accessory[][] {
  // 基线条件：所有缺口都已满足
  if (deficits.length === 0) {
    return [[]]; // 返回一个空组合
  }

  const [currentDeficit, ...remainingDeficits] = deficits;
  const allSolutions: Accessory[][] = [];

  // 获取满足当前缺口的所有方式
  const ways = findWaysToSatisfyDeficit(
    currentDeficit,
    slotCounts,
    accessoriesBySkill,
    skillDetails,
  );

  for (const way of ways) {
    // 为这种方式创建新的slotCounts副本
    const newSlotCounts = {
      weapon: new Map(slotCounts.weapon),
      armor: new Map(slotCounts.armor),
    };

    // 消耗孔位
    let isValid = true;
    for (const accessory of way) {
      const slotType = accessory.type; // 直接使用装饰品的type属性
      const slotLevel = accessory.slotLevel;
      const currentCount = newSlotCounts[slotType].get(slotLevel) || 0;

      if (currentCount <= 0) {
        isValid = false;
        break;
      }
      newSlotCounts[slotType].set(slotLevel, currentCount - 1);
    }

    if (!isValid) {
      continue;
    }

    // 递归处理剩余缺口
    const solutionsForRest = findCombinations(
      remainingDeficits,
      newSlotCounts,
      accessoriesBySkill,
      skillDetails,
    );

    // 组合结果
    for (const restSolution of solutionsForRest) {
      allSolutions.push([...way, ...restSolution]);
    }
  }

  return allSolutions;
}

/**
 * 找出满足单个技能缺口的所有装饰品组合方式
 */
function findWaysToSatisfyDeficit(
  deficit: SkillDeficit,
  slotCounts: SlotCounts,
  accessoriesBySkill: Map<string, Accessory[]>,
  skillDetails: Map<string, Skill>,
): Accessory[][] {
  const skill = skillDetails.get(deficit.skillId);
  if (!skill) {
    return [];
  }

  const slotType = skill.category === "weapon" ? "weapon" : "armor";
  const candidates = accessoriesBySkill.get(deficit.skillId) || [];
  const typeFilteredCandidates = candidates.filter(
    (acc) => acc.type === slotType,
  );

  const ways: Accessory[][] = [];

  // 使用回溯找出所有能满足缺口的装饰品组合
  function findWaysRecursive(
    currentLevel: number,
    currentCombination: Accessory[],
    startIndex: number,
  ) {
    if (currentLevel >= deficit.missingLevel) {
      ways.push([...currentCombination]);
      return;
    }

    for (let i = startIndex; i < typeFilteredCandidates.length; i++) {
      const accessory = typeFilteredCandidates[i];
      const skillLevel =
        accessory.skills.find((s) => s.skillId === deficit.skillId)?.level || 0;

      if (skillLevel > 0) {
        // 检查孔位是否足够
        const requiredSlots = countRequiredSlots(
          [...currentCombination, accessory],
          slotType,
          slotCounts,
        );
        if (requiredSlots) {
          findWaysRecursive(
            currentLevel + skillLevel,
            [...currentCombination, accessory],
            i, // 允许重复选择同种装饰品
          );
        }
      }
    }
  }

  findWaysRecursive(0, [], 0);
  return ways;
}

/**
 * 计算装饰品组合所需的孔位是否可用
 */
function countRequiredSlots(
  accessories: Accessory[],
  slotType: "weapon" | "armor",
  slotCounts: SlotCounts,
): boolean {
  const slotDemand = new Map<number, number>();

  for (const accessory of accessories) {
    const level = accessory.slotLevel;
    const current = slotDemand.get(level) || 0;
    slotDemand.set(level, current + 1);
  }

  // 检查每个等级的需求是否不超过供给
  for (const [level, demand] of slotDemand.entries()) {
    const supply = slotCounts[slotType].get(level) || 0;
    if (demand > supply) {
      return false;
    }
  }

  return true;
}

/**
 * 将装饰品组合映射回具体的孔位来源
 */
function mapAccessoriesToSlots(
  accessoryList: Accessory[],
  originalSlots: { weapon: Slot[]; armor: Slot[] },
): AccessorySolution | null {
  // 复制原始孔位
  const remainingWeaponSlots = [...originalSlots.weapon];
  const remainingArmorSlots = [...originalSlots.armor];
  const placement = new Map<string, Accessory[]>();

  // 按孔位等级排序，优先使用小孔位
  remainingWeaponSlots.sort((a, b) => a.level - b.level);
  remainingArmorSlots.sort((a, b) => a.level - b.level);

  for (const accessory of accessoryList) {
    const slotType = accessory.type;
    const targetSlots =
      slotType === "weapon" ? remainingWeaponSlots : remainingArmorSlots;

    // 寻找能容纳该装饰品的最小孔位
    const slotIndex = targetSlots.findIndex(
      (slot) => slot.level >= accessory.slotLevel,
    );

    if (slotIndex === -1) {
      // 找不到合适孔位，该方案无效
      return null;
    }

    const slot = targetSlots[slotIndex];
    if (!slot.sourceId) {
      console.error(
        "CRITICAL: slot is missing sourceId in mapAccessoriesToSlots",
        slot,
      );
      return null;
    }

    // 记录放置信息
    if (!placement.has(slot.sourceId)) {
      placement.set(slot.sourceId, []);
    }
    placement.get(slot.sourceId)!.push(accessory);

    // 移除已使用的孔位
    targetSlots.splice(slotIndex, 1);
  }

  return {
    isSuccess: true,
    placement,
    remainingSlots: {
      weapon: remainingWeaponSlots,
      armor: remainingArmorSlots,
    },
  };
}
