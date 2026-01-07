/**
 * @fileoverview Defines the context and types for armor management in the MHWS Set Builder.
 *
 * This file contains only the context definition and related types to prevent
 * React Fast Refresh warnings.
 */

import { createContext } from "react";

import type { Armor } from "@/types";

/**
 * Describes the state of armor.
 */
interface ArmorState {
  /** The list of all available armor pieces. */
  armor: Armor[];
  /** True if the armor data is currently being loaded. */
  loading: boolean;
  /** An error message if something went wrong, otherwise null. */
  error: string | null;
}

/**
 * Defines the shape of the ArmorContext.
 */
export interface ArmorContextType extends ArmorState {
  /**
   * Adds a new armor piece.
   * @param armor - The armor piece to add.
   * @throws {Error} If an armor piece with the same ID already exists.
   */
  addArmor: (armor: Armor) => void;

  /**
   * Updates an existing armor piece.
   * @param armor - The armor piece with updated values.
   */
  updateArmor: (armor: Armor) => void;

  /**
   * Deletes an armor piece by its ID.
   * @param id - The ID of the armor piece to delete.
   */
  deleteArmor: (id: string) => void;

  /**
   * Retrieves an armor piece by its ID.
   * @param id - The ID of the armor piece to find.
   * @returns The armor piece if found, otherwise undefined.
   */
  getArmorById: (id: string) => Armor | undefined;

  /**
   * Imports a list of armor pieces, replacing all existing ones.
   * @param armor - The list of armor pieces to import.
   */
  importArmor: (armor: Armor[]) => void;

  /**
   * Resets armor to the initial default dataset.
   */
  resetArmor: () => Promise<void>;
}

/**
 * React context for managing armor.
 */
export const ArmorContext = createContext<ArmorContextType | undefined>(
  undefined,
);
