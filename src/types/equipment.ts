/**
 * @fileoverview Type definitions for general equipment and rarity constants.
 */

import { type Armor } from "./armor";
import { type Charm } from "./charm";
import { type Weapon } from "./weapon";

/**
 * A union type for any piece of equipment.
 */
export type Equipment = Charm | Armor | Weapon;

/**
 * Defines rarity constants and ranges.
 */
export const RARITY_MIN = 1;
export const RARITY_MAX = 12;

/**
 * Rarity ranges for low, high, and master rank.
 */
export const RARITY_RANGES = {
  low: { min: 1, max: 4 },
  high: { min: 5, max: 8 },
  master: { min: 9, max: 12 },
  all: { min: 1, max: 12 },
} as const;
/** Type representing a rarity range key. */
export type RarityRangeKey = keyof typeof RARITY_RANGES;
