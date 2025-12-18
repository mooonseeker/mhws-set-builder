/**
 * MHWS护石管理器 - 武器Provider
 *
 * 提供武器全局状态管理
 */

import type { ReactNode } from "react";
import { useEffect, useReducer, useRef } from "react";

import { DataStorage } from "@/services/DataStorage";
import type { Weapon } from "@/types";

import { WeaponContext } from "./WeaponContext";
import type { WeaponContextType } from "./WeaponContext";

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
 * 武器Action类型
 */
type WeaponAction =
  | { type: "SET_WEAPONS"; payload: Weapon[] }
  | { type: "ADD_WEAPON"; payload: Weapon }
  | { type: "UPDATE_WEAPON"; payload: Weapon }
  | { type: "DELETE_WEAPON"; payload: string }
  | { type: "IMPORT_WEAPONS"; payload: Weapon[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };

/**
 * 武器Reducer
 *
 * 处理所有武器相关的状态变更
 */
function weaponReducer(state: WeaponState, action: WeaponAction): WeaponState {
  switch (action.type) {
    case "SET_WEAPONS":
      return { ...state, weapons: action.payload, loading: false };
    case "ADD_WEAPON":
      return { ...state, weapons: [...state.weapons, action.payload] };
    case "UPDATE_WEAPON":
      return {
        ...state,
        weapons: state.weapons.map((w) =>
          w.id === action.payload.id ? action.payload : w,
        ),
      };
    case "DELETE_WEAPON":
      return {
        ...state,
        weapons: state.weapons.filter((w) => w.id !== action.payload),
      };
    case "IMPORT_WEAPONS":
      return { ...state, weapons: action.payload, loading: false };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

/**
 * 武器Provider组件
 *
 * 提供武器全局状态管理，包括：
 * - 从 DataStorage 加载初始数据
 * - 自动保存数据到 DataStorage
 * - 提供增删改查操作
 *
 * @param children - 子组件
 */
export function WeaponProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(weaponReducer, {
    weapons: [],
    loading: true,
    error: null,
  });

  // 用于跟踪是否是首次渲染
  const isFirstRender = useRef(true);

  // 初始化：从 DataStorage 加载
  useEffect(() => {
    try {
      const weapons = DataStorage.loadData<Weapon>("weapons");
      dispatch({ type: "SET_WEAPONS", payload: weapons });
    } catch (error) {
      console.error("加载武器数据失败:", error);
      dispatch({ type: "SET_ERROR", payload: "加载武器数据失败" });
      dispatch({ type: "SET_WEAPONS", payload: [] });
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
      try {
        DataStorage.saveData("weapons", state.weapons);
      } catch (error) {
        console.error("保存武器数据失败:", error);
      }
    }
  }, [state.weapons, state.loading]);

  /**
   * 添加武器
   *
   * @param weapon - 武器数据
   */
  const addWeapon = (weapon: Weapon) => {
    // 检查ID是否重复
    if (state.weapons.some((w) => w.id === weapon.id)) {
      throw new Error(`武器ID "${weapon.id}" 已存在。`);
    }
    dispatch({ type: "ADD_WEAPON", payload: weapon });
  };

  /**
   * 更新武器
   *
   * @param weapon - 完整的武器数据
   */
  const updateWeapon = (weapon: Weapon) => {
    dispatch({ type: "UPDATE_WEAPON", payload: weapon });
  };

  /**
   * 删除武器
   *
   * @param id - 武器ID
   */
  const deleteWeapon = (id: string) => {
    dispatch({ type: "DELETE_WEAPON", payload: id });
  };

  /**
   * 根据ID获取武器
   *
   * @param id - 武器ID
   * @returns 武器对象，如果不存在则返回undefined
   */
  const getWeaponById = (id: string) => {
    return state.weapons.find((w) => w.id === id);
  };

  /**
   * 批量导入武器
   * @param weapons 要导入的武器列表
   */
  const importWeapons = (weapons: Weapon[]) => {
    dispatch({ type: "IMPORT_WEAPONS", payload: weapons });
  };

  /**
   * 重置武器为初始数据
   */
  const resetWeapons = async () => {
    try {
      // 动态导入初始数据
      const initialData = await import("@/data/initial-weapons.json");
      const initialWeapons = initialData.default.weapons as Weapon[];
      dispatch({ type: "SET_WEAPONS", payload: initialWeapons });
    } catch (error) {
      console.error("重置武器数据失败:", error);
      dispatch({ type: "SET_ERROR", payload: "重置武器数据失败" });
    }
  };

  const value: WeaponContextType = {
    ...state,
    addWeapon,
    updateWeapon,
    deleteWeapon,
    getWeaponById,
    importWeapons,
    resetWeapons,
  };

  return (
    <WeaponContext.Provider value={value}>{children}</WeaponContext.Provider>
  );
}
