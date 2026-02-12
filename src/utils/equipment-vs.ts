/**
 * @fileoverview New equipment comparison logic based on skill gap alignment.
 * Implements the "Integrated Comparison Plan" from EquipmentVS.md.
 */

import type { Equipment, Skill, Slot, SlotType } from "@/types";

/**
 * Result of the equipment comparison.
 */
export type EquipmentComparisonResult =
  | "superior" // A is strictly better than B
  | "inferior" // A is strictly worse than B
  | "equal" // A is identical in value
  | "incomparable"; // Neither is strictly better

/**
 * Checks if equipment A is superior to equipment B.
 */
export function isSuperior(
  a: Equipment,
  b: Equipment,
  skillsData: Skill[] | Map<string, Skill>,
): boolean {
  return compareEquipment(a, b, skillsData) === "superior";
}

/**
 * Compares two pieces of equipment using the skill alignment logic.
 *
 * @param a Equipment A
 * @param b Equipment B
 * @param skillsData Complete skill data (Array or Map) for meta-data lookups.
 */
export function compareEquipment(
  a: Equipment,
  b: Equipment,
  skillsData: Skill[] | Map<string, Skill>,
): EquipmentComparisonResult {
  // 1. Type & Part check
  if (!isSameComparisonType(a, b)) return "incomparable";

  // 2. Initial value check (Symmetrical Comparison)
  const forward = checkSuperiority(a, b, skillsData);
  const backward = checkSuperiority(b, a, skillsData);

  if (forward && backward) return "equal";
  if (forward) return "superior";
  if (backward) return "inferior";
  return "incomparable";
}

/**
 * Internal core logic: Checks if 'source' is potentially superior to 'target'.
 * This follows the "Integrated Comparison Plan" from EquipmentVS.md.
 */
function checkSuperiority(
  source: Equipment,
  target: Equipment,
  skillsData: Skill[] | Map<string, Skill>,
): boolean {
  const skillMapSource = new Map<string, number>();
  source.skills.forEach((s) => skillMapSource.set(s.skillId, s.level));

  const gaps: {
    skillId: string;
    level: number;
    slotType: SlotType;
    slotLevel: number;
  }[] = [];

  // A. Hard Skill Check & Gap Calculation
  for (const tSkill of target.skills) {
    const sLevel = skillMapSource.get(tSkill.skillId) ?? 0;
    if (sLevel < tSkill.level) {
      // Source is lacking. Can it bridge the gap with slots?
      const info = getSkillInfo(tSkill.skillId, skillsData);

      if (!info || info.accessoryLevel === -1) {
        // Hard skill gap: Source can never be superior if it has less of a non-decoratable skill.
        return false;
      }

      gaps.push({
        skillId: tSkill.skillId,
        level: tSkill.level - sLevel,
        slotType: info.category === "weapon" ? "weapon" : "armor",
        slotLevel: info.accessoryLevel as number,
      });
    }
  }

  // B. Simulate Slot Deduction
  const remainingSlots = simulateDeduction([...source.slots], gaps);
  if (!remainingSlots) return false;

  // C. Final Value Comparison
  // Source is potentially superior if its aligned skills are >= target's skills
  // AND its remaining slots are >= target's slots.
  const slotComp = compareSlots(remainingSlots, target.slots);
  if (slotComp === "inferior" || slotComp === "incomparable") return false;

  // At this point, Source is at least equal to target in Skills and Slots.
  // We need to check for a strict advantage.
  const isSlotStrictlyBetter = slotComp === "superior";
  const hasExtraSkills = source.skills.some((s) => {
    const targetLevel =
      target.skills.find((ts) => ts.skillId === s.skillId)?.level ?? 0;
    return s.level > targetLevel;
  });
  const statComp = compareStats(source, target);
  const isStatStrictlyBetter = statComp === "superior";

  if (isSlotStrictlyBetter || hasExtraSkills || isStatStrictlyBetter) {
    return true;
  }

  // Tie-breaker: Same stats, use ID for stability (Source is better if ID is smaller)
  if (statComp === "equal" && source.id < target.id) {
    return true;
  }

  // If everything is equal, we return true so that 'checkSuperiority'
  // returns true for both (forward and backward), resulting in "equal".
  const isSkillEqual =
    compareSkillSets(source.skills, target.skills) === "equal";
  const isSlotEqual = slotComp === "equal";
  return isSkillEqual && isSlotEqual && statComp === "equal";
}

