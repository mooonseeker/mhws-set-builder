/**
 * @fileoverview Charm validation utilities for MHWS Set Builder.
 *
 * Provides functions to validate and compare charms to decide if a new
 * charm is worth keeping.
 */

import {
  type Charm,
  type CharmValidationResult,
  type CharmValidationStatus,
  type Skill,
} from "@/types";

import { isSuperior } from "./equipment-vs";

/**
 * Validates if a new charm should be added to the collection using a deep comparison check.
 *
 * @param newCharm The new charm (core entity).
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

  return {
    isValid: true,
    status,
    outclassedCharms:
      outclassedCharms.length > 0 ? outclassedCharms : undefined,
  };
}
