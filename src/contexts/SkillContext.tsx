/**
 * MHWS护石管理器 - 技能Context定义
 *
 * 仅包含Context定义和类型，以避免React Fast Refresh警告
 */

import { createContext } from "react";
import type { Skill } from "@/types";

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
 * 技能Context类型
 */
export interface SkillContextType extends SkillState {
  /** 添加技能 */
  addSkill: (skill: Skill) => void;
  /** 更新技能 */
  updateSkill: (skill: Skill) => void;
  /** 删除技能 */
  deleteSkill: (id: string) => void;
  /** 根据ID获取技能 */
  getSkillById: (id: string) => Skill | undefined;
  /** 批量导入技能 */
  importSkills: (skills: Skill[]) => void;
  /** 重置技能为初始数据 */
  resetSkills: () => Promise<void>;
}

/**
 * 技能Context
 */
export const SkillContext = createContext<SkillContextType | undefined>(
  undefined,
);
