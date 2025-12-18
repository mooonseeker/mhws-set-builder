/**
 * MHWS护石管理器 - 武器Context定义
 *
 * 仅包含Context定义和类型，以避免React Fast Refresh警告
 */

import { createContext } from "react";
import type { Weapon } from "@/types";

/**
 * 武器状态类型
 */
interface WeaponState {
  /** 武器列表 */
  weapons: Weapon[];
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
}

/**
 * 武器Context类型
 */
export interface WeaponContextType extends WeaponState {
  /** 添加武器 */
  addWeapon: (weapon: Weapon) => void;
  /** 更新武器 */
  updateWeapon: (weapon: Weapon) => void;
  /** 删除武器 */
  deleteWeapon: (id: string) => void;
  /** 根据ID获取武器 */
  getWeaponById: (id: string) => Weapon | undefined;
  /** 批量导入武器 */
  importWeapons: (weapons: Weapon[]) => void;
  /** 重置武器为初始数据 */
  resetWeapons: () => Promise<void>;
}

/**
 * 武器Context
 */
export const WeaponContext = createContext<WeaponContextType | undefined>(
  undefined,
);
