import type {
    Accessory,
    Armor,
    ArmorType,
    FinalSet,
    PreprocessedData,
    SearchContext,
    SkillDeficit,
    SkillWithLevel,
    Slot,
} from '@/types';
import { cloneDeep } from 'lodash-es';

import { solveAccessories } from './accessory-solver';
import { shouldPrune, validateBaseSkills } from './helpers';

const ARMOR_TYPES: ArmorType[] = ['helm', 'body', 'arm', 'waist', 'leg'];

/**
 * v7.2 防具骨架填充主函数
 *
 * @param context - 包含骨架信息的搜索上下文
 * @param allArmors - 所有可用防具的列表（用于填充空位）
 * @param preprocessedData - 预处理数据
 * @returns {boolean} - 返回 false 以中止搜索
 */
export function fillArmorScaffold(
    context: SearchContext,
    allArmors: Armor[],
    preprocessedData: PreprocessedData,
    finalResults: FinalSet[],
    limit: number,
): boolean {
    // console.log(`    [>>] Entering scaffold filler...`);

    // 预先将所有防具按部位分组，供回溯时快速查询
    const armorsByType = new Map<ArmorType, Armor[]>();
    ARMOR_TYPES.forEach(type => {
        armorsByType.set(type, allArmors.filter(a => a.type === type));
    });

    const shouldContinue = backtrack(0, context, finalResults, armorsByType, preprocessedData, limit);

    // console.log(`    [<<] Exiting scaffold filler.`);
    return shouldContinue;
}

/**
 * v7.2 递归回溯填充函数
 *
 * @param armorTypeIndex - 当前处理的防具部位索引 (0-4: helm -> leg)
 * @param context - 当前的搜索状态
 * @param finalResults - 存储有效解决方案的数组 (global)
 * @param armorsByType - 按部位分组的防具池
 * @param preprocessedData - 预处理数据
 * @param limit - 解决方案数量上限
 * @returns {boolean} - 返回 false 表示已达到上限，应中止所有搜索
 */
