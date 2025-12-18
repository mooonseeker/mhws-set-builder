/**
 * MHWS护石管理器 - 护石Context定义
 *
 * 仅包含Context定义和类型，以避免React Fast Refresh警告
 */
import { createContext } from "react";
import type { Charm } from "@/types";

/**
 * 护石状态类型
 */
interface CharmState {
  /** 护石列表 */
  charms: Charm[];
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
}

/**
 * 护石Context类型
 */
export interface CharmContextType extends CharmState {
  /** 添加护石 */
  addCharm: (charm: Charm) => void;
  /** 更新护石 */
  updateCharm: (charm: Charm) => void;
  /** 删除单个护石 */
  deleteCharm: (id: string) => void;
  /** 批量删除护石 */
  deleteCharms: (ids: string[]) => void;
  /** 根据ID获取护石 */
  getCharmById: (id: string) => Charm | undefined;
  /** 批量导入护石 */
  importCharms: (charms: Charm[]) => void;
  /** 重置护石为初始数据 */
  resetCharms: () => void;
}

/**
 * 护石Context
 */
export const CharmContext = createContext<CharmContextType | undefined>(
  undefined,
);
