/**
 * MHWS护石管理器 - 技能Provider
 *
 * 提供技能全局状态管理
 */

import type { ReactNode } from "react";
import { useEffect, useReducer, useRef } from "react";

import { DataStorage } from "@/services/DataStorage";
import type { Skill } from "@/types";

import { SkillContext } from "./SkillContext";
import type { SkillContextType } from "./SkillContext";

/**
 * 技能状态类型
 */
interface SkillState {
  /** 技能列表 */
  skills: Skill[];
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
}

/**
 * 技能Action类型
 */
type SkillAction =
  | { type: "SET_SKILLS"; payload: Skill[] }
  | { type: "ADD_SKILL"; payload: Skill }
  | { type: "UPDATE_SKILL"; payload: Skill }
  | { type: "DELETE_SKILL"; payload: string }
  | { type: "IMPORT_SKILLS"; payload: Skill[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };

/**
 * 技能Reducer
 *
 * 处理所有技能相关的状态变更
 */
function skillReducer(state: SkillState, action: SkillAction): SkillState {
  switch (action.type) {
    case "SET_SKILLS":
      return { ...state, skills: action.payload, loading: false };
    case "ADD_SKILL":
      return { ...state, skills: [...state.skills, action.payload] };
    case "UPDATE_SKILL":
      return {
        ...state,
        skills: state.skills.map((s) =>
          s.id === action.payload.id ? action.payload : s,
        ),
      };
    case "DELETE_SKILL":
      return {
        ...state,
        skills: state.skills.filter((s) => s.id !== action.payload),
      };
    case "IMPORT_SKILLS":
      return { ...state, skills: action.payload, loading: false };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

/**
 * 技能Provider组件
 *
 * 提供技能全局状态管理，包括：
 * - 从 DataStorage 加载初始数据
 * - 自动保存数据到 DataStorage
 * - 提供增删改查操作
 *
 * @param children - 子组件
 */
export function SkillProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(skillReducer, {
    skills: [],
    loading: true,
    error: null,
  });

  // 用于跟踪是否是首次渲染
  const isFirstRender = useRef(true);

  // 初始化：从 DataStorage 加载
  useEffect(() => {
    const skills = DataStorage.loadData<Skill>("skills");
    dispatch({ type: "SET_SKILLS", payload: skills });
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
        DataStorage.saveData("skills", state.skills);
      } catch (error) {
        console.error("保存技能数据失败:", error);
      }
    }
  }, [state.skills, state.loading]);

  /**
   * 添加技能
   *
   * @param skill - 技能数据（不包含ID）
   * @throws {Error} 如果技能名称已存在
   */
  const addSkill = (skill: Skill) => {
    // 检查名称是否重复（忽略大小写和前后空格）
    if (
      state.skills.some(
        (s) => s.name.trim().toLowerCase() === skill.name.trim().toLowerCase(),
      )
    ) {
      throw new Error(`技能 "${skill.name}" 已存在。`);
    }
    // 检查ID是否重复
    if (state.skills.some((s) => s.id === skill.id)) {
      throw new Error(`技能ID "${skill.id}" 已存在。`);
    }

    dispatch({ type: "ADD_SKILL", payload: skill });
  };

  /**
   * 更新技能
   *
   * @param skill - 完整的技能数据
   */
  const updateSkill = (skill: Skill) => {
    dispatch({ type: "UPDATE_SKILL", payload: skill });
  };

  /**
   * 删除技能
   *
   * @param id - 技能ID
   */
  const deleteSkill = (id: string) => {
    dispatch({ type: "DELETE_SKILL", payload: id });
  };

  /**
   * 根据ID获取技能
   *
   * @param id - 技能ID
   * @returns 技能对象，如果不存在则返回undefined
   */
  const getSkillById = (id: string) => {
    return state.skills.find((s) => s.id === id);
  };

  /**
   * 批量导入技能
   *
   * @param skills - 要导入的技能列表
   */
  const importSkills = (skills: Skill[]) => {
    dispatch({ type: "IMPORT_SKILLS", payload: skills });
  };

  /**
   * 重置技能为初始数据
   */
  const resetSkills = async () => {
    try {
      // 动态导入初始数据
      const initialData = await import("@/data/initial-skills.json");
      const initialSkills = initialData.default.skills as Skill[];
      dispatch({ type: "SET_SKILLS", payload: initialSkills });
    } catch (error) {
      console.error("重置技能数据失败:", error);
      dispatch({ type: "SET_ERROR", payload: "重置技能数据失败" });
    }
  };

  const value: SkillContextType = {
    ...state,
    addSkill,
    updateSkill,
    deleteSkill,
    getSkillById,
    importSkills,
    resetSkills,
  };

  return (
    <SkillContext.Provider value={value}>{children}</SkillContext.Provider>
  );
}
