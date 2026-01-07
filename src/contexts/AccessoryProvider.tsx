/**
 * @fileoverview Provides a global state for accessories in the MHWS Set Builder.
 *
 * This provider manages the state of accessories, including loading, saving,
 * and CRUD operations.
 */

import { useEffect, useReducer, useRef, type ReactNode } from "react";

import { DataStorage } from "@/services/storage";
import type { Accessory } from "@/types";

import {
  AccessoryContext,
  type AccessoryContextType,
} from "./AccessoryContext";

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
 * Defines the actions that can be dispatched to modify the accessory state.
 */
type AccessoryAction =
  | { type: "SET_ACCESSORIES"; payload: Accessory[] }
  | { type: "ADD_ACCESSORY"; payload: Accessory }
  | { type: "UPDATE_ACCESSORY"; payload: Accessory }
  | { type: "DELETE_ACCESSORY"; payload: string }
  | { type: "IMPORT_ACCESSORIES"; payload: Accessory[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };

/**
 * Reducer for accessory state management.
 * Handles all state transitions for accessories based on dispatched actions.
 */
function accessoryReducer(
  state: AccessoryState,
  action: AccessoryAction,
): AccessoryState {
  switch (action.type) {
    case "SET_ACCESSORIES":
      return { ...state, accessories: action.payload, loading: false };
    case "ADD_ACCESSORY":
      return { ...state, accessories: [...state.accessories, action.payload] };
    case "UPDATE_ACCESSORY":
      return {
        ...state,
        accessories: state.accessories.map((a) =>
          a.id === action.payload.id ? action.payload : a,
        ),
      };
    case "DELETE_ACCESSORY":
      return {
        ...state,
        accessories: state.accessories.filter((a) => a.id !== action.payload),
      };
    case "IMPORT_ACCESSORIES":
      return { ...state, accessories: action.payload, loading: false };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

/**
 * Provides the accessory state to its children.
 *
 * This component manages the global state for accessories, including:
 * - Loading initial data from DataStorage.
 * - Automatically persisting data to DataStorage.
 * - Providing methods for CRUD operations.
 *
 * @param children - The child components to be rendered within this provider.
 */
export function AccessoryProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(accessoryReducer, {
    accessories: [],
    loading: true,
    error: null,
  });

  // Used to track the initial render to avoid unnecessary saves.
  const isFirstRender = useRef(true);

  // Initialize state from DataStorage on mount.
  useEffect(() => {
    try {
      const accessories = DataStorage.loadData<Accessory>("accessories");
      dispatch({ type: "SET_ACCESSORIES", payload: accessories });
    } catch (error) {
      console.error("Failed to load accessories from storage:", error);
      dispatch({ type: "SET_ERROR", payload: "Failed to load accessories" });
      dispatch({ type: "SET_ACCESSORIES", payload: [] });
    }
  }, []);

  // Auto-save to DataStorage whenever accessories change.
  useEffect(() => {
    // Skip the very first render to prevent saving the initial empty/loading state.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!state.loading) {
      DataStorage.saveData("accessories", state.accessories).catch((error) => {
        console.error("Failed to save accessories to storage:", error);
      });
    }
  }, [state.accessories, state.loading]);

  const addAccessory = (accessory: Accessory) => {
    // Prevent duplicate IDs.
    if (state.accessories.some((a) => a.id === accessory.id)) {
      throw new Error(`Accessory with ID "${accessory.id}" already exists.`);
    }
    dispatch({ type: "ADD_ACCESSORY", payload: accessory });
  };

  const updateAccessory = (accessory: Accessory) => {
    dispatch({ type: "UPDATE_ACCESSORY", payload: accessory });
  };

  const deleteAccessory = (id: string) => {
    dispatch({ type: "DELETE_ACCESSORY", payload: id });
  };

  const getAccessoryById = (id: string) => {
    return state.accessories.find((a) => a.id === id);
  };

  const importAccessories = (accessories: Accessory[]) => {
    dispatch({ type: "IMPORT_ACCESSORIES", payload: accessories });
  };

  const resetAccessories = async () => {
    try {
      // Dynamically import the initial data.
      const initialData = await import("@/data/initial-accessories.json");
      const initialAccessories = initialData.default.accessories as Accessory[];
      dispatch({ type: "SET_ACCESSORIES", payload: initialAccessories });
    } catch (error) {
      console.error("Failed to reset accessories data:", error);
      dispatch({ type: "SET_ERROR", payload: "Failed to reset accessories" });
    }
  };

  const value: AccessoryContextType = {
    ...state,
    addAccessory,
    updateAccessory,
    deleteAccessory,
    getAccessoryById,
    importAccessories,
    resetAccessories,
  };

  return (
    <AccessoryContext.Provider value={value}>
      {children}
    </AccessoryContext.Provider>
  );
}