/**
 * Internal: Get skill metadata with O(1) if Map is provided.
 */
function getSkillInfo(
  id: string,
  skillsData: Skill[] | Map<string, Skill>,
): Skill | undefined {
  if (skillsData instanceof Map) {
    return skillsData.get(id);
  }
  return skillsData.find((s) => s.id === id);
}

/**
 * Internal: Compares two slot lists (P1/P2/P3/P4 logic).
 */
function compareSlots(
  slotsA: Slot[],
  slotsB: Slot[],
): "superior" | "inferior" | "equal" | "incomparable" {
  const levelsA = slotsA.map((s) => s.level).sort((a, b) => b - a);
  const levelsB = slotsB.map((s) => s.level).sort((a, b) => b - a);

  let aDominatesB = levelsA.length >= levelsB.length;
  let bDominatesA = levelsB.length >= levelsA.length;

  const len = Math.min(levelsA.length, levelsB.length);
  for (let i = 0; i < len; i++) {
    if (levelsA[i] < levelsB[i]) aDominatesB = false;
    if (levelsB[i] < levelsA[i]) bDominatesA = false;
  }

  if (aDominatesB && bDominatesA) return "equal";
  if (aDominatesB) return "superior";
  if (bDominatesA) return "inferior";
  return "incomparable";
}

/**
 * Internal: Compares two skill sets (S1/S2/S3/S4 logic).
 */
function compareSkillSets(
  skillsA: { skillId: string; level: number }[],
  skillsB: { skillId: string; level: number }[],
): "superior" | "inferior" | "equal" | "incomparable" {
  const mapA = new Map(skillsA.map((s) => [s.skillId, s.level]));
  const mapB = new Map(skillsB.map((s) => [s.skillId, s.level]));
  const allIds = new Set([...mapA.keys(), ...mapB.keys()]);

  let aDominatesB = true;
  let bDominatesA = true;

  for (const id of allIds) {
    const valA = mapA.get(id) ?? 0;
    const valB = mapB.get(id) ?? 0;
    if (valA < valB) aDominatesB = false;
    if (valB < valA) bDominatesA = false;
  }

  if (aDominatesB && bDominatesA) return "equal";
  if (aDominatesB) return "superior";
  if (bDominatesA) return "inferior";
  return "incomparable";
}

/**
 * Internal: Greedy slot deduction.
 */
function simulateDeduction(
  slots: Slot[],
  gaps: { level: number; slotType: SlotType; slotLevel: number }[],
): Slot[] | null {
  const currentSlots = [...slots].sort((a, b) => a.level - b.level);
  for (const gap of gaps) {
    for (let i = 0; i < gap.level; i++) {
      const idx = currentSlots.findIndex(
        (s) => s.type === gap.slotType && s.level >= gap.slotLevel,
      );
      if (idx === -1) return null;
      currentSlots.splice(idx, 1);
    }
  }
  return currentSlots;
}

/**
 * Internal: Compare basic stats.
 */
function compareStats(
  a: Equipment,
  b: Equipment,
): "superior" | "inferior" | "equal" {
  if ("defense" in a && "defense" in b) {
    const da = a.defense;
    const db = b.defense;
    return da > db ? "superior" : da < db ? "inferior" : "equal";
  }
  if ("attack" in a && "attack" in b) {
    if (a.attack !== b.attack)
      return a.attack > b.attack ? "superior" : "inferior";
    if (a.critical !== b.critical)
      return a.critical > b.critical ? "superior" : "inferior";
    return "equal";
  }
  return "equal";
}

/**
 * Internal: Same type check.
 */
function isSameComparisonType(a: Equipment, b: Equipment): boolean {
  if ("type" in a && "type" in b) return a.type === b.type;
  if (!("type" in a) && !("type" in b)) return true;
  return false;
}
