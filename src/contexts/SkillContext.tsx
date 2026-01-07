/**
 * @fileoverview Defines the context and types for skill management in the MHWS Set Builder.
 *
 * This file contains only the context definition and related types to prevent
 * React Fast Refresh warnings.
 */

import { createContext } from "react";

import type { Skill } from "@/types";

/**
 * Describes the state of skills.
 */
interface SkillState {
  /** The list of all available skills. */
  skills: Skill[];
  /** True if the skills are currently being loaded. */
  loading: boolean;
  /** An error message if something went wrong, otherwise null. */
  error: string | null;
}

/**
 * Defines the shape of the SkillContext.
 */
export interface SkillContextType extends SkillState {
  /**
   * Adds a new skill.
   * @param skill - The skill to add.
   * @throws {Error} If a skill with the same name or ID already exists.
   */
  addSkill: (skill: Skill) => void;

  /**
   * Updates an existing skill.
   * @param skill - The skill with updated values.
   */
  updateSkill: (skill: Skill) => void;

  /**
   * Deletes a skill by its ID.
   * @param id - The ID of the skill to delete.
   */
  deleteSkill: (id: string) => void;

  /**
   * Retrieves a skill by its ID.
   * @param id - The ID of the skill to find.
   * @returns The skill object if found, otherwise undefined.
   */
  getSkillById: (id: string) => Skill | undefined;

  /**
   * Imports a list of skills, replacing all existing ones.
   * @param skills - The list of skills to import.
   */
  importSkills: (skills: Skill[]) => void;

  /**
   * Resets skills to the initial default dataset.
   */
  resetSkills: () => Promise<void>;
}

/**
 * React context for managing skills.
 */
export const SkillContext = createContext<SkillContextType | undefined>(
  undefined,
);
