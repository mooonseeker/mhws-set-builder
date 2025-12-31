/**
 * MHWS护石管理器 - 装饰品Provider
 *
 * 提供装饰品全局状态管理
 */

import type { ReactNode } from "react";
import { useEffect, useReducer, useRef } from "react";

import { DataStorage } from "@/services/storage";
import type { Accessory } from "@/types";

import { AccessoryContext } from "./AccessoryContext";
import type { AccessoryContextType } from "./AccessoryContext";

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
 * 装饰品Action类型
 */
type AccessoryAction =
  | { type: "SET_ACCESSORIES"; payload: Accessory[] }
  | { type: "ADD_ACCESSORY"; payload: Accessory }
  | { type: "UPDATE_ACCESSORY"; payload: Accessory }
  | { type: "DELETE_ACCESSORY"; payload: string }
  | { type: "IMPORT_ACCESSORIES"; payload: Accessory[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };

/**
 * 装饰品Reducer
 *
 * 处理所有装饰品相关的状态变更
 */
function accessoryReducer(
  state: AccessoryState,
  action: AccessoryAction,
): AccessoryState {
  switch (action.type) {
    case "SET_ACCESSORIES":
      return { ...state, accessories: action.payload, loading: false };
    case "ADD_ACCESSORY":
      return { ...state, accessories: [...state.accessories, action.payload] };
    case "UPDATE_ACCESSORY":
      return {
        ...state,
        accessories: state.accessories.map((a) =>
          a.id === action.payload.id ? action.payload : a,
        ),
      };
    case "DELETE_ACCESSORY":
      return {
        ...state,
        accessories: state.accessories.filter((a) => a.id !== action.payload),
      };
    case "IMPORT_ACCESSORIES":
      return { ...state, accessories: action.payload, loading: false };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

/**
 * 装饰品Provider组件
 *
 * 提供装饰品全局状态管理，包括：
 * - 从 DataStorage 加载初始数据
 * - 自动保存数据到 DataStorage
 * - 提供增删改查操作
 *
 * @param children - 子组件
 */
export function AccessoryProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(accessoryReducer, {
    accessories: [],
    loading: true,
    error: null,
  });

  // 用于跟踪是否是首次渲染
  const isFirstRender = useRef(true);

  // 初始化：从 DataStorage 加载
  useEffect(() => {
    try {
      const accessories = DataStorage.loadData<Accessory>("accessories");
      dispatch({ type: "SET_ACCESSORIES", payload: accessories });
    } catch (error) {
      console.error("加载装饰品数据失败:", error);
      dispatch({ type: "SET_ERROR", payload: "加载装饰品数据失败" });
      dispatch({ type: "SET_ACCESSORIES", payload: [] });
    }
  }, []);

  // 自动保存到 DataStorage（避免初始化时的不必要保存）
  useEffect(() => {
    // 跳过首次渲染
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!state.loading) {
      DataStorage.saveData("accessories", state.accessories).catch((error) => {
        console.error("保存装饰品数据失败:", error);
      });
    }
  }, [state.accessories, state.loading]);

  /**
   * 添加装饰品
   *
   * @param accessory - 装饰品数据
   */
  const addAccessory = (accessory: Accessory) => {
    // 检查ID是否重复
    if (state.accessories.some((a) => a.id === accessory.id)) {
      throw new Error(`装饰品ID "${accessory.id}" 已存在。`);
    }
    dispatch({ type: "ADD_ACCESSORY", payload: accessory });
  };

  /**
   * 更新装饰品
   *
   * @param accessory - 完整的装饰品数据
   */
  const updateAccessory = (accessory: Accessory) => {
    dispatch({ type: "UPDATE_ACCESSORY", payload: accessory });
  };

  /**
   * 删除装饰品
   *
   * @param id - 装饰品ID
   */
  const deleteAccessory = (id: string) => {
    dispatch({ type: "DELETE_ACCESSORY", payload: id });
  };

  /**
   * 根据ID获取装饰品
   *
   * @param id - 装饰品ID
   * @returns 装饰品对象，如果不存在则返回undefined
   */
  const getAccessoryById = (id: string) => {
    return state.accessories.find((a) => a.id === id);
  };

  /**
   * 批量导入装饰品
   * @param accessories 要导入的装饰品列表
   */
  const importAccessories = (accessories: Accessory[]) => {
    dispatch({ type: "IMPORT_ACCESSORIES", payload: accessories });
  };

  /**
   * 重置装饰品为初始数据
   */
  const resetAccessories = async () => {
    try {
      // 动态导入初始数据
      const initialData = await import("@/data/initial-accessories.json");
      const initialAccessories = initialData.default.accessories as Accessory[];
      dispatch({ type: "SET_ACCESSORIES", payload: initialAccessories });
    } catch (error) {
      console.error("重置装饰品数据失败:", error);
      dispatch({ type: "SET_ERROR", payload: "重置装饰品数据失败" });
    }
  };

  const value: AccessoryContextType = {
    ...state,
    addAccessory,
    updateAccessory,
    deleteAccessory,
    getAccessoryById,
    importAccessories,
    resetAccessories,
  };

  return (
    <AccessoryContext.Provider value={value}>
      {children}
    </AccessoryContext.Provider>
  );
}
