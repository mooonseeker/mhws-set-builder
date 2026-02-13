/**
 * @fileoverview Primitive types and interfaces used across multiple domains.
 */

/**
 * The type of slot/accessory.
 * - `weapon`: Providing weapon skill.
 * - `armor`: Providing armor skill.
 */
export const SLOT_TYPES = ["weapon", "armor"] as const;
/** Type representing the type of slot/accessory (weapon/armor). */
export type SlotType = (typeof SLOT_TYPES)[number];

/**
 * The level of a slot (1-3).
 * A value of -1 indicates a special skill that does not have a corresponding accessory.
 */
export type SlotLevel = -1 | 1 | 2 | 3;

/**
 * Represents a reference to a skill with a specific level.
 */
export interface SkillWithLevel {
  /** The ID of the skill, referencing `Skill.id`. */
  skillId: string;
  /** The current level of the skill (from 1 to `maxLevel`). */
  level: number;
}

/**
 * Elemental resistance values.
 * The tuple represents resistances in the order: Fire, Water, Thunder, Ice, Dragon.
 */
export type Resistance = [number, number, number, number, number];

/**
 * Defines weapon sharpness.
 * The 7-element tuple represents the length of each sharpness level:
 * Red, Orange, Yellow, Green, Blue, White, Purple.
 */
export type Sharpness = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

/**
 * Defines weapon potential sharpness.
 * The 4-element Takumi tuple represents the sharpness distribution with the
 * Takumi skill (50 hits at Lv5).
 */
export type Takumi = [number, number, number, number];

/**
 * The direction for sorting.
 * - `asc`: Ascending
 * - `desc`: Descending
 */
export type SortDirection = "asc" | "desc";