function backtrack(
    armorTypeIndex: number,
    context: SearchContext,
    finalResults: FinalSet[],
    armorsByType: Map<ArmorType, Armor[]>,
    preprocessedData: PreprocessedData,
    limit: number,
): boolean {
    const remainingArmorTypes = ARMOR_TYPES.slice(armorTypeIndex);

    const indent = '    '.repeat(armorTypeIndex + 2);

    // 1. 剪枝检查
    if (shouldPrune(context.currentSkills, remainingArmorTypes, context.skillDeficits, preprocessedData, context.availableSlots)) {
        return true; // Prune this branch, but continue searching siblings
    }

    // 2. 终止条件：5件防具都已选择
    if (armorTypeIndex === 5) {
        // 终止条件: 5件防具都已选择或指定
        // console.log(`${indent}[*] Reached level 5. All armor pieces selected. Attempting to solve...`);

        // [v7.2]BUG修复的核心：在求解珠子前，验证所有基础技能（Series/Group）是否满足
        if (!validateBaseSkills(context.equipment, context.skillDeficits)) {
            // console.log(`${indent}  -> FAILED: Base skills (Series/Group) not satisfied.`);
            return true; // 此组合无效，剪枝
        }

        // a. 计算 armorSkills 的最终缺口
        const armorSkillDeficits: SkillDeficit[] = context.skillDeficits.armorSkills
            .map((s: SkillWithLevel) => ({
                skillId: s.skillId,
                missingLevel: s.level - (context.currentSkills.get(s.skillId) || 0),
            }))
            .filter(d => d.missingLevel > 0);

        // 如果没有 armorSkills 缺口，则该组合已满足所有技能，直接生成方案
        if (armorSkillDeficits.length === 0) {
            const finalSet: FinalSet = {
                equipment: cloneDeep(context.equipment),
                accessories: new Map(), // No accessories are added here
                remainingSlots: [...context.availableSlots.armor, ...context.availableSlots.weapon],
            };
            console.log(`${indent}  -> Success: No armor skill deficits. Solution found.`);
            finalResults.push(finalSet);
            console.log('[Debug] Found a solution (no armor skill deficits):', JSON.stringify(finalSet, null, 2));
            if (finalResults.length >= limit) {
                console.log(`${indent}  -> Search limit reached!`);
                return false; // Stop searching
            }
            return true; // Continue searching
        }

        // b. 调用珠子求解器来填充 armorSkills
        console.log(`${indent}  -> Calling accessory solver for ${armorSkillDeficits.length} deficits...`);

        // 步骤 3 & 4: 收集所有防具孔位并确保 sourceId,然后调用求解器
        const allArmorSlots: Slot[] = [];
        for (const armorType of ARMOR_TYPES) {
            const armorItem = context.equipment[armorType];
            if (armorItem) {
                const armorPiece = armorItem.equipment;
                armorPiece.slots.forEach(slot => {
                    allArmorSlots.push({ ...slot, sourceId: armorPiece.id });
                });
            }
        }

        const accessorySolutions = solveAccessories(
            armorSkillDeficits,
            { weapon: [], armor: allArmorSlots }, // 只使用防具孔
            preprocessedData.accessoriesBySkill,
            preprocessedData.skillDetails,
        );

        // c. 如果填充成功，则生成最终配装方案
        if (accessorySolutions.length > 0) {
            console.log(`${indent}  -> Success: Accessory solver found ${accessorySolutions.length} solution(s).`);

            for (const solution of accessorySolutions) {
                // 为每个解决方案创建独立的 equipment 副本
                const solutionEquipment = cloneDeep(context.equipment);

                // 步骤 6: 将计算出的装饰品填充回 solutionEquipment
                solution.placement.forEach((placedAccessories, equipmentId) => {
                    const armorType = ARMOR_TYPES.find(type => solutionEquipment[type]?.equipment.id === equipmentId);

                    if (armorType) {
                        const equipmentSlot = solutionEquipment[armorType]!;
                        const totalSlots = equipmentSlot.equipment.slots.length;
                        const newAccessories: (Accessory | null)[] = Array(totalSlots).fill(null);
                        const originalSlots = equipmentSlot.equipment.slots;
                        // 优先放置需要高级孔位的珠子
                        const accessoriesToPlace = [...placedAccessories].sort((a, b) => b.slotLevel - a.slotLevel);

                        for (const accessory of accessoriesToPlace) {
                            let placed = false;
                            // 寻找第一个能容纳该珠子的空孔位
                            for (let i = 0; i < originalSlots.length; i++) {
                                if (newAccessories[i] === null && originalSlots[i].level >= accessory.slotLevel) {
                                    newAccessories[i] = accessory;
                                    placed = true;
                                    break;
                                }
                            }
                            if (!placed) {
                                console.error("CRITICAL: Could not place accessory", accessory, "on", equipmentSlot.equipment.id);
                            }
                        }
                        equipmentSlot.accessories = newAccessories;
                    }
                });

                // 步骤 7: 创建最终方案，使用已填充的 solutionEquipment，并反向生成 accessories
                const finalAccessories = new Map<string, Accessory[]>();
                Object.values(solutionEquipment).forEach(slottedEq => {
                    if (slottedEq?.accessories) {
                        const accessories = slottedEq.accessories.filter((a: Accessory | null): a is Accessory => a !== null);
                        if (accessories.length > 0) {
                            finalAccessories.set(slottedEq.equipment.id, accessories);
                        }
                    }
                });

                const finalSet: FinalSet = {
                    equipment: solutionEquipment,
                    accessories: finalAccessories,
                    remainingSlots: [...solution.remainingSlots.armor, ...context.availableSlots.weapon],
                };
                finalResults.push(finalSet);
                if (finalResults.length >= limit) {
                    console.log(`${indent}  -> Search limit reached!`);
                    return false; // Stop searching
                }
            }
        } else {
            console.log(`${indent}  -> Failure: Accessory solver could not find a solution.`);
        }
        // 如果失败，则此组合无效，直接返回
        return true; // Continue searching this branch's siblings
    }

    // 3. [v7.2] 递归遍历或直接进入下一层
    const currentArmorType = ARMOR_TYPES[armorTypeIndex];

    // 检查骨架是否已经为此部位指定了防具 (通过检查传入的 context)
    if (context.equipment[currentArmorType]) {
        // 如果已指定，则不进行遍历，直接进入下一层级的回溯
        // console.log(`${indent}[S] Using scaffolded piece for ${currentArmorType}.`);
        const shouldContinue = backtrack(
            armorTypeIndex + 1,
            context,
            finalResults,
            armorsByType,
            preprocessedData,
            limit,
        );
        if (!shouldContinue) {
            return false;
        }
    } else {
        // 如果该部位为空，则对此部位的所有可用防具进行遍历填充
        const availableArmors = armorsByType.get(currentArmorType) || [];
        for (const armorPiece of availableArmors) {
            // 1. Mutate state forward
            // 将孔位与来源ID关联
            const slotsWithSource = armorPiece.slots.map(s => ({ ...s, sourceId: armorPiece.id }));
            context.equipment[currentArmorType] = { equipment: armorPiece, accessories: [] };
            const oldSkillLevels = new Map<string, number | undefined>();
            armorPiece.skills.forEach(skill => {
                const oldLevel = context.currentSkills.get(skill.skillId);
                oldSkillLevels.set(skill.skillId, oldLevel);
                context.currentSkills.set(skill.skillId, (oldLevel || 0) + skill.level);
            });
            const slotsAddedCount = armorPiece.slots.length;
            context.availableSlots.armor.push(...slotsWithSource);

            // 2. Recurse
            const shouldContinue = backtrack(armorTypeIndex + 1, context, finalResults, armorsByType, preprocessedData, limit);

            // 3. Revert state
            context.availableSlots.armor.splice(context.availableSlots.armor.length - slotsAddedCount, slotsAddedCount);
            armorPiece.skills.forEach(skill => {
                const oldLevel = oldSkillLevels.get(skill.skillId);
                if (oldLevel === undefined) context.currentSkills.delete(skill.skillId);
                else context.currentSkills.set(skill.skillId, oldLevel);
            });
            delete context.equipment[currentArmorType];

            // 4. Propagate stop signal
            if (!shouldContinue) return false;
        }
    }
    return true; // Continue searching siblings
}