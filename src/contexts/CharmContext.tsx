/**
 * MHWS护石管理器 - 护石Context
 *
 * 使用Context API + useReducer管理护石的全局状态
 */
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useReducer } from "react";

import { DataStorage } from "@/services/DataStorage";

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
 * 护石Context类型
 */
interface CharmContextType extends CharmState {
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
 * 护石Context
 */
const CharmContext = createContext<CharmContextType | undefined>(undefined);

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

    try {
      DataStorage.saveData("charms", state.charms);
    } catch (error) {
      console.error("保存护石数据失败:", error);
    }
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

/**
 * 使用护石Context的Hook
 *
 * @returns 护石Context
 * @throws {Error} 如果在CharmProvider外部使用
 *
 * @example
 * ```tsx
 * function CharmList() {
 *   const { charms, loading, addCharm, deleteCharm } = useCharms();
 *
 *   if (loading) return <div>加载中...</div>;
 *
 *   return (
 *     <div>
 *       {charms.map(charm => (
 *         <div key={charm.id}>
 *           稀有度: {charm.rarity}
 *           <button onClick={() => deleteCharm(charm.id)}>删除</button>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCharms() {
  const context = useContext(CharmContext);
  if (!context) {
    throw new Error("useCharms must be used within CharmProvider");
  }
  return context;
}
