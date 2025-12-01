/**
 * @fileoverview Entry point for the set-search algorithm service.
 * This file orchestrates the entire process of finding optimal equipment sets.
 */

import type { Accessory, Armor, ArmorType, Charm, EquipmentSet, FinalSet, Skill, SkillWithLevel, Slot, Weapon } from '@/types';
import type { SearchContext, SkillDeficit } from '@/types/set-builder';
import { cloneDeep } from 'lodash-es';

import { solveAccessories } from './accessory-solver';
import { fillArmorScaffold } from './armor-search';
import { preprocess } from './preprocess';
import { generateArmorScaffolds } from './scaffold-generator';
import { categorizeTargetSkills } from './utils';

const SEARCH_LIMIT = 20; // Stop search if more than this many results are found

// Define allData based on imported types
interface AllGameData {
    armors: Armor[];
    weapons: Weapon[];
    accessories: Accessory[];
    skills: Skill[];
    charms: Charm[];
}

/**
 * Main orchestration function to find optimal equipment sets based on v7.1 plan.
 *
 * This new strategy anchors the search on a fixed weapon and iterates through charms.
 * It integrates weapon-skill solving early to allow for aggressive pruning, leading
 * to a more efficient search process.
 *
 * @param requiredSkills - An array of skills the user requires.
 * @param fixedEquipment - The specific equipment set to build around.
 * @param allData - All game data including armors, weapons, accessories, skills, and charms.
 * @returns A promise that resolves to an array of final, sorted sets.
 */
