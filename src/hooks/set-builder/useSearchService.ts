/**
 * @fileoverview Logic for the automatic set search service.
 * Manages the state of skill requirements and orchestrates the worker-based search.
 */

import { useCallback, useState } from "react";

import {
  useAccessories,
  useArmor,
  useCharms,
  useSkills,
  useWeapon,
} from "@/hooks";
import { findOptimalSets } from "@/services/set-search";
import type {
  Accessory,
  EquipmentCellType,
  EquipmentSet,
  FinalSet,
  SkillWithLevel,
} from "@/types";

interface SearchServiceOptions {
  /** The current equipment set to use as a base for the search. */
  currentEquipmentSet: EquipmentSet;
  /** Defines which slots are fixed and should not be replaced. */
  lockedSlots: Record<EquipmentCellType, boolean>;
  /** Callback fired when a search successfully completes. */
  onSearchSuccess?: (results: FinalSet[]) => void;
}

/**
 * Manages the search service logic.
 * @param options Configuration options for the search service.
 * @returns The search state and methods.
 */
export function useSearchService({
  currentEquipmentSet,
  lockedSlots,
  onSearchSuccess,
}: SearchServiceOptions) {
  // Game data hooks
  const { armor } = useArmor();
  const { weapons } = useWeapon();
  const { accessories } = useAccessories();
  const { skills } = useSkills();
  const { charms } = useCharms();

  // Search state
  const [requiredSkills, setRequiredSkills] = useState<SkillWithLevel[]>([]);
  const [searchResults, setSearchResults] = useState<FinalSet[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchProgress, setSearchProgress] = useState<number | null>(null);
  const [searchStatus, setSearchStatus] = useState<string>("");

  const addRequiredSkill = (skill: SkillWithLevel) => {
    setRequiredSkills((prev) => {
      const existing = prev.find((s) => s.skillId === skill.skillId);
      if (existing) {
        return prev.map((s) =>
          s.skillId === skill.skillId ? { ...s, level: skill.level } : s,
        );
      }
      return [...prev, skill];
    });
  };

  const updateRequiredSkillLevel = (skillId: string, newLevel: number) => {
    if (newLevel <= 0) {
      setRequiredSkills((prev) => prev.filter((s) => s.skillId !== skillId));
    } else {
      setRequiredSkills((prev) =>
        prev.map((s) =>
          s.skillId === skillId ? { ...s, level: newLevel } : s,
        ),
      );
    }
  };

  const resetRequiredSkills = () => setRequiredSkills([]);

  const confirmSearch = useCallback(async (): Promise<void> => {
    const cleanedEquipmentSet: EquipmentSet = {};

    // Helper to strip accessories from non-locked equipment before search
    // or preserve locked equipment exactly as is.
    const processEq = (type: EquipmentCellType) => {
      const slottedEq = currentEquipmentSet[type];
      if (lockedSlots[type] && slottedEq) {
        return {
          equipment: slottedEq.equipment,
          // We reset accessories for the search context; the algorithm will refill them.
          // Note: If we want to support "fixed accessories", logic would change here.
          accessories: Array(slottedEq.equipment.slots.length).fill(
            null,
          ) as (Accessory | null)[],
        };
      }
      return undefined;
    };

    // Construct the fixed equipment set based on locked slots
    cleanedEquipmentSet.weapon = processEq("weapon") as EquipmentSet["weapon"];
    cleanedEquipmentSet.helm = processEq("helm") as EquipmentSet["helm"];
    cleanedEquipmentSet.body = processEq("body") as EquipmentSet["body"];
    cleanedEquipmentSet.arm = processEq("arm") as EquipmentSet["arm"];
    cleanedEquipmentSet.waist = processEq("waist") as EquipmentSet["waist"];
    cleanedEquipmentSet.leg = processEq("leg") as EquipmentSet["leg"];
    cleanedEquipmentSet.charm = processEq("charm") as EquipmentSet["charm"];

    // Ensure a default weapon exists if none is selected (required for slot calculations)
    if (!cleanedEquipmentSet.weapon) {
      const defaultWeapon = weapons.find((w) => w.id === "Rod_075");
      if (defaultWeapon) {
        cleanedEquipmentSet.weapon = {
          equipment: defaultWeapon,
          accessories: Array(defaultWeapon.slots.length).fill(
            null,
          ) as (Accessory | null)[],
        };
      }
    }

    setIsSearching(true);
    setSearchProgress(0);
    setSearchStatus("正在准备数据...");

    try {
      const results = await findOptimalSets(
        requiredSkills,
        cleanedEquipmentSet,
        { armors: armor, weapons, accessories, skills, charms },
        (current, total) => {
          const percentage = Math.round((current / total) * 100);
          setSearchProgress(percentage);
          setSearchStatus(`正在处理... ${current}/${total}`);
        },
      );
      setSearchResults(results);
      onSearchSuccess?.(results);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
      setSearchProgress(null);
      setSearchStatus("");
    }
  }, [
    requiredSkills,
    currentEquipmentSet,
    lockedSlots,
    armor,
    weapons,
    accessories,
    skills,
    charms,
    onSearchSuccess,
  ]);

  return {
    requiredSkills,
    searchResults,
    isSearching,
    searchProgress,
    searchStatus,
    addRequiredSkill,
    updateRequiredSkillLevel,
    resetRequiredSkills,
    confirmSearch,
    setSearchResults,
  };
}
