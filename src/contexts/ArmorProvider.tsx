/**
 * @fileoverview Provides a global state for armor in the MHWS Set Builder.
 *
 * This provider manages the state of armor, including loading, saving,
 * and CRUD operations.
 */

import { useEffect, useReducer, useRef, type ReactNode } from "react";

import { DataStorage } from "@/services/storage";
import type { Armor } from "@/types";

import { ArmorContext, type ArmorContextType } from "./ArmorContext";

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
 * Defines the actions that can be dispatched to modify the armor state.
 */
type ArmorAction =
  | { type: "SET_ARMOR"; payload: Armor[] }
  | { type: "ADD_ARMOR"; payload: Armor }
  | { type: "UPDATE_ARMOR"; payload: Armor }
  | { type: "DELETE_ARMOR"; payload: string }
  | { type: "IMPORT_ARMOR"; payload: Armor[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };

/**
 * Reducer for armor state management.
 * Handles all state transitions for armor based on dispatched actions.
 */
function armorReducer(state: ArmorState, action: ArmorAction): ArmorState {
  switch (action.type) {
    case "SET_ARMOR":
      return { ...state, armor: action.payload, loading: false };
    case "ADD_ARMOR":
      return { ...state, armor: [...state.armor, action.payload] };
    case "UPDATE_ARMOR":
      return {
        ...state,
        armor: state.armor.map((a) =>
          a.id === action.payload.id ? action.payload : a,
        ),
      };
    case "DELETE_ARMOR":
      return {
        ...state,
        armor: state.armor.filter((a) => a.id !== action.payload),
      };
    case "IMPORT_ARMOR":
      return { ...state, armor: action.payload, loading: false };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

/**
 * Provides the armor state to its children.
 *
 * This component manages the global state for armor, including:
 * - Loading initial data from DataStorage.
 * - Automatically persisting data to DataStorage.
 * - Providing methods for CRUD operations.
 *
 * @param children - The child components to be rendered within this provider.
 */
export function ArmorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(armorReducer, {
    armor: [],
    loading: true,
    error: null,
  });

  // Used to track the initial render to avoid unnecessary saves.
  const isFirstRender = useRef(true);

  // Initialize state from DataStorage on mount.
  useEffect(() => {
    try {
      const armor = DataStorage.loadData<Armor>("armor");
      dispatch({ type: "SET_ARMOR", payload: armor });
    } catch (error) {
      console.error("Failed to load armor from storage:", error);
      dispatch({ type: "SET_ERROR", payload: "Failed to load armor" });
      dispatch({ type: "SET_ARMOR", payload: [] });
    }
  }, []);

  // Auto-save to DataStorage whenever armor changes.
  useEffect(() => {
    // Skip the very first render to prevent saving the initial empty/loading state.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!state.loading) {
      DataStorage.saveData("armor", state.armor).catch((error) => {
        console.error("Failed to save armor to storage:", error);
      });
    }
  }, [state.armor, state.loading]);

  const addArmor = (armor: Armor) => {
    // Prevent duplicate IDs.
    if (state.armor.some((a) => a.id === armor.id)) {
      throw new Error(`Armor with ID "${armor.id}" already exists.`);
    }
    dispatch({ type: "ADD_ARMOR", payload: armor });
  };

  const updateArmor = (armor: Armor) => {
    dispatch({ type: "UPDATE_ARMOR", payload: armor });
  };

  const deleteArmor = (id: string) => {
    dispatch({ type: "DELETE_ARMOR", payload: id });
  };

  const getArmorById = (id: string) => {
    return state.armor.find((a) => a.id === id);
  };

  const importArmor = (armor: Armor[]) => {
    dispatch({ type: "IMPORT_ARMOR", payload: armor });
  };

  const resetArmor = async () => {
    try {
      // Fetch initial data from the public directory.
      const baseUrl = import.meta.env.BASE_URL;
      const response = await fetch(`${baseUrl}data/initial-armor.json`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const initialData = (await response.json()) as { armor: Armor[] };
      const initialArmor = initialData.armor;
      dispatch({ type: "SET_ARMOR", payload: initialArmor });
    } catch (error) {
      console.error("Failed to reset armor data:", error);
      dispatch({ type: "SET_ERROR", payload: "Failed to reset armor" });
    }
  };

  const value: ArmorContextType = {
    ...state,
    addArmor,
    updateArmor,
    deleteArmor,
    getArmorById,
    importArmor,
    resetArmor,
  };

  return (
    <ArmorContext.Provider value={value}>{children}</ArmorContext.Provider>
  );
}
