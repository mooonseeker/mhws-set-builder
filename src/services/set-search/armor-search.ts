/**
 * @fileoverview Fills armor scaffolds to find complete equipment sets.
 * This service is the main backtracking engine for the armor search. It takes a
 * pre-generated scaffold (or an empty one) and recursively tries to fill the
 * remaining empty armor slots to satisfy all remaining skill requirements.
 */

import { cloneDeep } from "lodash-es";

import type {
  Accessory,
  Armor,
  ArmorType,
  EquipmentSet,
  FinalSet,
  PreprocessedData,
  SearchContext,
  SkillDeficit,
  SkillWithLevel,
  Slot,
} from "@/types";

import { solveAccessories } from "./accessory-solver";
import { shouldPrune, validateBaseSkills } from "./helpers";

const ARMOR_TYPES: ArmorType[] = ["helm", "body", "arm", "waist", "leg"];

/**
 * Main function to fill an armor scaffold using backtracking.
 *
 * @param context The search context, including the initial armor scaffold.
 * @param allArmors A list of all available armors to fill empty slots.
 * @param preprocessedData Pre-processed game data for efficient lookups.
 * @param finalResults An array to store the discovered valid sets.
 * @param limit The maximum number of results to find before stopping.
 * @returns `false` to signal that the search should be aborted (e.g., limit reached).
 */
export function fillArmorScaffold(
  context: SearchContext,
  allArmors: Armor[],
  preprocessedData: PreprocessedData,
  finalResults: FinalSet[],
  limit: number,
): boolean {
  // Group all armors by type for quick lookup during backtracking.
  const armorsByType = new Map<ArmorType, Armor[]>();
  ARMOR_TYPES.forEach((type) => {
    armorsByType.set(
      type,
      allArmors.filter((a) => a.type === type),
    );
  });

  const shouldContinue = backtrack(
    0,
    context,
    finalResults,
    armorsByType,
    preprocessedData,
    limit,
  );

  return shouldContinue;
}

