/**
 * @fileoverview Provides a global state for weapons in the MHWS Set Builder.
 *
 * This provider manages the state of weapons, including loading, saving,
 * and CRUD operations.
 */

import { useEffect, useReducer, useRef, type ReactNode } from "react";

import { DataStorage } from "@/services/storage";
import type { Weapon } from "@/types";

import { WeaponContext, type WeaponContextType } from "./WeaponContext";

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
 * Defines the actions that can be dispatched to modify the weapon state.
 */
type WeaponAction =
  | { type: "SET_WEAPONS"; payload: Weapon[] }
  | { type: "ADD_WEAPON"; payload: Weapon }
  | { type: "UPDATE_WEAPON"; payload: Weapon }
  | { type: "DELETE_WEAPON"; payload: string }
  | { type: "IMPORT_WEAPONS"; payload: Weapon[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };

/**
 * Reducer for weapon state management.
 * Handles all state transitions for weapons based on dispatched actions.
 */
function weaponReducer(state: WeaponState, action: WeaponAction): WeaponState {
  switch (action.type) {
    case "SET_WEAPONS":
      return { ...state, weapons: action.payload, loading: false };
    case "ADD_WEAPON":
      return { ...state, weapons: [...state.weapons, action.payload] };
    case "UPDATE_WEAPON":
      return {
        ...state,
        weapons: state.weapons.map((w) =>
          w.id === action.payload.id ? action.payload : w,
        ),
      };
    case "DELETE_WEAPON":
      return {
        ...state,
        weapons: state.weapons.filter((w) => w.id !== action.payload),
      };
    case "IMPORT_WEAPONS":
      return { ...state, weapons: action.payload, loading: false };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

/**
 * Provides the weapon state to its children.
 *
 * This component manages the global state for weapons, including:
 * - Loading initial data from DataStorage.
 * - Automatically persisting data to DataStorage.
 * - Providing methods for CRUD operations.
 *
 * @param children - The child components to be rendered within this provider.
 */
export function WeaponProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(weaponReducer, {
    weapons: [],
    loading: true,
    error: null,
  });

  // Used to track the initial render to avoid unnecessary saves.
  const isFirstRender = useRef(true);

  // Initialize state from DataStorage on mount.
  useEffect(() => {
    try {
      const weapons = DataStorage.loadData<Weapon>("weapons");
      dispatch({ type: "SET_WEAPONS", payload: weapons });
    } catch (error) {
      console.error("Failed to load weapons from storage:", error);
      dispatch({ type: "SET_ERROR", payload: "Failed to load weapons" });
      dispatch({ type: "SET_WEAPONS", payload: [] });
    }
  }, []);

  // Auto-save to DataStorage whenever weapons change.
  useEffect(() => {
    // Skip the very first render to prevent saving the initial empty/loading state.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!state.loading) {
      DataStorage.saveData("weapons", state.weapons).catch((error) => {
        console.error("Failed to save weapons to storage:", error);
      });
    }
  }, [state.weapons, state.loading]);

  const addWeapon = (weapon: Weapon) => {
    // Prevent duplicate IDs.
    if (state.weapons.some((w) => w.id === weapon.id)) {
      throw new Error(`Weapon with ID "${weapon.id}" already exists.`);
    }
    dispatch({ type: "ADD_WEAPON", payload: weapon });
  };

  const updateWeapon = (weapon: Weapon) => {
    dispatch({ type: "UPDATE_WEAPON", payload: weapon });
  };

  const deleteWeapon = (id: string) => {
    dispatch({ type: "DELETE_WEAPON", payload: id });
  };

  const getWeaponById = (id: string) => {
    return state.weapons.find((w) => w.id === id);
  };

  const importWeapons = (weapons: Weapon[]) => {
    dispatch({ type: "IMPORT_WEAPONS", payload: weapons });
  };

  const resetWeapons = async () => {
    try {
      // Fetch initial data from the public directory.
      const baseUrl = import.meta.env.BASE_URL;
      const response = await fetch(`${baseUrl}data/initial-weapons.json`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const initialData = (await response.json()) as { weapons: Weapon[] };
      const initialWeapons = initialData.weapons;
      dispatch({ type: "SET_WEAPONS", payload: initialWeapons });
    } catch (error) {
      console.error("Failed to reset weapons data:", error);
      dispatch({ type: "SET_ERROR", payload: "Failed to reset weapons" });
    }
  };

  const value: WeaponContextType = {
    ...state,
    addWeapon,
    updateWeapon,
    deleteWeapon,
    getWeaponById,
    importWeapons,
    resetWeapons,
  };

  return (
    <WeaponContext.Provider value={value}>{children}</WeaponContext.Provider>
  );
}
