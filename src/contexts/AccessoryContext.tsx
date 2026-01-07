/**
 * @fileoverview Defines the context and types for accessory management in the MHWS Set Builder.
 *
 * This file contains only the context definition and related types to prevent
 * React Fast Refresh warnings.
 */

import { createContext } from "react";

import type { Accessory } from "@/types";

/**
 * Describes the state of accessories.
 */
interface AccessoryState {
  /** The list of all available accessories. */
  accessories: Accessory[];
  /** True if the accessories are currently being loaded. */
  loading: boolean;
  /** An error message if something went wrong, otherwise null. */
  error: string | null;
}

/**
 * Defines the shape of the AccessoryContext.
 */
export interface AccessoryContextType extends AccessoryState {
  /**
   * Adds a new accessory.
   * @param accessory - The accessory to add.
   * @throws {Error} If an accessory with the same ID already exists.
   */
  addAccessory: (accessory: Accessory) => void;

  /**
   * Updates an existing accessory.
   * @param accessory - The accessory with updated values.
   */
  updateAccessory: (accessory: Accessory) => void;

  /**
   * Deletes an accessory by its ID.
   * @param id - The ID of the accessory to delete.
   */
  deleteAccessory: (id: string) => void;

  /**
   * Retrieves an accessory by its ID.
   * @param id - The ID of the accessory to find.
   * @returns The accessory object if found, otherwise undefined.
   */
  getAccessoryById: (id: string) => Accessory | undefined;

  /**
   * Imports a list of accessories, replacing all existing ones.
   * @param accessories - The list of accessories to import.
   */
  importAccessories: (accessories: Accessory[]) => void;

  /**
   * Resets accessories to the initial default dataset.
   */
  resetAccessories: () => Promise<void>;
}

/**
 * React context for managing accessories.
 */
export const AccessoryContext = createContext<AccessoryContextType | undefined>(
  undefined,
);
