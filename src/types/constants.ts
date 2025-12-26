/**
 * MHWS护石管理器 - 常量定义
 *
 * 包含应用中使用的所有常量
 */

import { Award, ChevronDown, ChevronsDown, List } from "lucide-react";

import type { SkillCategory, SlotLevel, WeaponType } from "./index";

/**
 * 应用名称
 */
export const APP_NAME = "mhws-charm-manager";

/**
 * 稀有度最小值
 */
export const RARITY_MIN = 1;

/**
 * 稀有度最大值
 */
export const RARITY_MAX = 12;

/**
 * 护石技能数量最小值
 */
export const CHARM_SKILLS_MIN = 1;

/**
 * 护石技能数量最大值
 */
export const CHARM_SKILLS_MAX = 3;

/**
 * 护石孔位数量最小值
 */
export const CHARM_SLOTS_MIN = 0;

/**
 * 护石孔位数量最大值
 */
export const CHARM_SLOTS_MAX = 3;

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
 * 核心技能价值阈值
 *
 * 用于判断护石是否低于平均水平
 */
export const KEY_SKILL_VALUE_THRESHOLD = 2;

/**
 * 技能列表每页显示数量
 */
export const SKILLS_PER_PAGE = 16;

/**
 * 防具列表每页显示数量（系列数）
 */
export const ARMOR_SERIES_PER_PAGE = 32;

/**
 * 护石列表每页显示数量
 */
export const CHARMS_PER_PAGE = 16;

/**
 * 数据存储的键名映射
 */
export const STORAGE_KEYS: Record<import("./index").DataId, string> = {
  skills: `${APP_NAME}-skills`,
  accessories: `${APP_NAME}-accessories`,
  armor: `${APP_NAME}-armor`,
  weapons: `${APP_NAME}-weapons`,
  charms: `${APP_NAME}-charms`,
} as const;

/**
 * 数据库版本号
 */
export const DATABASE_VERSION = "1.04.0";

/**
 * 数据库版本号存储键
 */
export const DATABASE_VERSION_KEY = `${APP_NAME}-db-version`;

/**
 * 武器类型列表
 */
/**
 * 稀有度范围定义
 */
export const RARITY_RANGES = {
  low: { min: 1, max: 4 },
  high: { min: 5, max: 8 },
  master: { min: 9, max: 12 },
  all: { min: 1, max: 12 },
} as const;

export type RarityRangeKey = keyof typeof RARITY_RANGES;

export const RARITY_FILTERS = [
  { value: "all", icon: List, label: "全部" },
  { value: "low", icon: ChevronDown, label: "下位" },
  { value: "high", icon: ChevronsDown, label: "上位" },
  { value: "master", icon: Award, label: "大师位" },
] as const;

/**
 * 武器类型列表
 */
export const WEAPON_TYPES: WeaponType[] = [
  "hammer",
  "lance",
  "long-sword",
  "short-sword",
  "tachi",
  "twin-sword",
  "charge-axe",
  "gun-lance",
  "rod",
  "slash-axe",
  "whistle",
  "bow",
  "heavy-bowgun",
  "light-bowgun",
];
