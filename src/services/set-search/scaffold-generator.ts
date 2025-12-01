import { cloneDeep } from 'lodash-es';

import type {
    Armor,
    ArmorType,
    EquipmentSet,
    PreprocessedData,
    SearchContext,
    SkillWithLevel,
} from '@/types';

const ARMOR_TYPES: ArmorType[] = ['helm', 'body', 'arm', 'waist', 'leg'];

/**
 *
 * @param requiredLevel - 需要达成的技能等级 (e.g., 5 for '煌雷龙之力' Lv5).
 * @param armorProvidersByPart - 按部位分组的、所有提供该Series技能的防具.
 * @returns 返回所有可能的基础骨架 (EquipmentSet[]).
 */
function findSeriesSkillCombosWithConstraints(
    requiredLevel: number,
    armorProvidersByPart: Map<ArmorType, Armor[]>,
    occupiedTypes: Set<ArmorType>,
): EquipmentSet[] {
    const solutions: EquipmentSet[] = [];
    const availableTypes = [...armorProvidersByPart.keys()].filter(
        type => (armorProvidersByPart.get(type)?.length || 0) > 0 && !occupiedTypes.has(type)
    );

    // 剪枝: 如果有防具的部位总数都小于需求等级，则不可能满足
    if (availableTypes.length < requiredLevel) {
        return [];
    }

    // 递归函数，用于生成所有可能的“部位组合”
    const findPartCombos = (startIndex: number, currentCombo: ArmorType[]) => {
        if (currentCombo.length === requiredLevel) {
            // 当找到一个有效的部位组合后，为这个组合生成所有可能的“防具组合”
            generateEquipmentSetsForPartCombo(currentCombo, solutions, armorProvidersByPart);
            return;
        }

        if (startIndex >= availableTypes.length) return;

        for (let i = startIndex; i < availableTypes.length; i++) {
            currentCombo.push(availableTypes[i]);
            findPartCombos(i + 1, currentCombo);
            currentCombo.pop();
        }
    };

    findPartCombos(0, []);
    return solutions;
}

/**
 * 辅助函数，为一个给定的“部位组合”生成所有可能的“防具组合”。
 */
function generateEquipmentSetsForPartCombo(
    partCombo: ArmorType[],
    solutions: EquipmentSet[],
    armorProvidersByPart: Map<ArmorType, Armor[]>
) {
    let currentSolutions: EquipmentSet[] = [{}];

    for (const type of partCombo) {
        const nextSolutions: EquipmentSet[] = [];
        const armorsForType = armorProvidersByPart.get(type) || [];

        for (const armor of armorsForType) {
            for (const solution of currentSolutions) {
                const newSolution = cloneDeep(solution);
                newSolution[type] = { equipment: armor, accessories: [] };
                nextSolutions.push(newSolution);
            }
        }
        currentSolutions = nextSolutions;
    }

    solutions.push(...currentSolutions);
}

/**
 * 在给定的约束（已占用部位）下，寻找满足一组Group技能需求的防具组合。
 *
 * @param skillsToProcess - 需要满足的Group技能列表.
 * @param preprocessedData - 预处理数据，用于获取技能提供者.
 * @param occupiedTypes - 已经被Series骨架占用的防具部位.
 * @returns 返回所有能满足需求的“补充骨架” (EquipmentSet[]).
 */
