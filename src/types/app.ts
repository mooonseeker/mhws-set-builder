/**
 * @fileoverview Type definitions for application-wide settings and data structures.
 */

import { type Accessory } from "./accessory";
import { type Armor } from "./armor";
import { type Charm } from "./charm";
import { type Skill } from "./skill";
import { type Weapon } from "./weapon";

/**
 * Defines the application settings.
 */
export interface AppSettings {
  /** Fixed ID for use with DataStorage. */
  id: "app-settings";
  /** Whether to enable armor limit breaking. */
  enableLimitBreak: boolean;
  /** Number of skills to show per page. */
  skillsPerPage: number;
  /** Number of armor series to show per page. */
  armorSeriesPerPage: number;
  /** Number of charms to show per page. */
  charmsPerPage: number;
  /** Number of accessories to show per page. */
  accessoriesPerPage: number;
}

/**
 * The supported IDs for different data types in the database.
 */
export const ALL_DATA_IDS = [
  "skills",
  "accessories",
  "armor",
  "weapons",
  "charms",
  "settings",
] as const;
/** Type representing a data category ID. */
export type DataId = (typeof ALL_DATA_IDS)[number];

/**
 * A union type for all major data items in the application.
 */
export type DataItem = Skill | Accessory | Armor | Charm | Weapon | AppSettings;
