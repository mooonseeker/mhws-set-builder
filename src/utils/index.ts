/**
 * @fileoverview Barrel file for exporting all utility functions in MHWS Set Builder.
 *
 * This file centralizes exports for all utility modules, making them
 * easily accessible from other parts of the application.
 */

// Charm calculation utilities
export {
  calculateSkillEquivalentSlots,
  calculateCharmEquivalentSlots,
  calculateKeySkillValue,
} from "./charm-calculator";

// Charm validation utilities
export {
  validateCharm,
  areSkillsIdentical,
  areSlotsIdentical,
} from "./charm-validator";

// ID generation utilities
export {
  validateIdFormat,
  generateSkillId,
  generateCharmId,
  isOfficialCharmId,
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

// Dominance check utilities
export { compareSlots, compareSkillSets, isStrictlyBetter } from "./dominance";
export type { ComparisonResult, IDominanceCandidate } from "./dominance";

// General-purpose data I/O utilities
export { validateData } from "./data-io";

// General-purpose data I/O types
export type { ValidationResult } from "./data-io";
