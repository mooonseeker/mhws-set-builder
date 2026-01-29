/**
 * @fileoverview Provides the state and logic for the Set Builder feature.
 *
 * This component manages the entire state for the set builder, including
 * manual equipment selection, automatic set searching, and state management
 * for the UI.
 */

import React, { useCallback, useState, type ReactNode } from "react";

import { cloneDeep } from "lodash-es";

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
  Armor,
  Charm,
  EquipmentCellType,
  EquipmentSet,
  FinalSet,
  SelectionContext,
  SkillWithLevel,
  Slot,
  SlottedEquipment,
  Weapon,
} from "@/types";

import { SetBuilderContext } from "./SetBuilderContext";

interface SetBuilderProviderProps {
  children: ReactNode;
}

/**
 * Provides the Set Builder state and actions to its children.
 * @param {SetBuilderProviderProps} props - The component props.
 * @returns {JSX.Element} The provider component.
 */
export const SetBuilderProvider: React.FC<SetBuilderProviderProps> = ({
  children,
}) => {
  const { armor } = useArmor();
  const { weapons } = useWeapon();
  const { accessories } = useAccessories();
  const { skills } = useSkills();
  const { charms } = useCharms();

  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [requiredSkills, setRequiredSkills] = useState<SkillWithLevel[]>([]);
  const [searchResults, setSearchResults] = useState<FinalSet[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchProgress, setSearchProgress] = useState<number | null>(null);
  const [searchStatus, setSearchStatus] = useState<string>("");
  const [currentEquipmentSet, setCurrentEquipmentSet] = useState<EquipmentSet>(
    {},
  );
  const [selectionContext, setSelectionContext] =
    useState<SelectionContext | null>(null);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [lockedSlots, setLockedSlots] = useState<
    Record<EquipmentCellType, boolean>
  >({
    weapon: false,
    helm: false,
    body: false,
    arm: false,
    waist: false,
    leg: false,
    charm: false,
  });
  const [autoModeView, setAutoModeViewState] = useState<
    "requirements" | "results" | "summary"
  >("requirements");
  const [isSearchConfirmOpen, setIsSearchConfirmOpen] = useState(false);

  const handleEqSlotClick = (type: EquipmentCellType) => {
    if (lockedSlots[type]) {
      return;
    }

    if (
      selectionContext?.type === "equipment" &&
      selectionContext.equipmentType === type
    ) {
      setSelectionContext(null);
    } else {
      setSelectionContext({ type: "equipment", equipmentType: type });
    }
  };

  const handleEqSelect = (item: Armor | Weapon | Charm) => {
    if (selectionContext?.type !== "equipment") return;

    const newSlottedEq = {
      equipment: item,
      accessories: Array(item.slots.length).fill(null) as (Accessory | null)[],
    };

    setCurrentEquipmentSet((prev) => ({
      ...prev,
      [selectionContext.equipmentType]: newSlottedEq,
    }));
    setSelectionContext(null);
  };

  const handleSlotClick = (
    slotType: EquipmentCellType,
    slotIndex: number,
    slot: Slot,
  ) => {
    setSelectionContext({ type: "accessory", slotType, slotIndex, slot });
  };

  const handleAccessorySelect = (accessory: Accessory) => {
    if (selectionContext?.type !== "accessory") return;

    const { slotType, slotIndex } = selectionContext;

    setCurrentEquipmentSet((prev) => {
      const newSet = { ...prev };
      const targetSlot = newSet[slotType as keyof EquipmentSet];
      if (targetSlot) {
        const newAccessories = [...targetSlot.accessories];
        newAccessories[slotIndex] = accessory;
        return {
          ...newSet,
          [slotType]: { ...targetSlot, accessories: newAccessories },
        };
      }
      return newSet;
    });

    setSelectionContext(null);
  };

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

  const startSearch = () => {
    const hasUnlockedItems = Object.entries(currentEquipmentSet).some(
      ([type, eq]) => eq && !lockedSlots[type as EquipmentCellType],
    );
    const hasAccessories = (
      Object.values(currentEquipmentSet) as (
        | SlottedEquipment<Weapon | Armor | Charm>
        | undefined
      )[]
    ).some((eq) =>
      eq?.accessories.some((acc: Accessory | null) => acc !== null),
    );

    if (hasUnlockedItems || hasAccessories) {
      setIsSearchConfirmOpen(true);
    } else {
      void confirmSearch();
    }
  };

  const cancelSearch = () => {
    setIsSearchConfirmOpen(false);
  };

  const confirmSearch = useCallback(async (): Promise<void> => {
    setIsSearchConfirmOpen(false);

    const cleanedEquipmentSet: EquipmentSet = {};

    // Process each slot type explicitly to ensure type safety
    const processEq = (type: EquipmentCellType) => {
      if (lockedSlots[type] && currentEquipmentSet[type]) {
        const slottedEq = currentEquipmentSet[type];
        const newSlottedEq = {
          equipment: slottedEq.equipment,
          accessories: Array(slottedEq.equipment.slots.length).fill(
            null,
          ) as (Accessory | null)[],
        };
        return newSlottedEq;
      }
      return undefined;
    };

    cleanedEquipmentSet.weapon = processEq("weapon") as
      | { equipment: Weapon; accessories: (Accessory | null)[] }
      | undefined;
    cleanedEquipmentSet.helm = processEq("helm") as
      | { equipment: Armor; accessories: (Accessory | null)[] }
      | undefined;
    cleanedEquipmentSet.body = processEq("body") as
      | { equipment: Armor; accessories: (Accessory | null)[] }
      | undefined;
    cleanedEquipmentSet.arm = processEq("arm") as
      | { equipment: Armor; accessories: (Accessory | null)[] }
      | undefined;
    cleanedEquipmentSet.waist = processEq("waist") as
      | { equipment: Armor; accessories: (Accessory | null)[] }
      | undefined;
    cleanedEquipmentSet.leg = processEq("leg") as
      | { equipment: Armor; accessories: (Accessory | null)[] }
      | undefined;
    cleanedEquipmentSet.charm = processEq("charm") as
      | { equipment: Charm; accessories: (Accessory | null)[] }
      | undefined;

    if (!cleanedEquipmentSet.weapon) {
      const defaultWeapon = weapons.find((w) => w.id === "Rod_075");
      if (!defaultWeapon) {
        console.error(
          'Default weapon "Rod_075" not found in the database. Please check data integrity.',
        );
        return;
      }
      cleanedEquipmentSet.weapon = {
        equipment: defaultWeapon,
        accessories: Array(defaultWeapon.slots.length).fill(
          null,
        ) as (Accessory | null)[],
      };
    }

    setCurrentEquipmentSet(cleanedEquipmentSet);

    console.log("Starting search with fixed equipment:", cleanedEquipmentSet);
    setIsSearching(true);
    setSearchProgress(0);
    setSearchStatus("正在准备数据...");
    setAutoModeView("results");

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
      console.log("Search completed with results:", results);
      setSearchResults(results);
    } catch (error) {
      console.error("An error occurred during search:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
      setSearchProgress(null);
      setSearchStatus("");
    }
  }, [
    requiredSkills,
    currentEquipmentSet,
    armor,
    weapons,
    accessories,
    skills,
    charms,
    lockedSlots,
  ]);

  const loadSetToBuilder = (finalSet: FinalSet) => {
    const newEquipmentSet = cloneDeep(finalSet.equipment);

    for (const key in newEquipmentSet) {
      const equipmentKey = key as keyof EquipmentSet;
      const slottedEquipment = newEquipmentSet[equipmentKey];

      if (slottedEquipment) {
        const equipmentId = slottedEquipment.equipment.id;
        const decorationsForEquipment =
          finalSet.accessories.get(equipmentId) ?? [];

        const newAccessories = Array(
          slottedEquipment.equipment.slots.length,
        ).fill(null) as (Accessory | null)[];
        decorationsForEquipment.forEach((acc, index) => {
          if (index < newAccessories.length) {
            newAccessories[index] = acc;
          }
        });

        slottedEquipment.accessories = newAccessories;
      }
    }

    setCurrentEquipmentSet(newEquipmentSet);

    // Lock all equipment slots after loading a set.
    const allLocked: Record<EquipmentCellType, boolean> = {
      weapon: true,
      helm: true,
      body: true,
      arm: true,
      waist: true,
      leg: true,
      charm: true,
    };
    setLockedSlots(allLocked);

    setAutoModeView("summary");
  };

  const toggleSlotLock = (type: EquipmentCellType) => {
    setLockedSlots((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const setAutoModeView = (view: "requirements" | "results" | "summary") => {
    setAutoModeViewState(view);
  };

  const clearEquipmentSlot = (type: EquipmentCellType) => {
    setCurrentEquipmentSet((prev) => {
      const newSet = { ...prev };
      // Only clear the slot if it is not locked.
      if (!lockedSlots[type]) {
        delete newSet[type];
      }
      return newSet;
    });
  };

  const resetBuilder = () => {
    setRequiredSkills([]);
    setSearchResults([]);

    // Only reset the unlocked equipment slots.
    setCurrentEquipmentSet((prev) => {
      const newSet = { ...prev };
      Object.keys(newSet).forEach((key) => {
        const equipmentType = key as EquipmentCellType;
        if (!lockedSlots[equipmentType]) {
          delete newSet[equipmentType];
        }
      });
      return newSet;
    });
  };

  const value = {
    mode,
    requiredSkills,
    searchResults,
    isSearching,
    searchProgress,
    searchStatus,
    currentEquipmentSet,
    selectionContext,
    isResultsModalOpen,
    lockedSlots,
    autoModeView,
    isSearchConfirmOpen,
    setMode,
    addRequiredSkill,
    updateRequiredSkillLevel,
    startSearch,
    confirmSearch,
    cancelSearch,
    loadSetToBuilder,
    handleEqSlotClick,
    handleEqSelect,
    handleSlotClick,
    handleAccessorySelect,
    setIsResultsModalOpen,
    toggleSlotLock,
    setAutoModeView,
    resetBuilder,
    clearEquipmentSlot,
  };

  return (
    <SetBuilderContext.Provider value={value}>
      {children}
    </SetBuilderContext.Provider>
  );
};
