/**
 * @fileoverview Defines default equipment for various categories and types.
 */

import type { WeaponType } from "@/types";

/**
 * Mapping of weapon types to their default weapon IDs used for calculations or initial states.
 * Usually refers to a basic weapon with no skills or unique properties but standard slots.
 */
export const DEFAULT_WEAPON_IDS: Record<WeaponType, string> = {
  "short-sword": "ShortSword_191",
  tachi: "Tachi_181",
  "twin-sword": "TwinSword_094",
  "long-sword": "LongSword_167",
  hammer: "Hammer_090",
  whistle: "Whistle_090",
  lance: "Lance_081",
  "gun-lance": "GunLance_088",
  "slash-axe": "SlashAxe_082",
  "charge-axe": "ChargeAxe_087",
  rod: "Rod_090",
  bow: "Bow_186",
  "light-bowgun": "LightBowgun_183",
  "heavy-bowgun": "HeavyBowgun_154",
};
