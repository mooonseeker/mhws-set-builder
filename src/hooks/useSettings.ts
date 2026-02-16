/**
 * @fileoverview Custom hook for managing application settings and related operations.
 */

import { useState } from "react";

import {
  DEFAULT_ACCESSORIES_PER_PAGE,
  DEFAULT_ARMOR_SERIES_PER_PAGE,
  DEFAULT_CHARMS_PER_PAGE,
  DEFAULT_SEARCH_RESULT_LIMIT,
  DEFAULT_SKILLS_PER_PAGE,
  DEFAULT_WEAPON_TYPE,
} from "@/constants";
import { DataStorage } from "@/services/storage";
import type { AppSettings } from "@/types";
import { toggleLimitBreakGlobal } from "@/utils";

/**
 * Hook to manage application settings, including persistence and UI state for confirmation dialogs.
 */
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const savedSettings = DataStorage.loadData<AppSettings>("settings")[0];
    const defaultSettings: AppSettings = {
      id: "app-settings",
      enableLimitBreak: false,
      skillsPerPage: DEFAULT_SKILLS_PER_PAGE,
      armorSeriesPerPage: DEFAULT_ARMOR_SERIES_PER_PAGE,
      charmsPerPage: DEFAULT_CHARMS_PER_PAGE,
      accessoriesPerPage: DEFAULT_ACCESSORIES_PER_PAGE,
      defaultWeaponType: DEFAULT_WEAPON_TYPE,
      searchResultLimit: DEFAULT_SEARCH_RESULT_LIMIT,
    };
    return { ...defaultSettings, ...savedSettings };
  });

  // UI States for dialogs
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isLimitBreakDialogOpen, setIsLimitBreakDialogOpen] = useState(false);
  const [pendingLimitBreak, setPendingLimitBreak] = useState(false);

  /**
   * Updates a specific setting and persists it.
   */
  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    DataStorage.saveData("settings", [newSettings]).catch(console.error);
  };

  /**
   * Toggles the limit break status for armor and reloads the page.
   */
  const handleLimitBreakToggle = async (checked: boolean) => {
    try {
      await toggleLimitBreakGlobal(checked);
      setSettings((prev) => ({ ...prev, enableLimitBreak: checked }));
      window.location.reload();
    } catch (error) {
      console.error("Failed to toggle limit break:", error);
      alert("操作失败，请重试。");
    }
  };

  /**
   * Clears all stored data and reloads the page.
   */
  const handleReset = () => {
    DataStorage.clearAll();
    window.location.reload();
  };

  return {
    settings,
    updateSetting,
    handleReset,
    handleLimitBreakToggle,
    // Dialog states and controls
    dialogs: {
      reset: {
        isOpen: isResetDialogOpen,
        setOpen: setIsResetDialogOpen,
      },
      limitBreak: {
        isOpen: isLimitBreakDialogOpen,
        setOpen: setIsLimitBreakDialogOpen,
        pendingValue: pendingLimitBreak,
        setPendingValue: setPendingLimitBreak,
      },
    },
  };
}
