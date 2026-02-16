/**
 * @fileoverview Defines the context for global application settings.
 */

import { createContext } from "react";

import type { AppSettings } from "@/types";

/**
 * Defines the value shape for the SettingsContext.
 */
export interface SettingsContextType {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => void;
  handleReset: () => void;
  handleLimitBreakToggle: (checked: boolean) => Promise<void>;
  dialogs: {
    reset: {
      isOpen: boolean;
      setOpen: (open: boolean) => void;
    };
    limitBreak: {
      isOpen: boolean;
      setOpen: (open: boolean) => void;
      pendingValue: boolean;
      setPendingValue: (value: boolean) => void;
    };
  };
}

/**
 * Global context for application settings.
 */
export const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);
