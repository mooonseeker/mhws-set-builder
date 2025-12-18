/**
 * MHWS护石管理器 - 防具Context定义
 *
 * 仅包含Context定义和类型，以避免React Fast Refresh警告
 */

import { createContext } from "react";
import type { Armor } from "@/types";

/**
 * 防具状态类型
 */
interface ArmorState {
  /** 防具列表 */
  armor: Armor[];
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
}

/**
 * 防具Context类型
 */
export interface ArmorContextType extends ArmorState {
  /** 添加防具 */
  addArmor: (armor: Armor) => void;
  /** 更新防具 */
  updateArmor: (armor: Armor) => void;
  /** 删除防具 */
  deleteArmor: (id: string) => void;
  /** 根据ID获取防具 */
  getArmorById: (id: string) => Armor | undefined;
  /** 批量导入防具 */
  importArmor: (armor: Armor[]) => void;
  /** 重置防具为初始数据 */
  resetArmor: () => Promise<void>;
}

/**
 * 防具Context
 */
export const ArmorContext = createContext<ArmorContextType | undefined>(
  undefined,
);
