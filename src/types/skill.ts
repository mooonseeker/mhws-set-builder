/**
 * @fileoverview Type definitions for skills and their categories.
 */

import { type SlotLevel } from "./base";

/** Categories of skills: waepon/armor/series/group. */
export const SKILL_CATEGORIES = ["weapon", "armor", "series", "group"] as const;
/** Type representing a skill category (waepon/armor/series/group). */
export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

/**
 * Defines a skill.
 */
export interface Skill {
  /** Unique identifier for the skill. */
  id: string;
  /** Display name of the skill. */
  name: string;
  /** The category of the skill. */
  category: SkillCategory;
  /** The maximum level of the skill (typically 1-7). */
  maxLevel: number;
  /** The slot level required for the accessory that provides this skill. */
  accessoryLevel: SlotLevel;
  /** Whether the skill is considered a key skill for builds. */
  isKey: boolean;
  /** In-game description of the skill. */
  description: string;
  /** The type of the skill, which can affect its icon. */
  type: string;
  /** A number used for sorting the skill in lists. */
  sortId: number;
}
