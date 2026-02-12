/**
 * @fileoverview Charm validation utilities for MHWS Set Builder.
 *
 * Provides functions to validate and compare charms to decide if a new
 * charm is worth keeping.
 */

import {
  KEY_SKILL_VALUE_THRESHOLD,
  type Charm,
  type CharmValidationResult,
  type CharmValidationStatus,
  type Skill,
} from "@/types";

import { isSuperior } from "./equipment-vs";

/**
 * Validates if a new charm should be added to the collection using a deep comparison check.
 *
 * @param newCharm The new charm (fully structured).
 * @param existingCharms The list of existing charms.
 * @param skillsData Complete skill data for lookups.
 * @returns A detailed validation result.
 */
export function validateCharm(
  newCharm: Charm,
  existingCharms: Charm[],
  skillsData: Skill[],
): CharmValidationResult {
  // 1. Inferiority Check: Is this new charm outclassed by any existing charm?
  for (const existingCharm of existingCharms) {
    if (isSuperior(existingCharm, newCharm, skillsData)) {
      return {
        isValid: false,
        status: "REJECTED_AS_INFERIOR",
        betterCharm: existingCharm,
      };
    }
  }

  // 2. Superiority Check: Does this new charm outclass any existing charms?
  const outclassedCharms = existingCharms.filter((existingCharm) =>
    isSuperior(newCharm, existingCharm, skillsData),
  );

  // 3. Determine Acceptance Status
  let status: CharmValidationStatus = "ACCEPTED";
  if (outclassedCharms.length > 0) {
    status = "ACCEPTED_AS_SUPERIOR";
  }

  // 4. Warning Generation: Statistical check for low value
  const warnings: string[] = [];
  if (existingCharms.length > 0) {
    const totalValue = existingCharms.reduce(
      (sum, c) => sum + c.keySkillValue,
      0,
    );
    const avgValue = totalValue / existingCharms.length;

    if (newCharm.keySkillValue < avgValue - KEY_SKILL_VALUE_THRESHOLD) {
      warnings.push(
        `核心技能价值 (${newCharm.keySkillValue.toFixed(1)}) 显著低于库内平均水平 (${avgValue.toFixed(1)})。`,
      );
    }
  }

  return {
    isValid: true,

    status,

    warnings: warnings.length > 0 ? warnings : undefined,

    outclassedCharms:
      outclassedCharms.length > 0 ? outclassedCharms : undefined,
  };
}
