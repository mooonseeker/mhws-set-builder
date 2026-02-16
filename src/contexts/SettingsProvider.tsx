/**
 * @fileoverview Provider for the SettingsContext.
 * Manages application-wide settings and persistence.
 */

import { useState, type ReactNode } from "react";

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

import { SettingsContext } from "./SettingsContext";

/**
 * Provides settings state and update functions to the application.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
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
    // Note: DataStorage.loadData already handles merging with defaults
    return savedSettings || defaultSettings;
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
    void DataStorage.saveData("settings", [newSettings]);
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

  const contextValue = {
    settings,
    updateSetting,
    handleReset,
    handleLimitBreakToggle,
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

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}
