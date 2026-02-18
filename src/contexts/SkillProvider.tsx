/**
 * @fileoverview Provides a global state for skills in the MHWS Set Builder.
 *
 * This provider manages the state of skills, including loading, saving,
 * and CRUD operations.
 */

import { useEffect, useReducer, useRef, type ReactNode } from "react";

import { DEFAULT_KEY_SKILL_IDS, STORAGE_KEYS } from "@/constants";
import { DataStorage } from "@/services/storage";
import type { Skill } from "@/types";

import { SkillContext, type SkillContextType } from "./SkillContext";

/**
 * Describes the state of skills.
 */
interface SkillState {
  /** The list of all available skills. */
  skills: Skill[];
  /** The list of IDs of skills that are marked as key skills. */
  keySkillIds: string[];
  /** True if the skills are currently being loaded. */
  loading: boolean;
  /** An error message if something went wrong, otherwise null. */
  error: string | null;
}

/**
 * Defines the actions that can be dispatched to modify the skill state.
 */
type SkillAction =
  | { type: "SET_SKILLS"; payload: Skill[] }
  | { type: "ADD_SKILL"; payload: Skill }
  | { type: "UPDATE_SKILL"; payload: Skill }
  | { type: "DELETE_SKILL"; payload: string }
  | { type: "IMPORT_SKILLS"; payload: Skill[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_KEY_SKILLS"; payload: string[] }
  | { type: "TOGGLE_KEY_SKILL"; payload: string };

/**
 * Reducer for skill state management.
 * Handles all state transitions for skills based on dispatched actions.
 */
function skillReducer(state: SkillState, action: SkillAction): SkillState {
  switch (action.type) {
    case "SET_SKILLS":
      return { ...state, skills: action.payload };
    case "ADD_SKILL":
      return { ...state, skills: [...state.skills, action.payload] };
    case "UPDATE_SKILL":
      return {
        ...state,
        skills: state.skills.map((s) =>
          s.id === action.payload.id ? action.payload : s,
        ),
      };
    case "DELETE_SKILL":
      return {
        ...state,
        skills: state.skills.filter((s) => s.id !== action.payload),
        keySkillIds: state.keySkillIds.filter((id) => id !== action.payload),
      };
    case "IMPORT_SKILLS":
      return { ...state, skills: action.payload, loading: false };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_KEY_SKILLS":
      return { ...state, keySkillIds: action.payload };
    case "TOGGLE_KEY_SKILL": {
      const isKey = state.keySkillIds.includes(action.payload);
      return {
        ...state,
        keySkillIds: isKey
          ? state.keySkillIds.filter((id) => id !== action.payload)
          : [...state.keySkillIds, action.payload],
      };
    }
    default:
      return state;
  }
}

/**
 * Provides the skill state to its children.
 *
 * This component manages the global state for skills, including:
 * - Loading initial data from DataStorage.
 * - Automatically persisting data to DataStorage.
 * - Providing methods for CRUD operations.
 *
 * @param children - The child components to be rendered within this provider.
 */
export function SkillProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(skillReducer, {
    skills: [],
    keySkillIds: [],
    loading: true,
    error: null,
  });

  // Used to track the initial render to avoid unnecessary saves.
  const isFirstRender = useRef(true);

  // Initialize state from DataStorage on mount.
  useEffect(() => {
    const init = async () => {
      try {
        const skills = DataStorage.loadData<Skill>("skills");
        dispatch({ type: "SET_SKILLS", payload: skills });

        // Load key skills from localStorage.
        const storedKeySkills = localStorage.getItem(STORAGE_KEYS.keySkills);
        let keySkillIds = DEFAULT_KEY_SKILL_IDS;

        if (storedKeySkills) {
          try {
            const parsed = JSON.parse(storedKeySkills) as string[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              keySkillIds = parsed;
            }
          } catch (e) {
            console.error("Failed to parse stored key skills:", e);
          }
        }
        
        dispatch({ type: "SET_KEY_SKILLS", payload: keySkillIds });
      } catch (error) {
        console.error("Failed to load skills from storage:", error);
        dispatch({ type: "SET_ERROR", payload: "Failed to load skills" });
        dispatch({ type: "SET_SKILLS", payload: [] });
        dispatch({ type: "SET_KEY_SKILLS", payload: DEFAULT_KEY_SKILL_IDS });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    void init();
  }, []);

  // Auto-save to DataStorage whenever skills change.
  useEffect(() => {
    if (state.loading) return;

    // Skip the very first render to prevent saving the initial empty state.
    if (isFirstRender.current) {
      return;
    }

    DataStorage.saveData("skills", state.skills).catch((error) => {
      console.error("Failed to save skills to storage:", error);
    });
  }, [state.skills, state.loading]);

  // Auto-save key skills to localStorage whenever they change.
  useEffect(() => {
    if (state.loading) return;

    if (isFirstRender.current) {
      // Once we've finished the initial load (indicated by loading: false),
      // we can allow subsequent saves.
      isFirstRender.current = false;
      return;
    }

    localStorage.setItem(
      STORAGE_KEYS.keySkills,
      JSON.stringify(state.keySkillIds),
    );
  }, [state.keySkillIds, state.loading]);

  const addSkill = (skill: Skill) => {
    // Prevent duplicate names (case-insensitive) and IDs.
    if (
      state.skills.some(
        (s) => s.name.trim().toLowerCase() === skill.name.trim().toLowerCase(),
      )
    ) {
      throw new Error(`Skill with name "${skill.name}" already exists.`);
    }
    if (state.skills.some((s) => s.id === skill.id)) {
      throw new Error(`Skill with ID "${skill.id}" already exists.`);
    }

    dispatch({ type: "ADD_SKILL", payload: skill });
  };

  const updateSkill = (skill: Skill) => {
    dispatch({ type: "UPDATE_SKILL", payload: skill });
  };

  const deleteSkill = (id: string) => {
    dispatch({ type: "DELETE_SKILL", payload: id });
  };

  const toggleKeySkill = (id: string) => {
    dispatch({ type: "TOGGLE_KEY_SKILL", payload: id });
  };

  const getSkillById = (id: string) => {
    return state.skills.find((s) => s.id === id);
  };

  const importSkills = (skills: Skill[]) => {
    dispatch({ type: "IMPORT_SKILLS", payload: skills });
  };

  const resetSkills = async () => {
    try {
      // Fetch initial data from the public directory.
      const baseUrl = import.meta.env.BASE_URL;
      const response = await fetch(`${baseUrl}data/initial-skills.json`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const initialData = (await response.json()) as { skills: Skill[] };
      const initialSkills = initialData.skills;
      dispatch({ type: "SET_SKILLS", payload: initialSkills });

      // Reset key skills to default.
      dispatch({
        type: "SET_KEY_SKILLS",
        payload: DEFAULT_KEY_SKILL_IDS,
      });
    } catch (error) {
      console.error("Failed to reset skills data:", error);
      dispatch({ type: "SET_ERROR", payload: "Failed to reset skills" });
    }
  };

  const value: SkillContextType = {
    ...state,
    addSkill,
    updateSkill,
    deleteSkill,
    toggleKeySkill,
    getSkillById,
    importSkills,
    resetSkills,
  };

  return (
    <SkillContext.Provider value={value}>{children}</SkillContext.Provider>
  );
}