export const findOptimalSets = async (
    requiredSkills: SkillWithLevel[],
    fixedEquipment: EquipmentSet,
    allData: AllGameData,
): Promise<FinalSet[]> => {
    console.log('[+] Starting findOptimalSets v7.1...');
    const startTime = performance.now();

    // 1. 数据预处理
    console.log('[+] Step 1: Preprocessing data...');
    const preprocessedData = preprocess(
        allData.armors,
        allData.weapons,
        allData.charms as Charm[],
        allData.accessories,
        allData.skills
    );
    console.log(`[+] Step 1: Preprocessing complete (${(performance.now() - startTime).toFixed(2)}ms).`);

    // 2. 分类目标技能
    console.log('[+] Step 2: Categorizing target skills...');
    const categorizedSkills = categorizeTargetSkills(requiredSkills, preprocessedData.skillDetails);
    console.log('[+] Step 2: Skill categorization complete.');

    // 准备按类型分组的防具，供后续的回溯搜索使用
    const armorTypes: ArmorType[] = ['helm', 'body', 'arm', 'waist', 'leg'];
    const armorsByType = new Map<ArmorType, Armor[]>();
    armorTypes.forEach(type => {
        armorsByType.set(type, allData.armors.filter((a: Armor) => a.type === type));
    });

    const finalResults: FinalSet[] = [];
    let limitReached = false;

    // 如果没有护石数据，可以继续搜索（仅使用武器）
    if (!allData.charms || allData.charms.length === 0) {
        console.warn("No charms available for search. The search will proceed without charms.");
        // 如果需要，可以在这里添加一个只使用武器的逻辑分支
    }

    // 3. 主搜索循环: 根据情况遍历护石或直接处理
    const charmsToIterate = fixedEquipment.charm ? [fixedEquipment.charm.equipment as Charm] : allData.charms;
    const totalCharms = charmsToIterate.length;

    for (const [index, charm] of charmsToIterate.entries()) {
        const charmStartTime = performance.now();
        console.log(`[+] Step 3: Main loop - Processing charm ${index + 1}/${totalCharms} (ID: ${charm.id})`);

        // 3a. 创建初始 SearchContext
        const context: SearchContext = {
            equipment: cloneDeep(fixedEquipment),
            currentSkills: new Map<string, number>(),
            availableSlots: { weapon: [], armor: [] },
            skillDeficits: cloneDeep(categorizedSkills),
        };

        // 如果 charm 不在 fixedEquipment 中，则添加到 context
        if (!context.equipment.charm) {
            context.equipment.charm = { equipment: charm, accessories: Array(charm.slots.length).fill(null) };
        }

        // 累加所有固定装备的技能和孔位
        Object.values(context.equipment).forEach(slottedEq => {
            if (!slottedEq) return;
            const eq = slottedEq.equipment;
            eq.skills.forEach((skill: SkillWithLevel) => {
                context.currentSkills.set(skill.skillId, (context.currentSkills.get(skill.skillId) || 0) + skill.level);
            });
            eq.slots.forEach((slot: Slot) => {
                const slotWithSource = { ...slot, sourceId: eq.id };
                if (slot.type === 'weapon') {
                    context.availableSlots.weapon.push(slotWithSource);
                } else {
                    context.availableSlots.armor.push(slotWithSource);
                }
            });
        });

        // 3b. 求解 Weapon-Skills
        const weaponSkillDeficits: SkillDeficit[] = context.skillDeficits.weaponSkills
            .map(targetSkill => ({
                skillId: targetSkill.skillId,
                missingLevel: targetSkill.level - (context.currentSkills.get(targetSkill.skillId) || 0),
            }))
            .filter(deficit => deficit.missingLevel > 0);

        if (weaponSkillDeficits.length > 0) {
            const weaponSkillSolutions = solveAccessories(
                weaponSkillDeficits,
                context.availableSlots,
                preprocessedData.accessoriesBySkill,
                preprocessedData.skillDetails
            );

            // 如果填充失败，则此 (武器+护石) 组合无法满足武器技能需求，直接剪枝
            if (weaponSkillSolutions.length === 0) {
                console.log(`  -> Pruned: Failed to solve weapon skills for this charm.`);
                continue;
            }

            console.log(`  -> Found ${weaponSkillSolutions.length} weapon skill solution(s).`);

            // 3c. 为每个武器技能解决方案创建独立的搜索分支
            for (const solution of weaponSkillSolutions) {
                // a. 为此解决方案创建独立的搜索上下文
                const branchContext = cloneDeep(context);

                // b. 更新分支上下文
                branchContext.availableSlots = solution.remainingSlots;
                branchContext.skillDeficits.weaponSkills = []; // 武器技能缺口被满足

                // c. 将找到的珠子填充回 branchContext.equipment 中
                for (const [sourceId, foundAccessories] of solution.placement.entries()) {
                    const equipmentToUpdate = Object.values(branchContext.equipment).find(
                        (eq) => eq && eq.equipment.id === sourceId
                    );

                    if (equipmentToUpdate) {
                        const newAccessories: (Accessory | null)[] = Array(equipmentToUpdate.equipment.slots.length).fill(null);
                        const originalSlots = equipmentToUpdate.equipment.slots;
                        // 优先放置需要高级孔位的珠子
                        const accessoriesToPlace = [...foundAccessories].sort((a, b) => b.slotLevel - a.slotLevel);

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
                                console.error("CRITICAL: Could not place accessory", accessory, "on", equipmentToUpdate.equipment.id);
                            }
                        }
                        equipmentToUpdate.accessories = newAccessories;

                        // 更新技能总数
                        foundAccessories.forEach(acc => {
                            acc.skills.forEach(skill => {
                                const current = branchContext.currentSkills.get(skill.skillId) || 0;
                                branchContext.currentSkills.set(skill.skillId, current + skill.level);
                            });
                        });
                    }
                }

                // 3d. [v7.2] 生成防具骨架 (Scaffolds)
                console.log(`  -> Generating armor scaffolds for charm ${charm.id} with weapon skill solution...`);
                const scaffolds = generateArmorScaffolds(branchContext, preprocessedData);

                if (scaffolds.length === 0) {
                    console.log(`  -> Pruned: No viable armor scaffolds found for this charm to satisfy series/group skills.`);
                    continue; // 此 weapon/charm 组合无法满足 series/group 技能，剪枝
                }
                console.log(`  -> Found ${scaffolds.length} possible scaffold(s).`);

                // 3e. [v7.2] 遍历骨架，为每个骨架创建独立上下文并进行填充搜索
                for (const scaffold of scaffolds) {
                    // a. 为此骨架创建独立的搜索上下文
                    const scaffoldContext = cloneDeep(branchContext);

                    // b. 将骨架信息合并到新上下文中
                    for (const armorType of Object.keys(scaffold) as ArmorType[]) {
                        const armorPiece = scaffold[armorType];
                        if (armorPiece) {
                            scaffoldContext.equipment[armorType] = armorPiece;
                            // b1. 累加技能
                            armorPiece.equipment.skills.forEach(skill => {
                                const current = scaffoldContext.currentSkills.get(skill.skillId) || 0;
                                scaffoldContext.currentSkills.set(skill.skillId, current + skill.level);
                            });
                            // b2. 收集孔位，并确保它们携带来源ID
                            const slotsWithSource = armorPiece.equipment.slots.map(s => ({ ...s, sourceId: armorPiece.equipment.id, }));
                            scaffoldContext.availableSlots.armor.push(...slotsWithSource);
                        }
                    }

                    // c. 调用改造后的骨架填充函数
                    const shouldContinue = fillArmorScaffold(
                        scaffoldContext, // 传入包含骨架信息的新 context
                        allData.armors,
                        preprocessedData,
                        finalResults,
                        SEARCH_LIMIT,
                    );

                    if (!shouldContinue) {
                        limitReached = true;
                        break; // Exit the scaffold loop
                    }
                }
            }
        } else {
            // 如果没有武器技能缺口，直接进入防具骨架生成阶段
            console.log(`  -> No weapon skill deficits, proceeding directly to armor scaffolds...`);

            // 3d. [v7.2] 生成防具骨架 (Scaffolds)
            const scaffolds = generateArmorScaffolds(context, preprocessedData);

            if (scaffolds.length === 0) {
                console.log(`  -> Pruned: No viable armor scaffolds found for this charm to satisfy series/group skills.`);
                continue; // 此 weapon/charm 组合无法满足 series/group 技能，剪枝
            }
            console.log(`  -> Found ${scaffolds.length} possible scaffold(s).`);

            // 3e. [v7.2] 遍历骨架，为每个骨架创建独立上下文并进行填充搜索
            for (const scaffold of scaffolds) {
                // a. 为此骨架创建独立的搜索上下文
                const scaffoldContext = cloneDeep(context);

                // b. 将骨架信息合并到新上下文中
                for (const armorType of Object.keys(scaffold) as ArmorType[]) {
                    const armorPiece = scaffold[armorType];
                    if (armorPiece) {
                        scaffoldContext.equipment[armorType] = armorPiece;
                        // b1. 累加技能
                        armorPiece.equipment.skills.forEach(skill => {
                            const current = scaffoldContext.currentSkills.get(skill.skillId) || 0;
                            scaffoldContext.currentSkills.set(skill.skillId, current + skill.level);
                        });
                        // b2. 收集孔位，并确保它们携带来源ID
                        const slotsWithSource = armorPiece.equipment.slots.map(s => ({ ...s, sourceId: armorPiece.equipment.id, }));
                        scaffoldContext.availableSlots.armor.push(...slotsWithSource);
                    }
                }

                // c. 调用改造后的骨架填充函数
                const shouldContinue = fillArmorScaffold(
                    scaffoldContext, // 传入包含骨架信息的新 context
                    allData.armors,
                    preprocessedData,
                    finalResults,
                    SEARCH_LIMIT,
                );

                if (!shouldContinue) {
                    limitReached = true;
                    break; // Exit the scaffold loop
                }
            }
        }

        console.log(`  -> Charm ${charm.id} processing finished in ${(performance.now() - charmStartTime).toFixed(2)}ms.`);

        if (limitReached) {
            console.log(`[!] Search limit of ${SEARCH_LIMIT} reached. Aborting search.`);
            break; // Exit the charm loop
        }
    }

    // 4. 排序并返回最终结果
    if (limitReached) {
        console.warn(
            `[!] The search was stopped because the number of combinations found reached the limit of ${SEARCH_LIMIT}. The results may be incomplete. Please add more specific skill requirements to narrow down the search.`
        );
    }
    console.log(`[+] Step 4: Found a total of ${finalResults.length} raw sets. Results ready for frontend evaluation.`);

    const endTime = performance.now();
    console.log(`[+] Full search completed in ${(endTime - startTime).toFixed(2)}ms.`);
    console.log('[Debug] Final sets to be returned to UI:', JSON.stringify(finalResults.slice(0, SEARCH_LIMIT), null, 2));
    return finalResults.slice(0, SEARCH_LIMIT);
};
