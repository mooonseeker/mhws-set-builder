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
 * v7.1 数据预处理函数
 * 根据 automode-new-plan.md 规范重写。
 * 将原始数据数组转换为高效的Map结构，用于配装搜索算法。
 * 主要产出：
 * - skillProviderMap: 详尽的技能来源索引
 * - maxPotentialPerArmorType: [核心] 各防具部位对各技能的理论最大潜力
 */
export function preprocess(
  allArmors: Armor[],
  allWeapons: Weapon[],
  allCharms: Charm[],
  allAccessories: Accessory[],
  allSkills: Skill[],
): PreprocessedData {
  // 初始化所有核心Map对象
  const skillProviderMap = new Map<string, SkillProviders>();
  const maxPotentialPerArmorType = new Map<ArmorType, Map<string, number>>();
  const accessoriesBySkill = new Map<string, Accessory[]>();
  const skillDetails = new Map<string, Skill>();

  // 1. 初始化基础Map结构
  const armorTypes: ArmorType[] = ["helm", "body", "arm", "waist", "leg"];
  armorTypes.forEach((type) => {
    maxPotentialPerArmorType.set(type, new Map<string, number>());
  });

  allSkills.forEach((skill) => {
    skillDetails.set(skill.id, skill);
    // 初始化 skillProviderMap，确保每个技能都有一个条目
    skillProviderMap.set(skill.id, {
      armors: [],
      weapons: [],
      charms: [],
      accessories: [],
    });
  });

  // 2. 构建 accessoriesBySkill 和填充 skillProviderMap for accessories
  allAccessories.forEach((accessory) => {
    accessory.skills.forEach((skill) => {
      if (!accessoriesBySkill.has(skill.skillId)) {
        accessoriesBySkill.set(skill.skillId, []);
      }
      accessoriesBySkill.get(skill.skillId)!.push(accessory);

      // 同时填充到 skillProviderMap
      const providers = skillProviderMap.get(skill.skillId);
      if (providers) {
        providers.accessories.push(accessory);
      }
    });
  });

  // 3. 填充 skillProviderMap for armors, weapons, charms
  allArmors.forEach((armor) => {
    armor.skills.forEach((skill) => {
      const providers = skillProviderMap.get(skill.skillId);
      if (providers) {
        providers.armors.push(armor);
      }
    });
  });

  allWeapons.forEach((weapon) => {
    weapon.skills.forEach((skill) => {
      const providers = skillProviderMap.get(skill.skillId);
      if (providers) {
        providers.weapons.push(weapon);
      }
    });
  });

  allCharms.forEach((charm) => {
    charm.skills.forEach((skill) => {
      const providers = skillProviderMap.get(skill.skillId);
      if (providers) {
        providers.charms.push(charm);
      }
    });
  });

  // 4. [核心] 计算 maxPotentialPerArmorType
  armorTypes.forEach((armorType) => {
    const armorsOfType = allArmors.filter((a) => a.type === armorType);
    const skillPotentialMap = maxPotentialPerArmorType.get(armorType)!;

    allSkills.forEach((skill) => {
      let maxPotential = 0;

      for (const armor of armorsOfType) {
        // a. 计算自带技能潜力
        const innatePotential =
          armor.skills.find((s) => s.skillId === skill.id)?.level || 0;

        // b. 计算孔位技能潜力
        let slotPotential = 0;
        const relevantAccessories = accessoriesBySkill.get(skill.id) || [];

        // 遍历防具的每一个孔
        for (const slot of armor.slots) {
          let maxSkillForThisSlot = 0;
          // 遍历所有能提供该技能的珠子
          for (const acc of relevantAccessories) {
            // 如果珠子可以放入该孔
            if (acc.slotLevel !== -1 && acc.slotLevel <= slot.level) {
              const accSkillLevel =
                acc.skills.find((s) => s.skillId === skill.id)?.level || 0;
              maxSkillForThisSlot = Math.max(
                maxSkillForThisSlot,
                accSkillLevel,
              );
            }
          }
          slotPotential += maxSkillForThisSlot;
        }

        // c. 计算当前防具的总潜力
        const totalPotential = innatePotential + slotPotential;

        // d. 更新该部位对该技能的最大潜力
        maxPotential = Math.max(maxPotential, totalPotential);
      }

      skillPotentialMap.set(skill.id, maxPotential);
    });
  });

  // 5. 返回构建完成的PreprocessedData对象 (移除了废弃的 armorsBySeries 和 armorsByType)
  return {
    skillProviderMap,
    maxPotentialPerArmorType,
    accessoriesBySkill,
    skillDetails,
  };
}
