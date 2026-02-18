/**
 * @fileoverview Barrel file for exporting all utility functions in MHWS Set Builder.
 *
 * This file centralizes exports for all utility modules, making them
 * easily accessible from other parts of the application.
 */

// Armor grouping utilities
export { groupArmorBySeries } from "./armor-grouper";

// Charm calculation utilities
export {
  calculateSkillEquivalentSlots,
  calculateCharmEquivalentSlots,
  calculateKeySkillValue,
} from "./charm-calculator";

// Charm validation utilities
export { validateCharm } from "./charm-validator";

// ID generation utilities
export {
  validateIdFormat,
  generateSkillId,
  generateCharmId,
  generateAccessoryId,
  generateArmorId,
  generateWeaponId,
  isOfficialId,
  isOfficialCharmId,
  isCustomId,
} from "./id-generator";

// Charm sorting utilities
export {
  sortCharms,
  sortCharmsDefault,
  sortCharmsMultiple,
  filterAndSortBySkill,
} from "./charm-sorter";

// Skill sorting utilities
export { compareSkillsPriority } from "./skill-sorter";

// Equipment comparison utilities
export { isSuperior, compareEquipment } from "./equipment-vs";
export type { EquipmentComparisonResult } from "./equipment-vs";

// General-purpose data I/O utilities
export { validateData, createDiff, patch } from "./data-io";

// General-purpose data I/O types
export type {
  ValidationResult,
  DataDelta,
  DataDifference,
  MigrationStats,
} from "./data-io";

// Limit break utilities
export { upgradeArmor, toggleLimitBreakGlobal } from "./limit-break";

// Weapon grouping utilities
export { groupWeaponsIntoRows } from "./weapon-grouper";

// Asset utilities
export { getAssetPath } from "./assets";
