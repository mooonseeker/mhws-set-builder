/**
 * @fileoverview Limit break utilities for MHWS Set Builder.
 *
 * Provides functions to upgrade armor and toggle the global limit break status.
 */

import { cloneDeep } from "lodash-es";

import { DataStorage } from "@/services/storage";
import type { AppSettings, Armor, SlotLevel } from "@/types";

/**
 * Upgrades a single piece of armor to its limit-broken state.
 *
 * Rules:
 * - Rarity 5: Each of the three slots increases by 1 level (max 3).
 * - Rarity 6: Each of the first two slots increases by 1 level (max 3).
 * - Name: Appends a "+" suffix.
 *
 * @param armor The armor piece to upgrade.
 * @returns The upgraded armor piece.
 */
export function upgradeArmor(armor: Armor): Armor {
  // Only process R5 and R6 armor.
  if (armor.rarity !== 5 && armor.rarity !== 6) {
    return armor;
  }

  // If the name already has a "+" suffix, it's already upgraded.
  if (armor.name.endsWith("+")) {
    return armor;
  }

  const newArmor = cloneDeep(armor);
  newArmor.name = `${newArmor.name}+`;

  // 1. Standardize slots to an array of levels, padding with 0s to 3 slots.
  const currentSlotLevels: number[] = [
    ...newArmor.slots.map((s) => s.level),
    0,
    0,
    0,
  ].slice(0, 3);

  // 2. Apply upgrade rules.
  let upgradedLevels: number[];
  if (newArmor.rarity === 5) {
    // R5: All three slots increase by 1.
    upgradedLevels = currentSlotLevels.map((level) => Math.min(level + 1, 3));
  } else {
    // R6: The first two slots increase by 1.
    upgradedLevels = currentSlotLevels.map((level, index) =>
      index < 2 ? Math.min(level + 1, 3) : level,
    );
  }

  // 3. Regenerate the slots array, filtering out level 0 slots and sorting descending.
  newArmor.slots = upgradedLevels
    .filter((level): level is 1 | 2 | 3 => level > 0)
    .sort((a, b) => b - a)
    .map((level) => ({
      type: "armor", // Assume armor slots are always of type "armor".
      level: level as SlotLevel,
    }));

  return newArmor;
}

/**
 * Toggles the global limit break status for all armor.
 *
 * @param enable - Whether to enable or disable limit break.
 */
export async function toggleLimitBreakGlobal(enable: boolean): Promise<void> {
  // 1. Get current settings.
  const settingsData = DataStorage.loadData<AppSettings>("settings");
  if (!settingsData || settingsData.length === 0) {
    throw new Error("Settings not initialized");
  }
  const settings = settingsData[0];

  // If the state hasn't changed, do nothing.
  if (settings.enableLimitBreak === enable) {
    return;
  }

  // 2. Update armor data.
  if (enable) {
    // Enable: Load current armor -> upgrade -> save.
    const currentArmors = DataStorage.loadData<Armor>("armor");
    const upgradedArmors = currentArmors.map(upgradeArmor);
    DataStorage.saveData("armor", upgradedArmors).catch(console.error);
  } else {
    // Disable: Reset armor data to its initial state.
    await DataStorage.resetData("armor");
  }

  // 3. Update the setting.
  settings.enableLimitBreak = enable;
  DataStorage.saveData("settings", [settings]).catch(console.error);
}
