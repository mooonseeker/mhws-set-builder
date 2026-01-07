/**
 * @fileoverview Entry point for the MHWS Set Builder's search algorithm.
 * This file orchestrates the entire process of finding optimal equipment sets
 * by preprocessing data, generating scaffolds, and filling them to meet skill requirements.
 */

import { cloneDeep } from "lodash-es";

import type {
  Accessory,
  Armor,
  ArmorType,
  Charm,
  EquipmentSet,
  FinalSet,
  Skill,
  SkillWithLevel,
  Slot,
  SlottedEquipment,
  Weapon,
} from "@/types";
import type { SearchContext, SkillDeficit } from "@/types/set-builder";

import { solveAccessories } from "./accessory-solver";
import { fillArmorScaffold } from "./armor-search";
import { preprocess } from "./preprocess";
import { generateArmorScaffolds } from "./scaffold-generator";
import { categorizeTargetSkills } from "./utils";

const SEARCH_LIMIT = 20; // Stop search if more than this many results are found

/**
 * Represents all the raw game data needed for the search.
 */
interface AllGameData {
  armors: Armor[];
  weapons: Weapon[];
  accessories: Accessory[];
  skills: Skill[];
  charms: Charm[];
}

/**
 * Main orchestration function to find optimal equipment sets.
 *
 * This strategy anchors the search on a fixed weapon and iterates through charms.
 * It integrates weapon-skill solving early to allow for aggressive pruning, leading
 * to a more efficient search process.
 *
 * @param requiredSkills An array of skills the user requires.
 * @param fixedEquipment The specific equipment set to build around.
 * @param allData All game data including armors, weapons, accessories, skills, and charms.
 * @returns A promise that resolves to an array of final, sorted sets.
 */
