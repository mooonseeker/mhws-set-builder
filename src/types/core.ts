/**
 * @fileoverview Core type definitions for the MHWS Set Builder application.
 * This file contains all the fundamental TypeScript types and interfaces.
 */

// MARK: Skill Types
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

/**
 * Represents a reference to a skill with a specific level.
 */
export interface SkillWithLevel {
  /** The ID of the skill, referencing `Skill.id`. */
  skillId: string;
  /** The current level of the skill (from 1 to `maxLevel`). */
  level: number;
}

// MARK: Slot & Accessory Types
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

// MARK: Armor Types
/** The type of armor piece (helm/body/arm/waist/leg). */
export const ARMOR_TYPES = ["helm", "body", "arm", "waist", "leg"] as const;
/** Type representing the type of armor piece (helm/body/arm/waist/leg). */
export type ArmorType = (typeof ARMOR_TYPES)[number];

/**
 * Elemental resistance values.
 * The tuple represents resistances in the order: Fire, Water, Thunder, Ice, Dragon.
 */
export type Resistance = [number, number, number, number, number];

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

// MARK: Charm Types
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
 * The threshold for key skill value,
 * used to identify potentially subpar charms.
 */
export const KEY_SKILL_VALUE_THRESHOLD = 2;

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

// MARK: Weapon Types
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

// MARK: General Equipment Types
/**
 * A union type for any piece of equipment.
 */
export type Equipment = Charm | Armor | Weapon;

/**
 * Defines rarity constants and ranges.
 */
export const RARITY_MIN = 1;
export const RARITY_MAX = 12;
export const RARITY_RANGES = {
  low: { min: 1, max: 4 },
  high: { min: 5, max: 8 },
  master: { min: 9, max: 12 },
  all: { min: 1, max: 12 },
} as const;
export type RarityRangeKey = keyof typeof RARITY_RANGES;

// MARK: Other Types
/**
 * The direction for sorting.
 * - `asc`: Ascending
 * - `desc`: Descending
 */
export type SortDirection = "asc" | "desc";

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
