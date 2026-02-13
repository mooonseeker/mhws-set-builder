/**
 * @fileoverview Type definitions for charms, including validation and sorting.
 */

import { type Slot } from "./accessory";
import { type SkillWithLevel } from "./base";

/**
 * Defines a charm.
 */
export interface Charm {
  /** Unique identifier for the charm. */
  id: string;
  /** Custom name for the charm. */
  name: string;
  /** Rarity of the charm (1-12). */
  rarity: number;
  /** The skills provided by this charm (1-3 skills). */
  skills: SkillWithLevel[];
  /** The slots on this charm (0-3 slots). */
  slots: Slot[];
  /** The timestamp when the charm was created (ISO 8601 format). */
  createdAt: string;
}

/**
 * An enhanced charm type that includes calculated properties.
 */
export interface CharmEnhanced extends Charm {
  /** The calculated equivalent slots based on its skills and slots. */
  equivalentSlots: EquivalentSlots;
  /** The calculated value based on its key skills and equivalent slots. */
  keySkillValue: number;
}

/** The minimum number of skills a charm can have. */
export const CHARM_SKILLS_MIN = 1;

/** The maximum number of skills a charm can have. */
export const CHARM_SKILLS_MAX = 3;

/** The minimum number of slots a charm can have. */
export const CHARM_SLOTS_MIN = 0;

/** The maximum number of slots a charm can have. */
export const CHARM_SLOTS_MAX = 3;

/**
 * A summary of equivalent slots, converted from a charm's skills and
 * actual slots.
 */
export interface EquivalentSlots {
  /** Number of equivalent level 1 weapon slots. */
  weaponSlot1: number;
  /** Number of equivalent level 2 weapon slots. */
  weaponSlot2: number;
  /** Number of equivalent level 3 weapon slots. */
  weaponSlot3: number;
  /** Number of equivalent level 1 armor slots. */
  armorSlot1: number;
  /** Number of equivalent level 2 armor slots. */
  armorSlot2: number;
  /** Number of equivalent level 3 armor slots. */
  armorSlot3: number;
}

/**
 * The status of a charm after validation.
 *
 * - `ACCEPTED_AS_SUPERIOR`: Accepted because it is strictly better than some existing charms.
 * - `ACCEPTED`: Accepted after passing the comparison check.
 * - `REJECTED_AS_INFERIOR`: Rejected because a strictly better charm exists.
 */
export type CharmValidationStatus =
  | "ACCEPTED_AS_SUPERIOR"
  | "ACCEPTED"
  | "REJECTED_AS_INFERIOR";

/**
 * The result of a charm validation check.
 */
export interface CharmValidationResult {
  /** Whether the charm is considered valid (i.e., not inferior). */
  isValid: boolean;
  /** The validation status. */
  status: CharmValidationStatus;
  /** Optional list of warning messages. */
  warnings?: string[];
  /** The charm that is strictly better, if status is `REJECTED_AS_INFERIOR`. */
  betterCharm?: Charm;
  /** Charms that are outclassed by the new one. */
  outclassedCharms?: Charm[];
}

/**
 * Fields available for sorting charms.
 */
export type CharmSortField =
  | "keySkillValue"
  | "rarity"
  | "createdAt"
  | "weaponSlot1"
  | "weaponSlot2"
  | "weaponSlot3"
  | "armorSlot1"
  | "armorSlot2"
  | "armorSlot3";
