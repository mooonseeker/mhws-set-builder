/**
 * @fileoverview Type definitions for slots and accessories.
 */

import { type SkillWithLevel, type SlotLevel, type SlotType } from "./base";

/**
 * Defines a slot on a piece of equipment.
 */
export interface Slot {
  /** The type of the slot. */
  type: SlotType;
  /** The level of the slot (1-3). */
  level: SlotLevel;
  /** The ID of the source equipment, used for backtracking and result assembly. */
  sourceId?: string;
}

/**
 * Defines an accessory.
 */
export interface Accessory {
  /** Unique identifier for the accessory. */
  id: string;
  /** Display name of the accessory. */
  name: string;
  /** The type of the accessory. */
  type: SlotType;
  /** In-game description of the accessory. */
  description: string;
  /** A number used for sorting the accessory in lists. */
  sortID: number;
  /** The skills provided by this accessory. */
  skills: SkillWithLevel[];
  /** The rarity of the accessory. */
  rarity: number;
  /** The slot level required to equip this accessory. */
  slotLevel: SlotLevel;
  /** The color used for the accessory's icon. */
  color: string;
}