function findGroupSkillCombos(
    skillsToProcess: SkillWithLevel[],
    preprocessedData: PreprocessedData,
    occupiedTypes: Set<ArmorType>,
): EquipmentSet[] {
    const solutions: EquipmentSet[] = [];
    const availableTypes = ARMOR_TYPES.filter(type => !occupiedTypes.has(type));

    // 1. 构建候选防具池
    const requiredSkillIds = new Set(skillsToProcess.map(s => s.skillId));
    const candidateArmors = new Map<ArmorType, Armor[]>();
    availableTypes.forEach(type => candidateArmors.set(type, []));

    // 遍历所有group技能，找到它们的提供者
    for (const skillId of requiredSkillIds) {
        const providers = preprocessedData.skillProviderMap.get(skillId)?.armors || [];
        for (const armor of providers) {
            if (candidateArmors.has(armor.type)) {
                // 避免重复添加
                const existing = candidateArmors.get(armor.type)!;
                if (!existing.find(a => a.id === armor.id)) {
                    existing.push(armor);
                }
            }
        }
    }

    // 2. 定义并启动回溯
    const backtrack = (
        typeIndex: number,
        currentScaffold: EquipmentSet,
        currentSkills: Map<string, number>
    ) => {
        // Base Case: 遍历完所有可用部位
        if (typeIndex >= availableTypes.length) {
            // 检查当前组合是否满足所有group技能需求
            const isSuccess = skillsToProcess.every(
                target => (currentSkills.get(target.skillId) || 0) >= target.level
            );

            if (isSuccess) {
                solutions.push(cloneDeep(currentScaffold));
            }
            return;
        }

        const currentType = availableTypes[typeIndex];
        const armorsForType = candidateArmors.get(currentType) || [];

        // 选择1: 不为该部位选择防具
        backtrack(typeIndex + 1, currentScaffold, currentSkills);

        // 选择2: 为该部位选择一件防具
        for (const armor of armorsForType) {
            // a. 更新状态
            currentScaffold[currentType] = { equipment: armor, accessories: [] };
            armor.skills.forEach(skill => {
                const currentLevel = currentSkills.get(skill.skillId) || 0;
                currentSkills.set(skill.skillId, currentLevel + skill.level);
            });

            // b. 递归
            backtrack(typeIndex + 1, currentScaffold, currentSkills);

            // c. 回溯
            delete currentScaffold[currentType];
            armor.skills.forEach(skill => {
                const currentLevel = currentSkills.get(skill.skillId) || 0;
                currentSkills.set(skill.skillId, currentLevel - skill.level);
            });
        }
    };

    backtrack(0, {}, new Map());
    return solutions;
}

/**
 * 递归求解器，用于处理多个（组合的）Series技能需求。
 */
function resolveCombinedSeriesScaffolds(
    seriesSkills: SkillWithLevel[],
    preprocessedData: PreprocessedData,
    occupiedTypes: Set<ArmorType>,
): EquipmentSet[] {
    const finalScaffolds: EquipmentSet[] = [];

    // 按满足难度排序，提供者越少的技能越难满足，优先处理
    const sortedSeriesSkills = [...seriesSkills].sort((a, b) => {
        const providersA = preprocessedData.skillProviderMap.get(a.skillId)?.armors.length || 0;
        const providersB = preprocessedData.skillProviderMap.get(b.skillId)?.armors.length || 0;
        return providersA - providersB;
    });

    const findCombosRecursive = (
        skillIndex: number,
        currentScaffold: EquipmentSet,
        currentOccupiedTypes: Set<ArmorType>
    ) => {
        // Base Case: 所有 series 技能都已成功处理
        if (skillIndex >= sortedSeriesSkills.length) {
            finalScaffolds.push(cloneDeep(currentScaffold));
            return;
        }

        const currentSkill = sortedSeriesSkills[skillIndex];
        const armorProviders = preprocessedData.skillProviderMap.get(currentSkill.skillId)?.armors || [];

        // 按部位对当前技能的防具提供者进行分组
        const providersByPart = new Map<ArmorType, Armor[]>();
        ARMOR_TYPES.forEach(type => providersByPart.set(type, []));
        armorProviders.forEach(armor => {
            providersByPart.get(armor.type)?.push(armor);
        });

        // 寻找满足当前技能的“增量骨架”，并传入已占用的部位作为约束
        const incrementalScaffolds = findSeriesSkillCombosWithConstraints(
            currentSkill.level,
            providersByPart,
            currentOccupiedTypes,
        );

        // 遍历所有找到的增量骨架，并进行递归
        for (const increment of incrementalScaffolds) {
            // a. 合并骨架
            const nextScaffold = { ...currentScaffold, ...increment };
            // b. 更新已占用部位
            const nextOccupiedTypes = new Set(currentOccupiedTypes);
            Object.keys(increment).forEach(type => nextOccupiedTypes.add(type as ArmorType));

            // c. 递归处理下一个技能
            findCombosRecursive(skillIndex + 1, nextScaffold, nextOccupiedTypes);
        }
    };

    findCombosRecursive(0, {}, occupiedTypes);
    return finalScaffolds;
}

