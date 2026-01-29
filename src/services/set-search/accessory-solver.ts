/**
 * @fileoverview Solves for optimal accessory (decoration) combinations.
 * This service is a core part of the search algorithm, used to find all
 * possible accessory sets that satisfy a given list of skill deficits.
 * It is called in two main places:
 * 1. Early in the main search loop to solve for weapon-specific skills.
 * 2. At the end of the armor search to fill remaining skills using armor/charm slots.
 */

import type {
  Accessory,
  AccessorySolution,
  Skill,
  SkillDeficit,
  Slot,
} from "@/types";

/**
 * A counter for abstracted slot levels.
 * This is used to anonymize slots to prevent duplicate combinations based on sourceId.
 */
interface SlotCounts {
  weapon: Map<number, number>; // Level -> Count
  armor: Map<number, number>; // Level -> Count
}

// --- Memoization Cache ---
const solutionCache = new Map<string, Accessory[][]>();

/**
 * Clears the accessory solution cache.
 * Should be called at the start of a new search operation.
 */
export function clearAccessoryCache() {
  solutionCache.clear();
}

/**
 * Generates a unique cache key based on deficits and available slot counts.
 */
function generateCacheKey(
  deficits: SkillDeficit[],
  slotCounts: SlotCounts,
): string {
  // Deficits are already sorted by sortDeficits, so order is consistent.
  const deficitsPart = deficits
    .map((d) => `${d.skillId}:${d.missingLevel}`)
    .join(",");

  const weaponSlots = `W:${slotCounts.weapon.get(1)}-${slotCounts.weapon.get(2)}-${slotCounts.weapon.get(3)}`;
  const armorSlots = `A:${slotCounts.armor.get(1)}-${slotCounts.armor.get(2)}-${slotCounts.armor.get(3)}`;

  return `${deficitsPart}|${weaponSlots}|${armorSlots}`;
}

/**
 * The main solver for accessory placements.
 * It uses a backtracking algorithm to find all viable decoration combinations.
 * Supports multiple accessories to fill a single skill deficit.
 *
 * @param deficits A list of skills and levels that need to be filled.
 * @param availableSlots The weapon and armor slots available for accessories.
 * @param accessoriesBySkill A map of accessories, grouped by the skills they provide.
 * @param skillDetails A map containing details for each skill.
 * @returns An array of all valid accessory solutions.
 */
export function solveAccessories(
  deficits: SkillDeficit[],
  availableSlots: { weapon: Slot[]; armor: Slot[] },
  accessoriesBySkill: Map<string, Accessory[]>,
  skillDetails: Map<string, Skill>,
): AccessorySolution[] {
  // 1. Abstract slots into counts by type and level.
  const slotCounts = abstractSlots(availableSlots);

  // 2. Sort skill deficits to prioritize more constrained skills first.
  const sortedDeficits = sortDeficits(
    deficits,
    accessoriesBySkill,
    skillDetails,
  );

  // 3. Check Cache
  const cacheKey = generateCacheKey(sortedDeficits, slotCounts);
  let accessoryLists: Accessory[][];

  if (solutionCache.has(cacheKey)) {
    accessoryLists = solutionCache.get(cacheKey)!;
  } else {
    // 4. Core backtracking search for accessory combinations.
    accessoryLists = findCombinations(
      sortedDeficits,
      slotCounts,
      accessoriesBySkill,
      skillDetails,
    );
    // Store in cache
    solutionCache.set(cacheKey, accessoryLists);
  }

  // 5. Map abstract combinations back to concrete slot placements.
  const solutions: AccessorySolution[] = [];
  for (const accessoryList of accessoryLists) {
    const solution = mapAccessoriesToSlots(accessoryList, availableSlots);
    if (solution) {
      solutions.push(solution);
    }
  }

  return solutions;
}

/**
 * Abstracts available slots into a count of slots by level for each type (weapon, armor).
 */
