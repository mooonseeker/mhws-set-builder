/**
 * @fileoverview Generates armor "scaffolds" based on high-priority skill requirements.
 * This module is a crucial pre-step to the main armor search. It identifies all possible
 * partial armor combinations (scaffolds) that satisfy the highly-constrained "Series" and "Group"
 * skills. The main search then uses these scaffolds as starting points.
 */

import { cloneDeep } from "lodash-es";

import {
  ARMOR_TYPES,
  type Armor,
  type ArmorType,
  type Equipment,
  type EquipmentSet,
  type PreprocessedData,
  type SearchContext,
  type SkillWithLevel,
  type SlottedEquipment,
} from "@/types";

/**
 * Finds all combinations of armor pieces that provide a specific Series skill,
 * respecting already occupied armor slots.
 * @param requiredLevel The target level of the series skill (e.g., 5 for a 5-piece set bonus).
 * @param skillId The ID of the series skill.
 * @param armorProvidersByPart A map of armor pieces that provide the skill, grouped by armor type.
 * @param occupiedTypes A set of armor types that are already part of the scaffold.
 * @returns An array of possible partial `EquipmentSet`s (scaffolds).
 */
function findSeriesSkillCombosWithConstraints(
  requiredLevel: number,
  skillId: string,
  armorProvidersByPart: Map<ArmorType, Armor[]>,
  occupiedTypes: Set<ArmorType>,
): EquipmentSet[] {
  const solutions: EquipmentSet[] = [];
  const availableTypes = [...armorProvidersByPart.keys()].filter(
    (type) =>
      (armorProvidersByPart.get(type)?.length ?? 0) > 0 &&
      !occupiedTypes.has(type),
  );

  // Recursive function to generate all possible "part combinations" that sum up to requiredLevel.
  const findPartCombos = (
    startIndex: number,
    currentCombo: ArmorType[],
    currentLevelSum: number,
  ) => {
    // Base Case: Requirement met.
    if (currentLevelSum >= requiredLevel) {
      // Generate all possible equipment sets for this specific combination of parts.
      generateEquipmentSetsForPartCombo(
        currentCombo,
        solutions,
        armorProvidersByPart,
      );
      return;
    }

    if (startIndex >= availableTypes.length) return;

    for (let i = startIndex; i < availableTypes.length; i++) {
      const type = availableTypes[i];
      const armors = armorProvidersByPart.get(type) ?? [];
      // Optimization: Assume all armors of the same type provide the same level of this series skill.
      // In MHWS, this is virtually always true for series skills on the same armor set pieces.
      const skillLevel =
        armors[0].skills.find((s) => s.skillId === skillId)?.level ?? 0;

      if (skillLevel > 0) {
        currentCombo.push(type);
        findPartCombos(i + 1, currentCombo, currentLevelSum + skillLevel);
        currentCombo.pop();
      }
    }
  };

  findPartCombos(0, [], 0);
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
        const newSolution = { ...solution };
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
    // Pruning: Check if it's still possible to satisfy all skills with remaining types.
    for (const target of skillsToProcess) {
      const currentLevel = currentSkills.get(target.skillId) ?? 0;
      if (currentLevel >= target.level) continue;

      let maxRemainingPotential = 0;
      for (let i = typeIndex; i < availableTypes.length; i++) {
        const type = availableTypes[i];
        const potentialOnType =
          preprocessedData.maxPotentialPerArmorType.get(type);
        if (potentialOnType) {
          maxRemainingPotential += potentialOnType.get(target.skillId) ?? 0;
        }
      }

      if (currentLevel + maxRemainingPotential < target.level) {
        return; // Prune this branch.
      }
    }

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
  initialSkills: Map<string, number>,
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

    // Calculate how many levels of the current series skill are already provided.
    // 1. Levels from fixed equipment (weapon, charm, etc.) provided via initialSkills.
    let levelsProvided = initialSkills.get(currentSkill.skillId) ?? 0;

    // 2. Levels from armor pieces already added to the scaffold.
    (
      Object.values(currentScaffold) as (
        | SlottedEquipment<Equipment>
        | undefined
      )[]
    ).forEach((item) => {
      if (item) {
        const skillOnPiece = item.equipment.skills.find(
          (s) => s.skillId === currentSkill.skillId,
        );
        if (skillOnPiece) {
          levelsProvided += skillOnPiece.level;
        }
      }
    });

    const neededLevel = Math.max(0, currentSkill.level - levelsProvided);

    // If the requirement is already met, move to the next skill.
    if (neededLevel === 0) {
      findCombosRecursive(
        skillIndex + 1,
        currentScaffold,
        currentOccupiedTypes,
      );
      return;
    }

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
      neededLevel,
      currentSkill.skillId,
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
    // Pass context.currentSkills to account for weapon/charm contributions.
    const baseScaffolds = resolveCombinedSeriesScaffolds(
      seriesSkills,
      preprocessedData,
      occupiedTypesFromContext,
      context.currentSkills,
    );

    // 1b. For each base scaffold, validate and supplement with Group skills.
    for (const baseScaffold of baseScaffolds) {
      const occupiedTypes = new Set(Object.keys(baseScaffold) as ArmorType[]);
      occupiedTypesFromContext.forEach((type) => occupiedTypes.add(type));

      // Calculate the Group skill levels already provided by the base scaffold.
      const currentGroupLevels = new Map<string, number>();
      const requiredGroupSkillIds = new Set(groupSkills.map((s) => s.skillId));
      const equipmentToScan = { ...context.equipment, ...baseScaffold };

      (
        Object.values(equipmentToScan) as (
          | SlottedEquipment<Equipment>
          | undefined
        )[]
      ).forEach((item) => {
        if (!item) return;
        const { equipment } = item;

        // Count skills from all equipment (including fixed weapon/charm).
        equipment.skills.forEach((skill: SkillWithLevel) => {
          if (requiredGroupSkillIds.has(skill.skillId)) {
            const existing = currentGroupLevels.get(skill.skillId) ?? 0;
            currentGroupLevels.set(skill.skillId, existing + skill.level);
          }
        });
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
    // For group skills, we also need to account for initial levels.
    const remainingGroupDeficits = groupSkills
      .map((target) => ({
        skillId: target.skillId,
        level: target.level - (context.currentSkills.get(target.skillId) ?? 0),
      }))
      .filter((skill) => skill.level > 0);

    if (remainingGroupDeficits.length === 0) {
      return [{}]; // All met.
    }

    return findGroupSkillCombos(
      remainingGroupDeficits,
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
