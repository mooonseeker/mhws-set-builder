/**
 * @fileoverview Defines the context and types for weapon management in the MHWS Set Builder.
 *
 * This file contains only the context definition and related types to prevent
 * React Fast Refresh warnings.
 */

import { createContext } from "react";

import type { Weapon } from "@/types";

/**
 * Describes the state of weapons.
 */
interface WeaponState {
  /** The list of all available weapons. */
  weapons: Weapon[];
  /** True if the weapons are currently being loaded. */
  loading: boolean;
  /** An error message if something went wrong, otherwise null. */
  error: string | null;
}

/**
 * Defines the shape of the WeaponContext.
 */
export interface WeaponContextType extends WeaponState {
  /**
   * Adds a new weapon.
   * @param weapon - The weapon to add.
   * @throws {Error} If a weapon with the same ID already exists.
   */
  addWeapon: (weapon: Weapon) => void;

  /**
   * Updates an existing weapon.
   * @param weapon - The weapon with updated values.
   */
  updateWeapon: (weapon: Weapon) => void;

  /**
   * Deletes a weapon by its ID.
   * @param id - The ID of the weapon to delete.
   */
  deleteWeapon: (id: string) => void;

  /**
   * Retrieves a weapon by its ID.
   * @param id - The ID of the weapon to find.
   * @returns The weapon object if found, otherwise undefined.
   */
  getWeaponById: (id: string) => Weapon | undefined;

  /**
   * Imports a list of weapons, replacing all existing ones.
   * @param weapons - The list of weapons to import.
   */
  importWeapons: (weapons: Weapon[]) => void;

  /**
   * Resets weapons to the initial default dataset.
   */
  resetWeapons: () => Promise<void>;
}

/**
 * React context for managing weapons.
 */
export const WeaponContext = createContext<WeaponContextType | undefined>(
  undefined,
);