function abstractSlots(availableSlots: {
  weapon: Slot[];
  armor: Slot[];
}): SlotCounts {
  const slotCounts: SlotCounts = {
    weapon: new Map<number, number>(),
    armor: new Map<number, number>(),
  };

  // Initialize counts for all possible levels (1-3) to 0.
  for (let level = 1; level <= 3; level++) {
    slotCounts.weapon.set(level, 0);
    slotCounts.armor.set(level, 0);
  }

  // Count weapon slots.
  for (const slot of availableSlots.weapon) {
    const current = slotCounts.weapon.get(slot.level) ?? 0;
    slotCounts.weapon.set(slot.level, current + 1);
  }

  // Count armor slots.
  for (const slot of availableSlots.armor) {
    const current = slotCounts.armor.get(slot.level) ?? 0;
    slotCounts.armor.set(slot.level, current + 1);
  }

  return slotCounts;
}

/**
 * Sorts skill deficits using a fail-fast strategy.
 * The sort order is:
 * 1. Number of unique accessory types available (ascending) - Prioritizes skills with fewer options.
 * 2. Required accessory level (descending) - Prioritizes skills needing high-level slots.
 * 3. Missing skill level (descending) - Prioritizes larger deficits.
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

    // --- Sort Criterion 1: Number of unique combination ways ---
    // Approximated by the number of unique accessory types (by slot level and skill level provided).
    const aCandidates = accessoriesBySkill.get(a.skillId) ?? [];
    const bCandidates = accessoriesBySkill.get(b.skillId) ?? [];

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

    if (aUniqueTypes !== bUniqueTypes) {
      return aUniqueTypes - bUniqueTypes;
    }

    // --- Sort Criterion 2: Required accessory level (descending) ---
    if (skillA.accessoryLevel !== skillB.accessoryLevel) {
      return skillB.accessoryLevel - skillA.accessoryLevel;
    }

    // --- Sort Criterion 3: Missing level (descending) ---
    return b.missingLevel - a.missingLevel;
  });
}

/**
 * The core backtracking function to find all accessory combinations that satisfy the skill deficits.
 */
function findCombinations(
  deficits: SkillDeficit[],
  slotCounts: SlotCounts,
  accessoriesBySkill: Map<string, Accessory[]>,
  skillDetails: Map<string, Skill>,
): Accessory[][] {
  // Base case: If all deficits are met, return an empty combination.
  if (deficits.length === 0) {
    return [[]];
  }

  // Check Cache for this specific sub-problem
  const cacheKey = generateCacheKey(deficits, slotCounts);
  if (solutionCache.has(cacheKey)) {
    return solutionCache.get(cacheKey)!;
  }

  const [currentDeficit, ...remainingDeficits] = deficits;
  const allSolutions: Accessory[][] = [];

  // Find all possible ways to satisfy the current deficit.
  const ways = findWaysToSatisfyDeficit(
    currentDeficit,
    slotCounts,
    accessoriesBySkill,
    skillDetails,
  );

  for (const way of ways) {
    // Create a new copy of slot counts for this path.
    const newSlotCounts = {
      weapon: new Map(slotCounts.weapon),
      armor: new Map(slotCounts.armor),
    };

    const sortedWay = [...way].sort((a, b) => b.slotLevel - a.slotLevel);

    let isValid = true;
    for (const accessory of sortedWay) {
      const slotType = accessory.type;
      const reqLevel = accessory.slotLevel;
      let placed = false;

      // Try to find the smallest available slot that fits
      for (let level = reqLevel; level <= 3; level++) {
        const count = newSlotCounts[slotType].get(level) ?? 0;
        if (count > 0) {
          newSlotCounts[slotType].set(level, count - 1);
          placed = true;
          break;
        }
      }

      if (!placed) {
        isValid = false;
        break;
      }
    }

    if (!isValid) {
      // This should ideally not happen if checkSlotAvailability logic in findWays matches,
      // but it's good as a safety check.
      continue;
    }

    // Update remaining deficits based on skills provided by the current combination.
    // This handles cases where a single accessory satisfies multiple deficits.
    const providedSkills = new Map<string, number>();
    for (const acc of way) {
      for (const s of acc.skills) {
        providedSkills.set(
          s.skillId,
          (providedSkills.get(s.skillId) ?? 0) + s.level,
        );
      }
    }

    const nextDeficits: SkillDeficit[] = [];
    for (const deficit of remainingDeficits) {
      const providedLevel = providedSkills.get(deficit.skillId) ?? 0;
      if (providedLevel < deficit.missingLevel) {
        nextDeficits.push({
          skillId: deficit.skillId,
          missingLevel: deficit.missingLevel - providedLevel,
        });
      }
    }

    // Recurse to solve for the remaining deficits.
    const solutionsForRest = findCombinations(
      nextDeficits,
      newSlotCounts,
      accessoriesBySkill,
      skillDetails,
    );

    // Combine the current way with solutions for the rest.
    for (const restSolution of solutionsForRest) {
      allSolutions.push([...way, ...restSolution]);
    }
  }

  // Store in cache
  solutionCache.set(cacheKey, allSolutions);

  return allSolutions;
}

