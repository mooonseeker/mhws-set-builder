/**
 * @fileoverview Provides a global state for charms in the MHWS Set Builder.
 *
 * This provider manages the state of charms, including loading, saving,
 * and CRUD operations.
 */

import { useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";

import { useSkills } from "@/hooks";
import { DataStorage } from "@/services/storage";
import type { Charm, CharmEnhanced } from "@/types";
import { calculateCharmEquivalentSlots, calculateKeySkillValue } from "@/utils";

import { CharmContext, type CharmContextType } from "./CharmContext";

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
 * Defines the actions that can be dispatched to modify the charm state.
 */
type CharmAction =
  | { type: "SET_CHARMS"; payload: Charm[] }
  | { type: "ADD_CHARM"; payload: Charm }
  | { type: "UPDATE_CHARM"; payload: Charm }
  | { type: "DELETE_CHARM"; payload: string }
  | { type: "BATCH_DELETE_CHARMS"; payload: string[] }
  | { type: "IMPORT_CHARMS"; payload: Charm[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };

/**
 * Reducer for charm state management.
 * Handles all state transitions for charms based on dispatched actions.
 */
function charmReducer(state: CharmState, action: CharmAction): CharmState {
  switch (action.type) {
    case "SET_CHARMS":
      return { ...state, charms: action.payload, loading: false };
    case "ADD_CHARM":
      return { ...state, charms: [...state.charms, action.payload] };
    case "UPDATE_CHARM":
      return {
        ...state,
        charms: state.charms.map((c) =>
          c.id === action.payload.id ? action.payload : c,
        ),
      };
    case "DELETE_CHARM":
      return {
        ...state,
        charms: state.charms.filter((c) => c.id !== action.payload),
      };
    case "BATCH_DELETE_CHARMS":
      return {
        ...state,
        charms: state.charms.filter((c) => !action.payload.includes(c.id)),
      };
    case "IMPORT_CHARMS":
      return { ...state, charms: action.payload, loading: false };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

/**
 * Provides the charm state to its children.
 *
 * This component manages the global state for charms, including:
 * - Loading initial data from DataStorage.
 * - Automatically persisting data to DataStorage.
 * - Providing methods for CRUD operations.
 *
 * @param children - The child components to be rendered within this provider.
 */
export function CharmProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(charmReducer, {
    charms: [],
    loading: true,
    error: null,
  });

  const { skills } = useSkills();

  // Enhanced charms with calculated values
  const enhancedCharms = useMemo(() => {
    return state.charms.map((charm): CharmEnhanced => {
      return {
        ...charm,
        equivalentSlots: calculateCharmEquivalentSlots(
          charm.skills,
          charm.slots,
          skills,
        ),
        keySkillValue: calculateKeySkillValue(
          charm.skills,
          charm.slots,
          skills,
        ),
      };
    });
  }, [state.charms, skills]);

  // Used to track the initial render to avoid unnecessary saves.
  const isFirstRender = useRef(true);

  // Initialize state from DataStorage on mount.
  useEffect(() => {
    try {
      const charms = DataStorage.loadData<Charm>("charms");

      // Cleanup: remove old calculated properties if they exist in storage
      // We map the raw data to the core Charm type by explicitly picking fields
      const cleanedCharms = charms.map((c): Charm => {
        // We cast to Charm to access properties, knowing it might have extra properties
        const raw = c;
        return {
          id: raw.id,
          name: raw.name,
          rarity: raw.rarity,
          skills: raw.skills,
          slots: raw.slots,
          createdAt: raw.createdAt,
        };
      });

      dispatch({ type: "SET_CHARMS", payload: cleanedCharms });
    } catch (error) {
      console.error("Failed to load charms from storage:", error);
      dispatch({ type: "SET_ERROR", payload: "Failed to load charms" });
      dispatch({ type: "SET_CHARMS", payload: [] });
    }
  }, []);

  // Auto-save to DataStorage whenever charms change.
  useEffect(() => {
    // Skip the very first render to prevent saving the initial empty/loading state.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!state.loading) {
      DataStorage.saveData("charms", state.charms).catch((error) => {
        console.error("Failed to save charms to storage:", error);
      });
    }
  }, [state.charms, state.loading]);

  const addCharm = (charm: Charm) => {
    // Prevent duplicate IDs.
    if (state.charms.some((c) => c.id === charm.id)) {
      throw new Error(`Charm with ID "${charm.id}" already exists.`);
    }
    dispatch({ type: "ADD_CHARM", payload: charm });
  };

  const updateCharm = (charm: Charm) => {
    dispatch({ type: "UPDATE_CHARM", payload: charm });
  };

  const deleteCharm = (id: string) => {
    dispatch({ type: "DELETE_CHARM", payload: id });
  };

  const deleteCharms = (ids: string[]) => {
    dispatch({ type: "BATCH_DELETE_CHARMS", payload: ids });
  };

  const getCharmById = (id: string) => {
    return state.charms.find((c) => c.id === id);
  };

  const importCharms = (charms: Charm[]) => {
    dispatch({ type: "IMPORT_CHARMS", payload: charms });
  };

  const resetCharms = async () => {
    try {
      // Fetch initial data from the public directory.
      const baseUrl = import.meta.env.BASE_URL;
      const response = await fetch(`${baseUrl}data/initial-charms.json`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const initialData = (await response.json()) as { charms: Charm[] };
      const initialCharms = initialData.charms;
      dispatch({ type: "SET_CHARMS", payload: initialCharms });
    } catch (error) {
      console.error("Failed to reset charms data:", error);
      dispatch({ type: "SET_ERROR", payload: "Failed to reset charms" });
    }
  };

  const value: CharmContextType = {
    ...state,
    enhancedCharms,
    addCharm,
    updateCharm,
    deleteCharm,
    deleteCharms,
    getCharmById,
    importCharms,
    resetCharms,
  };

  return (
    <CharmContext.Provider value={value}>{children}</CharmContext.Provider>
  );
}
