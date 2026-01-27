/**
 * @fileoverview Universal dominance check logic for equipment (Armor, Charms, Weapons).
 * Used to determine if one piece of equipment is strictly better than another.
 */

import type { SkillWithLevel, Slot } from "@/types";

/**
 * Result of a comparison between two attributes.
 */
export type ComparisonResult =
  | "superior" // A is strictly better than B
  | "inferior" // A is strictly worse than B
  | "equal" // A is identical to B
  | "incomparable"; // Neither is strictly better

/**
 * Compares two lists of slots to determine dominance.
 * Slots are sorted descending by level before comparison.
 *
 * A dominates B if:
 * 1. A has at least as many slots as B.
 * 2. For every slot index i in B, A[i].level >= B[i].level.
 *
 * @param slotsA The slots of the first equipment.
 * @param slotsB The slots of the second equipment.
 * @returns 'superior' if A > B, 'inferior' if A < B, 'equal' if A == B, 'incomparable' otherwise.
 */
export function compareSlots(slotsA: Slot[], slotsB: Slot[]): ComparisonResult {
  // 1. Extract levels and sort descending (e.g., [3, 2, 1])
  const levelsA = slotsA.map((s) => s.level).sort((a, b) => b - a);
  const levelsB = slotsB.map((s) => s.level).sort((a, b) => b - a);

  let aDominatesB = true;
  let bDominatesA = true;

  // If A has fewer slots than B, A cannot dominate B (A cannot cover B's slot requirements).
  if (levelsA.length < levelsB.length) {
    aDominatesB = false;
  }
  // If B has fewer slots than A, B cannot dominate A.
  if (levelsB.length < levelsA.length) {
    bDominatesA = false;
  }

  const len = Math.min(levelsA.length, levelsB.length);

  for (let i = 0; i < len; i++) {
    const valA = levelsA[i];
    const valB = levelsB[i];

    if (valA < valB) {
      aDominatesB = false;
    }
    if (valB < valA) {
      bDominatesA = false;
    }
  }

  if (aDominatesB && bDominatesA) return "equal";
  if (aDominatesB) return "superior";
  if (bDominatesA) return "inferior";
  return "incomparable";
}

/**
 * Compares two lists of skills to determine dominance.
 *
 * A dominates B if:
 * 1. A contains all skills present in B.
 * 2. For every skill in B, A's level >= B's level.
 *
 * @param skillsA The skills of the first equipment.
 * @param skillsB The skills of the second equipment.
 * @returns 'superior' if A > B, 'inferior' if A < B, 'equal' if A == B, 'incomparable' otherwise.
 */
export function compareSkillSets(
  skillsA: SkillWithLevel[],
  skillsB: SkillWithLevel[],
): ComparisonResult {
  const mapA = new Map<string, number>();
  skillsA.forEach((s) => mapA.set(s.skillId, s.level));

  const mapB = new Map<string, number>();
  skillsB.forEach((s) => mapB.set(s.skillId, s.level));

  const allSkillIds = new Set([...mapA.keys(), ...mapB.keys()]);

  let aDominatesB = true;
  let bDominatesA = true;

  for (const skillId of allSkillIds) {
    const valA = mapA.get(skillId) ?? 0;
    const valB = mapB.get(skillId) ?? 0;

    if (valA < valB) {
      aDominatesB = false;
    }
    if (valB < valA) {
      bDominatesA = false;
    }
  }

  if (aDominatesB && bDominatesA) return "equal";
  if (aDominatesB) return "superior";
  if (bDominatesA) return "inferior";
  return "incomparable";
}

/**
 * Defines the generic shape of equipment used for dominance checks.
 */
export interface IDominanceCandidate {
  id: string;
  skills: SkillWithLevel[];
  slots: Slot[];
  defense?: number; // Optional, used as tie-breaker
}

/**
 * Checks if candidate A dominates candidate B.
 * A dominates B if A is better or equal in all aspects (Slots, Skills)
 * AND strictly better in at least one aspect (including Defense as tie-breaker).
 *
 * Logic:
 * 1. Compare Slots. If A is inferior or incomparable -> False.
 * 2. Compare Skills. If A is inferior or incomparable -> False.
 * 3. If both are Equal:
 *    - Check Defense: If A > B -> True.
 *    - If Defense Equal: Use ID as deterministic tie-breaker (A < B -> True).
 * 4. If A is Superior in at least one (Slots or Skills) and at least Equal in the other -> True.
 *
 * @param a The potential dominator.
 * @param b The potential dominated.
 * @returns True if A dominates B.
 */
export function isStrictlyBetter(
  a: IDominanceCandidate,
  b: IDominanceCandidate,
): boolean {
  const slotRes = compareSlots(a.slots, b.slots);
  if (slotRes === "inferior" || slotRes === "incomparable") return false;

  const skillRes = compareSkillSets(a.skills, b.skills);
  if (skillRes === "inferior" || skillRes === "incomparable") return false;

  // At this point:
  // slotRes is "superior" or "equal"
  // skillRes is "superior" or "equal"

  const isSlotBetter = slotRes === "superior";
  const isSkillBetter = skillRes === "superior";

  if (isSlotBetter || isSkillBetter) {
    return true;
  }

  // Both are "equal" in terms of Skills and Slots.
  // Check Defense.
  const defA = a.defense ?? 0;
  const defB = b.defense ?? 0;

  if (defA > defB) return true;
  if (defA < defB) return false;

  // Fully identical stats. Use ID to arbitrarily pick one (stable sort).
  // We want to keep ONE. So we say A dominates B if A.id < B.id.
  // This ensures that for a set of identical items, the one with the "smallest" ID eliminates the others.
  return a.id < b.id;
}
