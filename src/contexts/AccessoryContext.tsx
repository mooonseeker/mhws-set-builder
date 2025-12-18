/**
 * MHWS护石管理器 - 装饰品Context定义
 *
 * 仅包含Context定义和类型，以避免React Fast Refresh警告
 */

import { createContext } from "react";
import type { Accessory } from "@/types";

/**
 * 装饰品状态类型
 */
interface AccessoryState {
  /** 装饰品列表 */
  accessories: Accessory[];
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
}

/**
 * 装饰品Context类型
 */
export interface AccessoryContextType extends AccessoryState {
  /** 添加装饰品 */
  addAccessory: (accessory: Accessory) => void;
  /** 更新装饰品 */
  updateAccessory: (accessory: Accessory) => void;
  /** 删除装饰品 */
  deleteAccessory: (id: string) => void;
  /** 根据ID获取装饰品 */
  getAccessoryById: (id: string) => Accessory | undefined;
  /** 批量导入装饰品 */
  importAccessories: (accessories: Accessory[]) => void;
  /** 重置装饰品为初始数据 */
  resetAccessories: () => Promise<void>;
}

/**
 * 装饰品Context
 */
export const AccessoryContext = createContext<AccessoryContextType | undefined>(
  undefined,
);
