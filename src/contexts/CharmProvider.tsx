/**
 * MHWS护石管理器 - 护石Provider
 *
 * 提供护石全局状态管理
 */

import type { ReactNode } from "react";
import { useEffect, useReducer } from "react";

import { DataStorage } from "@/services/storage";
import type { Charm } from "@/types";

import { CharmContext } from "./CharmContext";
import type { CharmContextType } from "./CharmContext";

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
 * 护石Action类型
 */
type CharmAction =
  | { type: "SET_CHARMS"; payload: Charm[] }
  | { type: "ADD_CHARM"; payload: Charm }
  | { type: "UPDATE_CHARM"; payload: Charm }
  | { type: "DELETE_CHARM"; payload: string }
  | { type: "BATCH_DELETE_CHARMS"; payload: string[] }
  | { type: "IMPORT_CHARMS"; payload: Charm[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };

/**
 * 护石Reducer
 *
 * 处理所有护石相关的状态变更
 */
function charmReducer(state: CharmState, action: CharmAction): CharmState {
  switch (action.type) {
    case "SET_CHARMS":
      return { ...state, charms: action.payload, loading: false };
    case "ADD_CHARM":
      return { ...state, charms: [...state.charms, action.payload] };
    case "UPDATE_CHARM":
      return {
        ...state,
        charms: state.charms.map((c) =>
          c.id === action.payload.id ? action.payload : c,
        ),
      };
    case "DELETE_CHARM":
      return {
        ...state,
        charms: state.charms.filter((c) => c.id !== action.payload),
      };
    case "BATCH_DELETE_CHARMS":
      return {
        ...state,
        charms: state.charms.filter((c) => !action.payload.includes(c.id)),
      };
    case "IMPORT_CHARMS":
      return { ...state, charms: action.payload, loading: false };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

/**
 * 护石Provider组件
 *
 * 提供护石全局状态管理，包括：
 * - 从DataStorage加载初始数据
 * - 自动保存数据到DataStorage
 * - 提供增删改查操作
 * - 支持批量删除
 *
 * @param children - 子组件
 */
export function CharmProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(charmReducer, {
    charms: [],
    loading: true,
    error: null,
  });

  // 初始化：从DataStorage加载
  useEffect(() => {
    try {
      const savedCharms = DataStorage.loadData<Charm>("charms");
      dispatch({ type: "SET_CHARMS", payload: savedCharms });
    } catch (error) {
      console.error("加载护石数据失败:", error);
      dispatch({ type: "SET_ERROR", payload: "加载护石数据失败" });
      // 出错时也设置为空数组
      dispatch({ type: "SET_CHARMS", payload: [] });
    }
  }, []);

  // 自动保存到DataStorage
  // 仅当数据加载完成后才执行保存操作，避免保存初始的空状态
  useEffect(() => {
    if (state.loading) {
      return;
    }

    DataStorage.saveData("charms", state.charms).catch((error) => {
      console.error("保存护石数据失败:", error);
    });
  }, [state.charms, state.loading]);

  /**
   * 添加护石
   *
   * @param charm - 完整的护石数据（包含ID）
   */
  const addCharm = (charm: Charm) => {
    dispatch({ type: "ADD_CHARM", payload: charm });
  };

  /**
   * 更新护石
   *
   * @param charm - 完整的护石数据
   */
  const updateCharm = (charm: Charm) => {
    dispatch({ type: "UPDATE_CHARM", payload: charm });
  };

  /**
   * 删除单个护石
   *
   * @param id - 护石ID
   */
  const deleteCharm = (id: string) => {
    dispatch({ type: "DELETE_CHARM", payload: id });
  };

  /**
   * 批量删除护石
   *
   * @param ids - 护石ID数组
   */
  const deleteCharms = (ids: string[]) => {
    dispatch({ type: "BATCH_DELETE_CHARMS", payload: ids });
  };

  /**
   * 根据ID获取护石
   *
   * @param id - 护石ID
   * @returns 护石对象，如果不存在则返回undefined
   */
  const getCharmById = (id: string) => {
    return state.charms.find((c) => c.id === id);
  };

  /**
   * 批量导入护石
   *
   * @param charms - 要导入的护石列表
   */
  const importCharms = (charms: Charm[]) => {
    dispatch({ type: "IMPORT_CHARMS", payload: charms });
  };

  /**
   * 重置护石为初始数据
   */
  const resetCharms = () => {
    dispatch({ type: "SET_CHARMS", payload: [] });
  };

  const value: CharmContextType = {
    ...state,
    addCharm,
    updateCharm,
    deleteCharm,
    deleteCharms,
    getCharmById,
    importCharms,
    resetCharms,
  };

  return (
    <CharmContext.Provider value={value}>{children}</CharmContext.Provider>
  );
}
