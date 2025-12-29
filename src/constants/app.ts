/**
 * 应用级常量配置
 */

/**
 * 应用名称
 */
export const APP_NAME = "mhws-set-builder";

/**
 * 数据库版本号
 */
export const DATABASE_VERSION = "1.04.0";

/**
 * 数据库版本号存储键
 */
export const DATABASE_VERSION_KEY = `${APP_NAME}-db-version`;

/**
 * 数据存储的键名映射
 */
export const STORAGE_KEYS = {
  skills: `${APP_NAME}-skills`,
  accessories: `${APP_NAME}-accessories`,
  armor: `${APP_NAME}-armor`,
  weapons: `${APP_NAME}-weapons`,
  charms: `${APP_NAME}-charms`,
  settings: `${APP_NAME}-settings`,
} as const;

/**
 * 默认设置：技能列表每页显示数量
 */
export const DEFAULT_SKILLS_PER_PAGE = 16;

/**
 * 默认设置：装饰品列表每页显示数量
 */
export const DEFAULT_ACCESSORIES_PER_PAGE = 16;

/**
 * 默认设置：防具列表每页显示数量（系列数）
 */
export const DEFAULT_ARMOR_SERIES_PER_PAGE = 32;

/**
 * 默认设置：护石列表每页显示数量
 */
export const DEFAULT_CHARMS_PER_PAGE = 16;
