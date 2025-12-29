import { Award, ChevronDown, ChevronsDown, List } from "lucide-react";
import type { SkillCategory, SlotLevel } from "@/types";

/**
 * 技能分类标签映射
 */
export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  weapon: "武器技能",
  armor: "防具技能",
  series: "系列技能",
  group: "组合技能",
};

/**
 * 孔位等级标签映射
 */
export const SLOT_LEVEL_LABELS: Record<SlotLevel, string> = {
  [-1]: "无",
  1: "一级",
  2: "二级",
  3: "三级",
};

/**
 * 数据库列表页面的稀有度筛选配置
 */
export const RARITY_FILTERS = [
  { value: "all", icon: List, label: "全部" },
  { value: "low", icon: ChevronDown, label: "下位" },
  { value: "high", icon: ChevronsDown, label: "上位" },
  { value: "master", icon: Award, label: "大师位" },
] as const;
