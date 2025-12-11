/**
 * MHWS护石管理器 - 防具Context
 *
 * 使用Context API + useReducer管理防具的全局状态
 */

import type { ReactNode } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";

import { DataStorage } from "@/services/DataStorage";

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
 * 防具Action类型
 */
type ArmorAction =
  | { type: "SET_ARMOR"; payload: Armor[] }
  | { type: "ADD_ARMOR"; payload: Armor }
  | { type: "UPDATE_ARMOR"; payload: Armor }
  | { type: "DELETE_ARMOR"; payload: string }
  | { type: "IMPORT_ARMOR"; payload: Armor[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };

/**
 * 防具Context类型
 */
interface ArmorContextType extends ArmorState {
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
  resetArmor: () => void;
}

/**
 * 防具Reducer
 *
 * 处理所有防具相关的状态变更
 */
function armorReducer(state: ArmorState, action: ArmorAction): ArmorState {
  switch (action.type) {
    case "SET_ARMOR":
      return { ...state, armor: action.payload, loading: false };
    case "ADD_ARMOR":
      return { ...state, armor: [...state.armor, action.payload] };
    case "UPDATE_ARMOR":
      return {
        ...state,
        armor: state.armor.map((a) =>
          a.id === action.payload.id ? action.payload : a,
        ),
      };
    case "DELETE_ARMOR":
      return {
        ...state,
        armor: state.armor.filter((a) => a.id !== action.payload),
      };
    case "IMPORT_ARMOR":
      return { ...state, armor: action.payload, loading: false };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

/**
 * 防具Context
 */
const ArmorContext = createContext<ArmorContextType | undefined>(undefined);

/**
 * 防具Provider组件
 *
 * 提供防具全局状态管理，包括：
 * - 从 DataStorage 加载初始数据
 * - 自动保存数据到 DataStorage
 * - 提供增删改查操作
 *
 * @param children - 子组件
 */
export function ArmorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(armorReducer, {
    armor: [],
    loading: true,
    error: null,
  });

  // 用于跟踪是否是首次渲染
  const isFirstRender = useRef(true);

  // 初始化：从 DataStorage 加载
  useEffect(() => {
    try {
      const armor = DataStorage.loadData<Armor>("armor");
      dispatch({ type: "SET_ARMOR", payload: armor });
    } catch (error) {
      console.error("加载防具数据失败:", error);
      dispatch({ type: "SET_ERROR", payload: "加载防具数据失败" });
      dispatch({ type: "SET_ARMOR", payload: [] });
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
        DataStorage.saveData("armor", state.armor);
      } catch (error) {
        console.error("保存防具数据失败:", error);
      }
    }
  }, [state.armor, state.loading]);

  /**
   * 添加防具
   *
   * @param armor - 防具数据
   */
  const addArmor = (armor: Armor) => {
    // 检查ID是否重复
    if (state.armor.some((a) => a.id === armor.id)) {
      throw new Error(`防具ID "${armor.id}" 已存在。`);
    }
    dispatch({ type: "ADD_ARMOR", payload: armor });
  };

  /**
   * 更新防具
   *
   * @param armor - 完整的防具数据
   */
  const updateArmor = (armor: Armor) => {
    dispatch({ type: "UPDATE_ARMOR", payload: armor });
  };

  /**
   * 删除防具
   *
   * @param id - 防具ID
   */
  const deleteArmor = (id: string) => {
    dispatch({ type: "DELETE_ARMOR", payload: id });
  };

  /**
   * 根据ID获取防具
   *
   * @param id - 防具ID
   * @returns 防具对象，如果不存在则返回undefined
   */
  const getArmorById = (id: string) => {
    return state.armor.find((a) => a.id === id);
  };

  /**
   * 批量导入防具
   * @param armor 要导入的防具列表
   */
  const importArmor = (armor: Armor[]) => {
    dispatch({ type: "IMPORT_ARMOR", payload: armor });
  };

  /**
   * 重置防具为初始数据
   */
  const resetArmor = async () => {
    try {
      // 动态导入初始数据
      const initialData = await import("@/data/initial-armor.json");
      const initialArmor = initialData.default.armor as Armor[];
      dispatch({ type: "SET_ARMOR", payload: initialArmor });
    } catch (error) {
      console.error("重置防具数据失败:", error);
      dispatch({ type: "SET_ERROR", payload: "重置防具数据失败" });
    }
  };

  const value: ArmorContextType = {
    ...state,
    addArmor,
    updateArmor,
    deleteArmor,
    getArmorById,
    importArmor,
    resetArmor,
  };

  return (
    <ArmorContext.Provider value={value}>{children}</ArmorContext.Provider>
  );
}

/**
 * 使用防具Context的Hook
 *
 * @returns 防具Context
 * @throws {Error} 如果在ArmorProvider外部使用
 *
 * @example
 * ```tsx
 * function ArmorList() {
 *   const { armor, loading, addArmor } = useArmor();
 *
 *   if (loading) return <div>加载中...</div>;
 *
 *   return (
 *     <div>
 *       {armor.map(armor => <div key={armor.id}>{armor.name}</div>)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useArmor() {
  const context = useContext(ArmorContext);
  if (!context) {
    throw new Error("useArmor must be used within ArmorProvider");
  }
  return context;
}
