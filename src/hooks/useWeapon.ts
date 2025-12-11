import { useMemo } from "react";

import { DataStorage } from "@/services/DataStorage";

import type { Weapon } from "@/types";

/**
 * 武器数据管理 Hook
 *
 * 提供武器数据的加载和管理
 */
export function useWeapon() {
  return useMemo(() => {
    try {
      const weapons = DataStorage.loadData<Weapon>("weapons");
      return {
        weapons,
        loading: false,
        error: null,
      };
    } catch (error) {
      console.error("Failed to load weapons:", error);
      return {
        weapons: [],
        loading: false,
        error:
          error instanceof Error ? error : new Error("Failed to load weapons"),
      };
    }
  }, []);
}
