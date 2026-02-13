/**
 * @fileoverview Type definitions for armor pieces and grouped armor series.
 */

import { type Slot } from "./accessory";
import { type Resistance, type SkillWithLevel } from "./base";

/** The type of armor piece (helm/body/arm/waist/leg). */
export const ARMOR_TYPES = ["helm", "body", "arm", "waist", "leg"] as const;
/** Type representing the type of armor piece (helm/body/arm/waist/leg). */
export type ArmorType = (typeof ARMOR_TYPES)[number];

/**
 * Defines a piece of armor.
 */
export interface Armor {
  /** Unique identifier for the armor piece. */
  id: string;
  /** Display name of the armor piece. */
  name: string;
  /** The type of the armor piece. */
  type: ArmorType;
  /** In-game description of the armor piece. */
  description: string;
  /** The skills provided by this armor piece. */
  skills: SkillWithLevel[];
  /** The slots available on this armor piece. */
  slots: Slot[];
  /** The rarity of the armor piece. */
  rarity: number;
  /** The base defense value. */
  defense: number;
  /** The elemental resistances. */
  resistance: Resistance;
  /** The armor series this piece belongs to. */
  series: string;
}

/**
 * A data structure for armor pieces grouped by their series.
 */
export interface GroupedArmor {
  /** The name of the armor series. */
  series: string;
  helm?: Armor;
  body?: Armor;
  arm?: Armor;
  waist?: Armor;
  leg?: Armor;
  /** Skills activated when the full set is worn. */
  fullSetSkills: SkillWithLevel[];
}
