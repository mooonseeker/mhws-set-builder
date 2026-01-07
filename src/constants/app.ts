/**
 * @fileoverview Application-level constant configurations.
 */

export const APP_NAME = "mhws-set-builder";

export const DATABASE_VERSION = "1.04.0";

export const DATABASE_VERSION_KEY = `${APP_NAME}-db-version`;

/** Key mapping for data storage. */
export const STORAGE_KEYS = {
  skills: `${APP_NAME}-skills`,
  accessories: `${APP_NAME}-accessories`,
  armor: `${APP_NAME}-armor`,
  weapons: `${APP_NAME}-weapons`,
  charms: `${APP_NAME}-charms`,
  settings: `${APP_NAME}-settings`,
} as const;

/** Key mapping for delta data storage. */
export const STORAGE_KEYS_DELTA = {
  skills: `${APP_NAME}-skills-delta`,
  accessories: `${APP_NAME}-accessories-delta`,
  armor: `${APP_NAME}-armor-delta`,
  weapons: `${APP_NAME}-weapons-delta`,
  charms: `${APP_NAME}-charms-delta`,
} as const;

export const DEFAULT_SKILLS_PER_PAGE = 16;

export const DEFAULT_ACCESSORIES_PER_PAGE = 16;

export const DEFAULT_ARMOR_SERIES_PER_PAGE = 32;

export const DEFAULT_CHARMS_PER_PAGE = 16;
