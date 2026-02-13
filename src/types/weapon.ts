/**
 * @fileoverview Type definitions for weapons, including their types and attributes.
 */

import { type Slot } from "./accessory";
import { type Sharpness, type SkillWithLevel, type Takumi } from "./base";

/**
 * The type of weapon.
 */
export const WEAPON_TYPES = [
  "long-sword",
  "short-sword",
  "twin-sword",
  "tachi",
  "hammer",
  "whistle",
  "lance",
  "gun-lance",
  "slash-axe",
  "charge-axe",
  "rod",
  "bow",
  "heavy-bowgun",
  "light-bowgun",
] as const;
/** Type representing a weapon type. */
export type WeaponType = (typeof WEAPON_TYPES)[number];

/**
 * The type of element or status effect.
 */
export const ATTRIBUTE_TYPES = [
  "fire",
  "water",
  "ice",
  "elec",
  "dragon",
  "poison",
  "sleep",
  "blast",
  "paralyse",
] as const;
/** Type representing a weapon attribute type. */
export type AttributeType = (typeof ATTRIBUTE_TYPES)[number];

/**
 * Base definition for a weapon.
 *
 * This definition is applicable to most melee weapons. Other weapon types
 * may have unique properties, which are omitted in this version.
 */
export interface Weapon {
  /** Unique identifier for the weapon. */
  id: string;
  /** Display name of the weapon. */
  name: string;
  /** The type of the weapon. */
  type: WeaponType;
  /** In-game description of the weapon. */
  description: string;
  /** A number used for sorting the weapon in lists. */
  sortId: number;
  /** The skills provided by this weapon. */
  skills: SkillWithLevel[];
  /** The slots on this weapon. */
  slots: Slot[];
  /** The rarity of the weapon (1-12). */
  rarity: number;
  /** The attack power of the weapon. */
  attack: number;
  /** The critical hit chance (affinity) of the weapon. */
  critical: number;
  /** The defense bonus provided by the weapon. */
  defense: number;
  /** The primary attribute. */
  attribute?: AttributeType;
  /** The value of the primary attribute. */
  attributeValue?: number;
  /** The secondary attribute (for future expansion). */
  subattribute?: AttributeType;
  /** The value of the secondary attribute. */
  subattributeValue?: number;
  /** The weapon's sharpness distribution (for melee weapons). */
  sharpness?: Sharpness;
  /** The weapon's sharpness with the Takumi skill. */
  takumi?: Takumi;
}