/**
 * Recursive backtracking function to fill empty armor slots.
 *
 * @param armorTypeIndex The index of the current armor type being processed (0-4: helm -> leg).
 * @param context The current search state.
 * @param finalResults The global array to store valid solutions.
 * @param armorsByType A pool of available armors, grouped by type.
 * @param preprocessedData Pre-processed game data.
 * @param limit The maximum number of solutions to find.
 * @returns `false` if the search limit is reached and all searches should stop.
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
  // MARK: Pruning Check
  if (
    shouldPrune(
      context.currentSkills,
      remainingArmorTypes,
      context.skillDeficits,
      preprocessedData,
      context.availableSlots,
    )
  ) {
    return true; // Prune this branch, but continue searching siblings.
  }

  // MARK: Termination Condition
  // When all 5 armor pieces have been selected.
  if (armorTypeIndex === 5) {
    // First, validate that base skills (Series/Group) are satisfied before solving for accessories.
    if (!validateBaseSkills(context.equipment, context.skillDeficits)) {
      return true; // This combination is invalid, prune the branch.
    }

    // Calculate the final deficit for skills that can be filled by accessories.
    const armorSkillDeficits: SkillDeficit[] = context.skillDeficits.armorSkills
      .map((s: SkillWithLevel) => ({
        skillId: s.skillId,
        missingLevel: s.level - (context.currentSkills.get(s.skillId) ?? 0),
      }))
      .filter((d) => d.missingLevel > 0);

    // If there are no deficits, a valid set has been found.
    if (armorSkillDeficits.length === 0) {
      const finalSet: FinalSet = {
        equipment: cloneDeep(context.equipment),
        accessories: new Map(), // No accessories are needed.
        remainingSlots: [
          ...context.availableSlots.armor,
          ...context.availableSlots.weapon,
        ],
      };
      finalResults.push(finalSet);
      if (finalResults.length >= limit) {
        return false; // Stop searching.
      }
      return true; // Continue searching.
    }

    // If there are deficits, call the accessory solver.
    const allArmorSlots: Slot[] = [];
    for (const armorType of ARMOR_TYPES) {
      const armorItem = context.equipment[armorType];
      if (armorItem) {
        const armorPiece = armorItem.equipment;
        armorPiece.slots.forEach((slot) => {
          allArmorSlots.push({ ...slot, sourceId: armorPiece.id });
        });
      }
    }

    const accessorySolutions = solveAccessories(
      armorSkillDeficits,
      { weapon: [], armor: allArmorSlots }, // Use only armor slots.
      preprocessedData.accessoriesBySkill,
      preprocessedData.skillDetails,
    );

    // If the solver finds solutions, create final set configurations.
    if (accessorySolutions.length > 0) {
      for (const solution of accessorySolutions) {
        // Create a deep copy of the equipment for this specific solution.
        const solutionEquipment = cloneDeep(context.equipment);

        // Place the found accessories into the equipment slots.
        solution.placement.forEach((placedAccessories, equipmentId) => {
          const armorType = ARMOR_TYPES.find(
            (type) => solutionEquipment[type]?.equipment.id === equipmentId,
          );

          if (armorType) {
            const equipmentSlot = solutionEquipment[armorType]!;
            const totalSlots = equipmentSlot.equipment.slots.length;
            const newAccessories: (Accessory | null)[] = Array.from(
              { length: totalSlots },
              () => null,
            );
            const originalSlots = equipmentSlot.equipment.slots;
            // Prioritize placing accessories that require higher-level slots first.
            const accessoriesToPlace = [...placedAccessories].sort(
              (a, b) => b.slotLevel - a.slotLevel,
            );

            for (const accessory of accessoriesToPlace) {
              let placed = false;
              // Find the first available slot that can fit the accessory.
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
                  equipmentSlot.equipment.id,
                );
              }
            }
            equipmentSlot.accessories = newAccessories;
          }
        });

        // Create the final set object.
        const finalAccessories = new Map<string, Accessory[]>();
        (Object.keys(solutionEquipment) as (keyof EquipmentSet)[]).forEach(
          (key) => {
            const slottedEq = solutionEquipment[key];
            if (slottedEq?.accessories) {
              const accessories = slottedEq.accessories.filter(
                (a: Accessory | null): a is Accessory => a !== null,
              );
              if (accessories.length > 0) {
                finalAccessories.set(slottedEq.equipment.id, accessories);
              }
            }
          },
        );

        const finalSet: FinalSet = {
          equipment: solutionEquipment,
          accessories: finalAccessories,
          remainingSlots: [
            ...solution.remainingSlots.armor,
            ...context.availableSlots.weapon,
          ],
        };
        finalResults.push(finalSet);
        if (finalResults.length >= limit) {
          return false; // Stop searching.
        }
      }
    } else {
      // If solver fails, this combination is invalid.
    }
    return true; // Continue searching this branch's siblings.
  }

  // MARK: Recursion
  const currentArmorType = ARMOR_TYPES[armorTypeIndex];

  // If an armor piece is already fixed for this type, skip to the next type.
  if (context.equipment[currentArmorType]) {
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
    // If the slot is empty, iterate through all available armors for this type.
    const availableArmors = armorsByType.get(currentArmorType) ?? [];
    for (const armorPiece of availableArmors) {
      // 1. Mutate state forward
      const slotsWithSource = armorPiece.slots.map((s) => ({
        ...s,
        sourceId: armorPiece.id,
      }));
      context.equipment[currentArmorType] = {
        equipment: armorPiece,
        accessories: [],
      };
      const oldSkillLevels = new Map<string, number | undefined>();
      armorPiece.skills.forEach((skill) => {
        const oldLevel = context.currentSkills.get(skill.skillId);
        oldSkillLevels.set(skill.skillId, oldLevel);
        context.currentSkills.set(skill.skillId, (oldLevel ?? 0) + skill.level);
      });
      const slotsAddedCount = armorPiece.slots.length;
      context.availableSlots.armor.push(...slotsWithSource);

      // 2. Recurse
      const shouldContinue = backtrack(
        armorTypeIndex + 1,
        context,
        finalResults,
        armorsByType,
        preprocessedData,
        limit,
      );

      // 3. Revert state
      context.availableSlots.armor.splice(
        context.availableSlots.armor.length - slotsAddedCount,
        slotsAddedCount,
      );
      armorPiece.skills.forEach((skill) => {
        const oldLevel = oldSkillLevels.get(skill.skillId);
        if (oldLevel === undefined) {
          context.currentSkills.delete(skill.skillId);
        } else {
          context.currentSkills.set(skill.skillId, oldLevel);
        }
      });
      delete context.equipment[currentArmorType];

      // 4. Propagate stop signal
      if (!shouldContinue) return false;
    }
  }
  return true; // Continue searching siblings.
}