/**
 * Finds all combinations of accessories that can satisfy a single skill deficit.
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
  const candidates = accessoriesBySkill.get(deficit.skillId) ?? [];
  const typeFilteredCandidates = candidates.filter(
    (acc) => acc.type === slotType,
  );

  const ways: Accessory[][] = [];

  // Inner recursive function to find combinations for the deficit.
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
        accessory.skills.find((s) => s.skillId === deficit.skillId)?.level ?? 0;

      if (skillLevel > 0) {
        // Check if there are enough slots for the current combination.
        const hasEnoughSlots = checkSlotAvailability(
          [...currentCombination, accessory],
          slotType,
          slotCounts,
        );
        if (hasEnoughSlots) {
          findWaysRecursive(
            currentLevel + skillLevel,
            [...currentCombination, accessory],
            i, // Allow reusing the same accessory type.
          );
        }
      }
    }
  }

  findWaysRecursive(0, [], 0);
  return ways;
}

/**
 * Checks if the required slots for a given combination of accessories are available.
 * Validates against the flexible slot system (Lvl 1 fits in Lvl 2/3).
 */
function checkSlotAvailability(
  accessories: Accessory[],
  slotType: "weapon" | "armor",
  slotCounts: SlotCounts,
): boolean {
  // 1. Calculate Demand
  const demand = { 1: 0, 2: 0, 3: 0 };
  for (const acc of accessories) {
    // Only count standard slots.
    if (acc.slotLevel >= 1 && acc.slotLevel <= 3) {
      demand[acc.slotLevel as 1 | 2 | 3]++;
    }
  }

  // 2. Get Supply
  const supply = {
    1: slotCounts[slotType].get(1) ?? 0,
    2: slotCounts[slotType].get(2) ?? 0,
    3: slotCounts[slotType].get(3) ?? 0,
  };

  // 3. Verify Feasibility (Greedy from largest slot)
  const surplus3 = supply[3] - demand[3];
  if (surplus3 < 0) return false;

  const surplus2 = supply[2] + surplus3 - demand[2];
  if (surplus2 < 0) return false;

  const surplus1 = supply[1] + surplus2 - demand[1];
  if (surplus1 < 0) return false;

  return true;
}

/**
 * Maps an abstract list of accessories to concrete slot placements.
 * This function tries to fit accessories into the smallest possible available slots.
 * @returns An `AccessorySolution` if successful, or `null` if placement is not possible.
 */
function mapAccessoriesToSlots(
  accessoryList: Accessory[],
  originalSlots: { weapon: Slot[]; armor: Slot[] },
): AccessorySolution | null {
  // Create mutable copies of the original slots.
  const remainingWeaponSlots = [...originalSlots.weapon];
  const remainingArmorSlots = [...originalSlots.armor];
  const placement = new Map<string, Accessory[]>();

  // Sort slots by level (ascending) to use smaller slots first.
  remainingWeaponSlots.sort((a, b) => a.level - b.level);
  remainingArmorSlots.sort((a, b) => a.level - b.level);

  for (const accessory of accessoryList) {
    const slotType = accessory.type;
    const targetSlots =
      slotType === "weapon" ? remainingWeaponSlots : remainingArmorSlots;

    // Find the smallest available slot that can fit the accessory.
    const slotIndex = targetSlots.findIndex(
      (slot) => slot.level >= accessory.slotLevel,
    );

    if (slotIndex === -1) {
      // No suitable slot found, this combination is invalid.
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

    // Record the placement.
    if (!placement.has(slot.sourceId)) {
      placement.set(slot.sourceId, []);
    }
    placement.get(slot.sourceId)!.push(accessory);

    // Remove the used slot.
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
