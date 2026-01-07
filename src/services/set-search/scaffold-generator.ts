/**
 * @fileoverview Generates armor "scaffolds" based on high-priority skill requirements.
 * This module is a crucial pre-step to the main armor search. It identifies all possible
 * partial armor combinations (scaffolds) that satisfy the highly-constrained "Series" and "Group"
 * skills. The main search then uses these scaffolds as starting points.
 */

import { cloneDeep } from "lodash-es";

import type {
  Armor,
  ArmorType,
  EquipmentSet,
  PreprocessedData,
  SearchContext,
  SkillWithLevel,
} from "@/types";

const ARMOR_TYPES: ArmorType[] = ["helm", "body", "arm", "waist", "leg"];

/**
 * Finds all combinations of armor pieces that provide a specific Series skill,
 * respecting already occupied armor slots.
 * @param requiredLevel The target level of the series skill (e.g., 5 for a 5-piece set bonus).
 * @param armorProvidersByPart A map of armor pieces that provide the skill, grouped by armor type.
 * @param occupiedTypes A set of armor types that are already part of the scaffold.
 * @returns An array of possible partial `EquipmentSet`s (scaffolds).
 */
function findSeriesSkillCombosWithConstraints(
  requiredLevel: number,
  armorProvidersByPart: Map<ArmorType, Armor[]>,
  occupiedTypes: Set<ArmorType>,
): EquipmentSet[] {
  const solutions: EquipmentSet[] = [];
  const availableTypes = [...armorProvidersByPart.keys()].filter(
    (type) =>
      (armorProvidersByPart.get(type)?.length ?? 0) > 0 &&
      !occupiedTypes.has(type),
  );

  // Pruning: If the number of available armor types is less than the required level, it's impossible to satisfy.
  if (availableTypes.length < requiredLevel) {
    return [];
  }

  // Recursive function to generate all possible "part combinations".
  const findPartCombos = (startIndex: number, currentCombo: ArmorType[]) => {
    if (currentCombo.length === requiredLevel) {
      // Once a valid combination of parts is found, generate all possible equipment sets for it.
      generateEquipmentSetsForPartCombo(
        currentCombo,
        solutions,
        armorProvidersByPart,
      );
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
 * Helper function to generate all possible equipment combinations for a given "part combination".
 */
function generateEquipmentSetsForPartCombo(
  partCombo: ArmorType[],
  solutions: EquipmentSet[],
  armorProvidersByPart: Map<ArmorType, Armor[]>,
) {
  let currentSolutions: EquipmentSet[] = [{}];

  for (const type of partCombo) {
    const nextSolutions: EquipmentSet[] = [];
    const armorsForType = armorProvidersByPart.get(type) ?? [];

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
 * Finds armor combinations that satisfy a set of Group skills, given constraints on occupied slots.
 *
 * @param skillsToProcess The list of Group skills to be satisfied.
 * @param preprocessedData Pre-processed data to get skill providers.
 * @param occupiedTypes A set of armor types already occupied by a Series scaffold.
 * @returns An array of supplementary scaffolds that satisfy the requirements.
 */
function findGroupSkillCombos(
  skillsToProcess: SkillWithLevel[],
  preprocessedData: PreprocessedData,
  occupiedTypes: Set<ArmorType>,
): EquipmentSet[] {
  const solutions: EquipmentSet[] = [];
  const availableTypes = ARMOR_TYPES.filter((type) => !occupiedTypes.has(type));

  // 1. Build a pool of candidate armors.
  const requiredSkillIds = new Set(skillsToProcess.map((s) => s.skillId));
  const candidateArmors = new Map<ArmorType, Armor[]>();
  availableTypes.forEach((type) => candidateArmors.set(type, []));

  // Find all providers for the required group skills.
  for (const skillId of requiredSkillIds) {
    const providers =
      preprocessedData.skillProviderMap.get(skillId)?.armors ?? [];
    for (const armor of providers) {
      if (candidateArmors.has(armor.type)) {
        // Avoid adding duplicates.
        const existing = candidateArmors.get(armor.type)!;
        if (!existing.find((a) => a.id === armor.id)) {
          existing.push(armor);
        }
      }
    }
  }

  // 2. Define and start the backtracking search.
  const backtrack = (
    typeIndex: number,
    currentScaffold: EquipmentSet,
    currentSkills: Map<string, number>,
  ) => {
    // Base Case: All available types have been processed.
    if (typeIndex >= availableTypes.length) {
      // Check if the current combination satisfies all group skill requirements.
      const isSuccess = skillsToProcess.every(
        (target) => (currentSkills.get(target.skillId) ?? 0) >= target.level,
      );

      if (isSuccess) {
        solutions.push(cloneDeep(currentScaffold));
      }
      return;
    }

    const currentType = availableTypes[typeIndex];
    const armorsForType = candidateArmors.get(currentType) ?? [];

    // Choice 1: Don't select an armor piece for this type.
    backtrack(typeIndex + 1, currentScaffold, currentSkills);

    // Choice 2: Select an armor piece for this type.
    for (const armor of armorsForType) {
      // a. Update state
      currentScaffold[currentType] = { equipment: armor, accessories: [] };
      armor.skills.forEach((skill) => {
        const currentLevel = currentSkills.get(skill.skillId) ?? 0;
        currentSkills.set(skill.skillId, currentLevel + skill.level);
      });

      // b. Recurse
      backtrack(typeIndex + 1, currentScaffold, currentSkills);

      // c. Backtrack
      delete currentScaffold[currentType];
      armor.skills.forEach((skill) => {
        const currentLevel = currentSkills.get(skill.skillId) ?? 0;
        currentSkills.set(skill.skillId, currentLevel - skill.level);
      });
    }
  };

  backtrack(0, {}, new Map());
  return solutions;
}

/**
 * A recursive solver to handle requirements for multiple, combined Series skills.
 */
function resolveCombinedSeriesScaffolds(
  seriesSkills: SkillWithLevel[],
  preprocessedData: PreprocessedData,
  occupiedTypes: Set<ArmorType>,
): EquipmentSet[] {
  const finalScaffolds: EquipmentSet[] = [];

  // Sort by difficulty: skills with fewer providers are harder to satisfy and are processed first.
  const sortedSeriesSkills = [...seriesSkills].sort((a, b) => {
    const providersA =
      preprocessedData.skillProviderMap.get(a.skillId)?.armors.length ?? 0;
    const providersB =
      preprocessedData.skillProviderMap.get(b.skillId)?.armors.length ?? 0;
    return providersA - providersB;
  });

  const findCombosRecursive = (
    skillIndex: number,
    currentScaffold: EquipmentSet,
    currentOccupiedTypes: Set<ArmorType>,
  ) => {
    // Base Case: All series skills have been successfully processed.
    if (skillIndex >= sortedSeriesSkills.length) {
      finalScaffolds.push(cloneDeep(currentScaffold));
      return;
    }

    const currentSkill = sortedSeriesSkills[skillIndex];
    const armorProviders =
      preprocessedData.skillProviderMap.get(currentSkill.skillId)?.armors ?? [];

    // Group armor providers for the current skill by type.
    const providersByPart = new Map<ArmorType, Armor[]>();
    ARMOR_TYPES.forEach((type) => providersByPart.set(type, []));
    armorProviders.forEach((armor) => {
      providersByPart.get(armor.type)?.push(armor);
    });

    // Find "incremental scaffolds" for the current skill, respecting occupied slots.
    const incrementalScaffolds = findSeriesSkillCombosWithConstraints(
      currentSkill.level,
      providersByPart,
      currentOccupiedTypes,
    );

    // Iterate through the found incremental scaffolds and recurse.
    for (const increment of incrementalScaffolds) {
      // a. Merge scaffolds.
      const nextScaffold = { ...currentScaffold, ...increment };
      // b. Update the set of occupied types.
      const nextOccupiedTypes = new Set(currentOccupiedTypes);
      Object.keys(increment).forEach((type) =>
        nextOccupiedTypes.add(type as ArmorType),
      );

      // c. Recurse for the next skill.
      findCombosRecursive(skillIndex + 1, nextScaffold, nextOccupiedTypes);
    }
  };

  findCombosRecursive(0, {}, occupiedTypes);
  return finalScaffolds;
}

/**
 * Generates armor scaffolds based on Series and Group skill requirements.
 * This uses a layered approach, prioritizing the highly-constrained Series skills first,
 * then handling Group skills. It supports single and combined Series skill requirements.
 */
export function generateArmorScaffolds(
  context: SearchContext,
  preprocessedData: PreprocessedData,
): EquipmentSet[] {
  const { seriesSkills, groupSkills } = context.skillDeficits;
  const finalScaffolds: EquipmentSet[] = [];

  // Extract any armor types that are already fixed in the context.
  const occupiedTypesFromContext = new Set<ArmorType>();
  ARMOR_TYPES.forEach((type) => {
    if (context.equipment[type]) {
      occupiedTypesFromContext.add(type);
    }
  });

  // Case 1: There are Series skill requirements.
  if (seriesSkills.length > 0) {
    // 1a. Generate all base scaffolds that satisfy the Series skills.
    const baseScaffolds = resolveCombinedSeriesScaffolds(
      seriesSkills,
      preprocessedData,
      occupiedTypesFromContext,
    );

    // 1b. For each base scaffold, validate and supplement with Group skills.
    for (const baseScaffold of baseScaffolds) {
      const occupiedTypes = new Set(Object.keys(baseScaffold) as ArmorType[]);
      occupiedTypesFromContext.forEach((type) => occupiedTypes.add(type));

      // Calculate the Group skill levels already provided by the base scaffold.
      const currentGroupLevels = new Map<string, number>();
      const requiredGroupSkillIds = new Set(groupSkills.map((s) => s.skillId));
      const equipmentToScan = { ...context.equipment, ...baseScaffold };

      Object.values(equipmentToScan).forEach((item) => {
        if (!item) return;
        const { equipment } = item;

        if (
          equipment &&
          "type" in equipment &&
          ARMOR_TYPES.includes(equipment.type as ArmorType)
        ) {
          equipment.skills.forEach((skill: SkillWithLevel) => {
            if (requiredGroupSkillIds.has(skill.skillId)) {
              const existing = currentGroupLevels.get(skill.skillId) ?? 0;
              currentGroupLevels.set(skill.skillId, existing + skill.level);
            }
          });
        }
      });

      // Filter for Group skills that are still not met.
      const remainingGroupDeficits = groupSkills
        .map((target) => ({
          skillId: target.skillId,
          level: target.level - (currentGroupLevels.get(target.skillId) ?? 0),
        }))
        .filter((skill) => skill.level > 0);

      // If all Group skills are met, the base scaffold is complete.
      if (remainingGroupDeficits.length === 0) {
        finalScaffolds.push(baseScaffold);
        continue;
      }

      // If the scaffold is full but Group skills are missing, this scaffold is invalid.
      if (occupiedTypes.size === ARMOR_TYPES.length) {
        continue;
      }

      // Try to fill the remaining Group skills in the empty slots.
      const groupFillers = findGroupSkillCombos(
        remainingGroupDeficits,
        preprocessedData,
        occupiedTypes,
      );
      for (const filler of groupFillers) {
        // Combine the base scaffold with the supplementary filler.
        const combinedScaffold = { ...baseScaffold, ...filler };
        finalScaffolds.push(combinedScaffold);
      }
    }
  }
  // Case 2: Only Group skill requirements exist.
  else if (groupSkills.length > 0) {
    return findGroupSkillCombos(
      groupSkills,
      preprocessedData,
      occupiedTypesFromContext,
    );
  }
  // Case 3: No Series or Group skill requirements.
  else {
    return [{}]; // Return an empty scaffold, indicating no specific armor is required.
  }

  return finalScaffolds;
}
