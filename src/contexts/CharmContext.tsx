/**
 * @fileoverview Defines the context and types for charm management in the MHWS Set Builder.
 *
 * This file contains only the context definition and related types to prevent
 * React Fast Refresh warnings.
 */

import { createContext } from "react";

import type { Charm, CharmEnhanced } from "@/types";

/**
 * Describes the state of charms.
 */
interface CharmState {
  /** The list of all available charms. */
  charms: Charm[];
  /** True if the charms are currently being loaded. */
  loading: boolean;
  /** An error message if something went wrong, otherwise null. */
  error: string | null;
}

/**
 * Defines the shape of the CharmContext.
 */
export interface CharmContextType extends CharmState {
  /** The list of charms with calculated properties. */
  enhancedCharms: CharmEnhanced[];

  /**
   * Adds a new charm.
   * @param charm - The charm to add.
   * @throws {Error} If a charm with the same ID already exists.
   */
  addCharm: (charm: Charm) => void;

  /**
   * Updates an existing charm.
   * @param charm - The charm with updated values.
   */
  updateCharm: (charm: Charm) => void;

  /**
   * Deletes a single charm by its ID.
   * @param id - The ID of the charm to delete.
   */
  deleteCharm: (id: string) => void;

  /**
   * Deletes multiple charms by their IDs.
   * @param ids - An array of charm IDs to delete.
   */
  deleteCharms: (ids: string[]) => void;

  /**
   * Retrieves a charm by its ID.
   * @param id - The ID of the charm to find.
   * @returns The charm object if found, otherwise undefined.
   */
  getCharmById: (id: string) => Charm | undefined;

  /**
   * Imports a list of charms, replacing all existing ones.
   * @param charms - The list of charms to import.
   */
  importCharms: (charms: Charm[]) => void;

  /**
   * Resets charms to the initial default dataset.
   */
  resetCharms: () => Promise<void>;
}

/**
 * React context for managing charms.
 */
export const CharmContext = createContext<CharmContextType | undefined>(
  undefined,
);
