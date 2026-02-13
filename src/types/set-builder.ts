/**
 * @fileoverview Type definitions for the set builder feature.
 * This file contains types related to equipment sets, search context, and results.
 */

import { type Accessory, type Slot } from "./accessory";
import { ARMOR_TYPES, type Armor, type ArmorType } from "./armor";
import { type SkillWithLevel } from "./base";
import { type Charm } from "./charm";
import { type Skill } from "./skill";
import { type Weapon } from "./weapon";

// MARK: Equipment Set Types
/** The type of an equipment cell in the UI. */
export const EQUIPMENT_CELL_TYPES = [
  ...ARMOR_TYPES,
  "weapon",
  "charm",
] as const;
/** Type representing an equipment cell type. */
export type EquipmentCellType = (typeof EQUIPMENT_CELL_TYPES)[number];

/** Represents a piece of equipment with accessories. */
export interface SlottedEquipment<T extends Weapon | Armor | Charm> {
  equipment: T;
  /** The length of this array should match the number of slots on the equipment. */
  accessories: (Accessory | null)[];
}

/** A complete set of armor. */
export interface ArmorSet {
  helm?: Armor;
  body?: Armor;
  arm?: Armor;
  waist?: Armor;
  leg?: Armor;
}

/**
 * A complete equipment set, including weapon, 5 armor pieces, and a charm.
 * All properties are optional to support progressive set building.
 */
export interface EquipmentSet {
  weapon?: SlottedEquipment<Weapon>;
  helm?: SlottedEquipment<Armor>;
  body?: SlottedEquipment<Armor>;
  arm?: SlottedEquipment<Armor>;
  waist?: SlottedEquipment<Armor>;
  leg?: SlottedEquipment<Armor>;
  charm?: SlottedEquipment<Charm>;
}

/**
 * The final, complete equipment set to be presented to the user.
 */
export interface FinalSet {
  /** The final equipment combination. */
  equipment: EquipmentSet;
  /** Details of the accessories used in the set. */
  accessories: Map<string, Accessory[]>;
  /** Any remaining slots in the final set. */
  remainingSlots: Slot[];
}

// MARK: Context
/** Context for selecting equipment or accessories. */
export type SelectionContext =
  | { type: "equipment"; equipmentType: EquipmentCellType }
  | {
      type: "accessory";
      slotType: EquipmentCellType;
      slotIndex: number;
      slot: Slot;
    };

/**
 * Desired skills, categorized for the search algorithm.
 */
export interface CategorizedSkills {
  /** Skills from armor series bonuses. */
  seriesSkills: SkillWithLevel[];
  /** Combination skills. */
  groupSkills: SkillWithLevel[];
  /** Armor/weapon skills that cannot be obtained from accessories. */
  noAccessorySkills: SkillWithLevel[];
  /** Weapon skills that can be obtained from accessories. */
  weaponSkills: SkillWithLevel[];
  /** Armor skills that can be obtained from accessories. */
  armorSkills: SkillWithLevel[];
}

/**
 * A list of equipment that provides a specific skill.
 */
export interface SkillProviders {
  armors: Armor[];
  weapons: Weapon[];
  charms: Charm[];
  accessories: Accessory[];
}

/** Preprocessed data structures for fast lookups during the search. */
export interface PreprocessedData {
  /** A map from skill ID to the list of equipment that provides it. */
  skillProviderMap: Map<string, SkillProviders>;
  /** A map of the maximum potential skill points per armor type. */
  maxPotentialPerArmorType: Map<ArmorType, Map<string, number>>;
  /** A map from skill ID to the accessories that provide it. */
  accessoriesBySkill: Map<string, Accessory[]>;
  /** A map from skill ID to its full definition. */
  skillDetails: Map<string, Skill>;
  /** The list of armors after filtering dominated items. */
  filteredArmors: Armor[];
  /** The list of charms after filtering dominated items. */
  filteredCharms: Charm[];
}

/**
 * Contextual information during the set search process.
 */
export interface SearchContext {
  /** The current equipment being built. */
  equipment: EquipmentSet;
  /** A map of currently achieved skill levels. */
  currentSkills: Map<string, number>;
  /** All available slots from the current equipment. */
  availableSlots: {
    weapon: Slot[];
    armor: Slot[];
  };
  /** The remaining skill levels to be fulfilled. */
  skillDeficits: CategorizedSkills;
}

/** Represents the deficit between desired and current skill levels. */
export interface SkillDeficit {
  /** The ID of the skill. */
  skillId: string;
  /** The number of additional levels required. */
  missingLevel: number;
}

/** The result of an accessory filling solution. */
export interface AccessorySolution {
  /** Whether a valid accessory combination was found to meet all skill requirements. */
  isSuccess: boolean;
  /** The specific placement of accessories. Key is equipment ID, Value is the list of socketed accessories. */
  placement: Map<string, Accessory[]>;
  /** The remaining slots after filling, categorized by type. */
  remainingSlots: {
    weapon: Slot[];
    armor: Slot[];
  };
}