/**
 * 防具骨架生成器
 * 采用分层处理策略，优先处理强约束的Series技能，再处理Group技能
 * 支持单一及组合Series技能需求
 */
export function generateArmorScaffolds(
    context: SearchContext,
    preprocessedData: PreprocessedData,
): EquipmentSet[] {
    const { seriesSkills, groupSkills } = context.skillDeficits;
    const finalScaffolds: EquipmentSet[] = [];

    // 从context中提取已经被固定的防具位置
    const occupiedTypesFromContext = new Set<ArmorType>();
    ARMOR_TYPES.forEach(type => {
        if (context.equipment[type]) {
            occupiedTypesFromContext.add(type);
        }
    });

    // Case 1: 存在 Series 技能需求 (主要流程)
    if (seriesSkills.length > 0) {
        // 1a. [V3] 调用高阶求解器，生成所有满足全部 Series 技能的基础骨架
        const baseScaffolds = resolveCombinedSeriesScaffolds(seriesSkills, preprocessedData, occupiedTypesFromContext);

        // 1b. 在每个基础骨架上，校验和补充 Group 技能
        for (const baseScaffold of baseScaffolds) {
            const occupiedTypes = new Set(Object.keys(baseScaffold) as ArmorType[]);
            occupiedTypesFromContext.forEach(type => occupiedTypes.add(type));

            // 计算基础骨架已提供的 Group 技能等级
            const currentGroupLevels = new Map<string, number>();
            const requiredGroupSkillIds = new Set(groupSkills.map(s => s.skillId));
            const equipmentToScan = { ...context.equipment, ...baseScaffold };

            (Object.values(equipmentToScan) as { equipment: Armor, accessories: [] }[]).forEach(({ equipment }) => {
                if (equipment && 'type' in equipment && ARMOR_TYPES.includes(equipment.type as ArmorType)) {
                    equipment.skills.forEach((skill: SkillWithLevel) => {
                        if (requiredGroupSkillIds.has(skill.skillId)) {
                            const existing = currentGroupLevels.get(skill.skillId) || 0;
                            currentGroupLevels.set(skill.skillId, existing + skill.level);
                        }
                    });
                }
            });


            // 筛选出仍有缺口的 Group 技能
            const remainingGroupDeficits = groupSkills
                .map(target => ({
                    skillId: target.skillId,
                    level: target.level - (currentGroupLevels.get(target.skillId) || 0),
                }))
                .filter(skill => skill.level > 0);

            // 如果 Group 技能已全部满足
            if (remainingGroupDeficits.length === 0) {
                finalScaffolds.push(baseScaffold);
                continue;
            }

            // 如果骨架已满，但 Group 技能仍有缺口，则此骨架无效
            if (occupiedTypes.size === ARMOR_TYPES.length) {
                continue;
            }

            // 尝试在空余部位补全 Group 技能
            const groupFillers = findGroupSkillCombos(remainingGroupDeficits, preprocessedData, occupiedTypes);
            for (const filler of groupFillers) {
                // 合并基础骨架和补充骨架
                const combinedScaffold = { ...baseScaffold, ...filler };
                finalScaffolds.push(combinedScaffold);
            }
        }
    }
    // Case 2: 只存在 Group 技能需求
    else if (groupSkills.length > 0) {
        return findGroupSkillCombos(groupSkills, preprocessedData, occupiedTypesFromContext);
    }
    // Case 3: 无 Series/Group 技能需求
    else {
        return [{}]; // 返回一个空骨架，表示无需特定防具
    }

    return finalScaffolds;
}