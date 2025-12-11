import type {
  ArmorType,
  CategorizedSkills,
  EquipmentSet,
  PreprocessedData,
  SkillWithLevel,
  Slot,
} from "@/types";

/**
 * v7.2 核心潜力剪枝函数
 *
 * 基于预计算的各部位最大技能潜力，判断在当前已选装备和剩余待选部位的条件下，
 * 是否还有可能满足 `noAccessorySkills` 和 `armorSkills` 技能需求。
 *
 * @param currentSkills - 当前装备组合（含骨架自带，不含珠子）提供的技能等级 Map
 * @param remainingArmorTypes - 剩余待选的防具部位列表
 * @param skillDeficits - 尚未被满足的技能需求
 * @param preprocessedData - 包含 `maxPotentialPerArmorType` 的预处理数据
 * @param availableSlots - 当前可用的孔位（来自已选装备）
 * @returns {boolean} - 如果确定无法满足需求，应进行剪枝，则返回 true
 */
export function shouldPrune(
  currentSkills: Map<string, number>,
  remainingArmorTypes: ArmorType[],
  skillDeficits: CategorizedSkills,
  preprocessedData: PreprocessedData,
  availableSlots?: { weapon: Slot[]; armor: Slot[] },
): boolean {
  const skillsToEvaluate: SkillWithLevel[] = [
    ...skillDeficits.noAccessorySkills,
    ...skillDeficits.armorSkills,
  ];

  for (const targetSkill of skillsToEvaluate) {
    const { skillId, level: requiredLevel } = targetSkill;
    const currentLevel = currentSkills.get(skillId) || 0;

    // 如果当前技能等级已满足需求，则跳过此技能的潜力计算
    if (currentLevel >= requiredLevel) {
      continue;
    }

    // 1. 计算剩余防具部位的潜力 (包含自带技能 + 那个部位的孔位潜力)
    let remainingPotential = 0;
    for (const armorType of remainingArmorTypes) {
      const potentialOnType =
        preprocessedData.maxPotentialPerArmorType.get(armorType);
      if (potentialOnType) {
        remainingPotential += potentialOnType.get(skillId) || 0;
      }
    }

    // 2. 计算当前已存在孔位的潜力 (仅针对 armorSkills)
    let currentSlotsPotential = 0;
    if (availableSlots && preprocessedData.accessoriesBySkill.has(skillId)) {
      const accessories =
        preprocessedData.accessoriesBySkill.get(skillId) || [];
      if (accessories.length > 0) {
        // 简单的贪心估算：所有可用孔位都插上该技能最好的珠子
        // 注意：这里不区分 weapon/armor 孔位类型限制，因为大多数 armorSkill 珠子都可以插
        // 如果有严格限制，需要更细致的判断。目前假设 armorSkills 珠子通用。
        const allSlots = [...availableSlots.weapon, ...availableSlots.armor];

        for (const slot of allSlots) {
          let maxLevelForSlot = 0;
          for (const acc of accessories) {
            if (acc.slotLevel <= slot.level) {
              const skillVal =
                acc.skills.find((s) => s.skillId === skillId)?.level || 0;
              maxLevelForSlot = Math.max(maxLevelForSlot, skillVal);
            }
          }
          currentSlotsPotential += maxLevelForSlot;
        }
      }
    }

    // 如果 当前等级 + 剩余所有部位的最大潜力 + 当前孔位潜力 < 目标等级，则不可能满足，进行剪枝
    if (
      currentLevel + remainingPotential + currentSlotsPotential <
      requiredLevel
    ) {
      // console.log(`[Prune] Skill ${skillId}: Current ${currentLevel} + RemPot ${remainingPotential} + SlotPot ${currentSlotsPotential} < Required ${requiredLevel}`);
      return true; // Prune this branch
    }
  }

  return false; // Do not prune
}

/**
 * v7.2-Final Corrected: 验证最终组合是否满足套装(Series)和组合(Group)技能需求
 * 统一逻辑：两类技能都通过累加各部件上的技能等级来满足。
 *
 * @param equipment - 包含5件防具的最终装备组合
 * @param skillDeficits - 需要满足的技能需求
 * @returns {boolean} - 如果满足所有 series/group 技能需求，返回 true
 */
export function validateBaseSkills(
  equipment: EquipmentSet,
  skillDeficits: CategorizedSkills,
): boolean {
  const ARMOR_TYPES: ArmorType[] = ["helm", "body", "arm", "waist", "leg"];
  const skillsToValidate = [
    ...skillDeficits.seriesSkills,
    ...skillDeficits.groupSkills,
  ];

  for (const targetSkill of skillsToValidate) {
    const { skillId, level: requiredLevel } = targetSkill;

    let currentLevel = 0;
    ARMOR_TYPES.forEach((type) => {
      const armorPiece = equipment[type]?.equipment;
      if (armorPiece) {
        const skillOnPiece = armorPiece.skills.find(
          (s) => s.skillId === skillId,
        );
        if (skillOnPiece) {
          currentLevel += skillOnPiece.level;
        }
      }
    });

    // 验证武器和护石上的技能贡献
    const weapon = equipment.weapon?.equipment;
    if (weapon) {
      const skillOnWeapon = weapon.skills.find((s) => s.skillId === skillId);
      if (skillOnWeapon) {
        currentLevel += skillOnWeapon.level;
      }
    }
    const charm = equipment.charm?.equipment;
    if (charm) {
      const skillOnCharm = charm.skills.find((s) => s.skillId === skillId);
      if (skillOnCharm) {
        currentLevel += skillOnCharm.level;
      }
    }

    if (currentLevel < requiredLevel) {
      return false; // 技能等级不足
    }
  }

  // 所有 series 和 group 技能需求都得到满足
  return true;
}
