/**
 * @fileoverview Context definition for the automatic search service.
 * Defines the contract for managing search requirements and executing the search algorithm.
 */

import { createContext } from "react";

import type { FinalSet, SkillWithLevel } from "@/types";

/**
 * Defines the shape of the Search Context.
 */
export interface SearchContextValue {
  /** The list of skills required by the user for the search. */
  requiredSkills: SkillWithLevel[];

  /** The results found by the last search operation. */
  searchResults: FinalSet[];

  /** Whether a search operation is currently in progress. */
  isSearching: boolean;

  /** The progress of the current search (0-100), or null if not searching. */
  searchProgress: number | null;

  /** A descriptive status message for the current search step. */
  searchStatus: string;

  /**
   * Adds a skill requirement or updates it if it already exists.
   * @param skill The skill and level to add.
   */
  addRequiredSkill: (skill: SkillWithLevel) => void;

  /**
   * Updates the required level of a specific skill.
   * Removes the skill requirement if newLevel is <= 0.
   * @param skillId The ID of the skill to update.
   * @param newLevel The new target level.
   */
  updateRequiredSkillLevel: (skillId: string, newLevel: number) => void;

  /** Clears all skill requirements. */
  resetRequiredSkills: () => void;

  /**
   * Executes the search algorithm based on current requirements and equipment.
   * Note: This is the raw search action; for UI flow (w/ view switching), see BuilderUIContext.
   */
  confirmSearch: () => Promise<void>;

  /**
   * Manually updates the search results list.
   * @param results The new list of results.
   */
  setSearchResults: (results: FinalSet[]) => void;
}

export const SearchContext = createContext<SearchContextValue | undefined>(
  undefined,
);
