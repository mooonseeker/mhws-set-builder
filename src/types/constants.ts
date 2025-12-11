/**
 * MHWS护石管理器 - 常量定义
 *
 * 包含应用中使用的所有常量
 */

import type { SkillCategory, SlotLevel } from "./index";

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
 *
 * 用于标识数据结构的版本，仅在数据结构发生不兼容变更时更新
 */
export const DATABASE_VERSION = "1.03.0";

/**
 * 数据库版本号存储键
 */
export const DATABASE_VERSION_KEY = `${APP_NAME}-db-version`;