export const findOptimalSets = (
  requiredSkills: SkillWithLevel[],
  fixedEquipment: EquipmentSet,
  allData: AllGameData,
): Promise<FinalSet[]> => {
  console.log("[+] Starting MHWS Set Builder search...");
  const startTime = performance.now();

  // 1. Preprocess all raw data into efficient maps.
  console.log("[+] Step 1: Preprocessing data...");
  const preprocessedData = preprocess(
    allData.armors,
    allData.weapons,
    allData.charms,
    allData.accessories,
    allData.skills,
  );
  console.log(
    `[+] Step 1: Preprocessing complete (${(
      performance.now() - startTime
    ).toFixed(2)}ms).`,
  );

  // 2. Categorize target skills for hierarchical processing.
  console.log("[+] Step 2: Categorizing target skills...");
  const categorizedSkills = categorizeTargetSkills(
    requiredSkills,
    preprocessedData.skillDetails,
  );
  console.log("[+] Step 2: Skill categorization complete.");

  // This is not used, but kept for reference or future use.
  const armorTypes: ArmorType[] = ["helm", "body", "arm", "waist", "leg"];
  const armorsByType = new Map<ArmorType, Armor[]>();
  armorTypes.forEach((type) => {
    armorsByType.set(
      type,
      allData.armors.filter((a: Armor) => a.type === type),
    );
  });

  const finalResults: FinalSet[] = [];
  let limitReached = false;

  if (!allData.charms || allData.charms.length === 0) {
    console.warn(
      "No charms available for search. The search will proceed without charms.",
    );
  }

  // 3. Main Search Loop: Iterate through charms or handle fixed charm.
  const charmsToIterate = fixedEquipment.charm
    ? [fixedEquipment.charm.equipment]
    : allData.charms;
  const totalCharms = charmsToIterate.length;

  for (const [index, charm] of charmsToIterate.entries()) {
    const charmStartTime = performance.now();
    console.log(
      `[+] Step 3: Main loop - Processing charm ${index + 1}/${totalCharms} (ID: ${
        charm.id
      })`,
    );

    // 3a. Create initial SearchContext for this charm.
    const context: SearchContext = {
      equipment: cloneDeep(fixedEquipment),
      currentSkills: new Map<string, number>(),
      availableSlots: { weapon: [], armor: [] },
      skillDeficits: cloneDeep(categorizedSkills),
    };

    // Add charm to the context if not already fixed.
    context.equipment.charm ??= {
      equipment: charm,
      accessories: Array.from({ length: charm.slots.length }, () => null),
    };

    // Accumulate skills and slots from all fixed equipment.
    (Object.keys(context.equipment) as (keyof EquipmentSet)[]).forEach(
      (key) => {
        const slottedEq = context.equipment[key];
        if (!slottedEq) return;
        const eq = slottedEq.equipment;
        eq.skills.forEach((skill: SkillWithLevel) => {
          context.currentSkills.set(
            skill.skillId,
            (context.currentSkills.get(skill.skillId) ?? 0) + skill.level,
          );
        });
        eq.slots.forEach((slot: Slot) => {
          const slotWithSource = { ...slot, sourceId: eq.id };
          if (slot.type === "weapon") {
            context.availableSlots.weapon.push(slotWithSource);
          } else {
            context.availableSlots.armor.push(slotWithSource);
          }
        });
      },
    );

    // 3b. Solve for weapon-specific skills first.
    const weaponSkillDeficits: SkillDeficit[] =
      context.skillDeficits.weaponSkills
        .map((targetSkill) => ({
          skillId: targetSkill.skillId,
          missingLevel:
            targetSkill.level -
            (context.currentSkills.get(targetSkill.skillId) ?? 0),
        }))
        .filter((deficit) => deficit.missingLevel > 0);

    if (weaponSkillDeficits.length > 0) {
      const weaponSkillSolutions = solveAccessories(
        weaponSkillDeficits,
        context.availableSlots,
        preprocessedData.accessoriesBySkill,
        preprocessedData.skillDetails,
      );

      // If weapon skills cannot be satisfied, this charm is not viable. Prune.
      if (weaponSkillSolutions.length === 0) {
        console.log(
          `  -> Pruned: Failed to solve weapon skills for this charm.`,
        );
        continue;
      }

      console.log(
        `  -> Found ${weaponSkillSolutions.length} weapon skill solution(s).`,
      );

      // 3c. Create a separate search branch for each weapon skill solution.
      for (const solution of weaponSkillSolutions) {
        // Create a dedicated context for this branch.
        const branchContext = cloneDeep(context);

        // Update context with the solution's results.
        branchContext.availableSlots = solution.remainingSlots;
        branchContext.skillDeficits.weaponSkills = []; // Weapon skills are now satisfied.

        // Place the found accessories into the equipment in the context.
        for (const [
          sourceId,
          foundAccessories,
        ] of solution.placement.entries()) {
          const equipmentToUpdate = (
            Object.values(branchContext.equipment) as SlottedEquipment<
              Weapon | Armor | Charm
            >[]
          ).find((eq) => eq?.equipment.id === sourceId);

          if (equipmentToUpdate) {
            const newAccessories: (Accessory | null)[] = Array.from(
              { length: equipmentToUpdate.equipment.slots.length },
              () => null,
            );
            const originalSlots = equipmentToUpdate.equipment.slots;
            const accessoriesToPlace = [...foundAccessories].sort(
              (a, b) => b.slotLevel - a.slotLevel,
            );

            for (const accessory of accessoriesToPlace) {
              let placed = false;
              for (let i = 0; i < originalSlots.length; i++) {
                if (
                  newAccessories[i] === null &&
                  originalSlots[i].level >= accessory.slotLevel
                ) {
                  newAccessories[i] = accessory;
                  placed = true;
                  break;
                }
              }
              if (!placed) {
                console.error(
                  "CRITICAL: Could not place accessory",
                  accessory,
                  "on",
                  equipmentToUpdate.equipment.id,
                );
              }
            }
            equipmentToUpdate.accessories = newAccessories;

            // Update total skill counts.
            foundAccessories.forEach((acc) => {
              acc.skills.forEach((skill) => {
                const current =
                  branchContext.currentSkills.get(skill.skillId) ?? 0;
                branchContext.currentSkills.set(
                  skill.skillId,
                  current + skill.level,
                );
              });
            });
          }
        }

        // 3d. Generate armor scaffolds.
        console.log(
          `  -> Generating armor scaffolds for charm ${charm.id} with weapon skill solution...`,
        );
        const scaffolds = generateArmorScaffolds(
          branchContext,
          preprocessedData,
        );

        if (scaffolds.length === 0) {
          console.log(
            `  -> Pruned: No viable armor scaffolds found for this charm to satisfy series/group skills.`,
          );
          continue; // Prune this branch.
        }
        console.log(`  -> Found ${scaffolds.length} possible scaffold(s).`);

        // 3e. Iterate through scaffolds and run the armor filler.
        for (const scaffold of scaffolds) {
          const scaffoldContext = cloneDeep(branchContext);

          // Merge scaffold into the new context.
          for (const armorType of Object.keys(scaffold) as ArmorType[]) {
            const armorPiece = scaffold[armorType];
            if (armorPiece) {
              scaffoldContext.equipment[armorType] = armorPiece;
              // Accumulate skills.
              armorPiece.equipment.skills.forEach((skill) => {
                const current =
                  scaffoldContext.currentSkills.get(skill.skillId) ?? 0;
                scaffoldContext.currentSkills.set(
                  skill.skillId,
                  current + skill.level,
                );
              });
              // Collect slots with source IDs.
              const slotsWithSource = armorPiece.equipment.slots.map((s) => ({
                ...s,
                sourceId: armorPiece.equipment.id,
              }));
              scaffoldContext.availableSlots.armor.push(...slotsWithSource);
            }
          }

          // Call the armor filler with the scaffolded context.
          const shouldContinue = fillArmorScaffold(
            scaffoldContext,
            allData.armors,
            preprocessedData,
            finalResults,
            SEARCH_LIMIT,
          );

          if (!shouldContinue) {
            limitReached = true;
            break; // Exit scaffold loop.
          }
        }
      }
    } else {
      // If there are no weapon skill deficits, proceed directly to scaffold generation.
      console.log(
        `  -> No weapon skill deficits, proceeding directly to armor scaffolds...`,
      );

      const scaffolds = generateArmorScaffolds(context, preprocessedData);

      if (scaffolds.length === 0) {
        console.log(
          `  -> Pruned: No viable armor scaffolds found for this charm to satisfy series/group skills.`,
        );
        continue; // Prune this charm.
      }
      console.log(`  -> Found ${scaffolds.length} possible scaffold(s).`);

      for (const scaffold of scaffolds) {
        const scaffoldContext = cloneDeep(context);

        // Merge scaffold into the new context.
        for (const armorType of Object.keys(scaffold) as ArmorType[]) {
          const armorPiece = scaffold[armorType];
          if (armorPiece) {
            scaffoldContext.equipment[armorType] = armorPiece;
            // Accumulate skills.
            armorPiece.equipment.skills.forEach((skill) => {
              const current =
                scaffoldContext.currentSkills.get(skill.skillId) ?? 0;
              scaffoldContext.currentSkills.set(
                skill.skillId,
                current + skill.level,
              );
            });
            // Collect slots with source IDs.
            const slotsWithSource = armorPiece.equipment.slots.map((s) => ({
              ...s,
              sourceId: armorPiece.equipment.id,
            }));
            scaffoldContext.availableSlots.armor.push(...slotsWithSource);
          }
        }

        // Call the armor filler with the scaffolded context.
        const shouldContinue = fillArmorScaffold(
          scaffoldContext,
          allData.armors,
          preprocessedData,
          finalResults,
          SEARCH_LIMIT,
        );

        if (!shouldContinue) {
          limitReached = true;
          break; // Exit scaffold loop.
        }
      }
    }

    console.log(
      `  -> Charm ${charm.id} processing finished in ${(
        performance.now() - charmStartTime
      ).toFixed(2)}ms.`,
    );

    if (limitReached) {
      console.log(
        `[!] Search limit of ${SEARCH_LIMIT} reached. Aborting search.`,
      );
      break; // Exit charm loop.
    }
  }

  // 4. Finalize and return results.
  if (limitReached) {
    console.warn(
      `[!] The search was stopped because the number of combinations found reached the limit of ${SEARCH_LIMIT}. The results may be incomplete. Please add more specific skill requirements to narrow down the search.`,
    );
  }
  console.log(
    `[+] Step 4: Found a total of ${finalResults.length} raw sets. Results ready for frontend evaluation.`,
  );

  const endTime = performance.now();
  console.log(
    `[+] Full search completed in ${(endTime - startTime).toFixed(2)}ms.`,
  );
  console.log(
    "[Debug] Final sets to be returned to UI:",
    JSON.stringify(finalResults.slice(0, SEARCH_LIMIT), null, 2),
  );
  return Promise.resolve(finalResults.slice(0, SEARCH_LIMIT));
};
