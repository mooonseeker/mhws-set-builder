/**
 * @fileoverview UI-related constants and configurations.
 */

import { Award, ChevronDown, ChevronsDown, List } from "lucide-react";

import type {
  AttributeType,
  SkillCategory,
  SlotLevel,
  WeaponType,
} from "@/types";

/** Label mapping for skill categories. */
export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  weapon: "武器技能",
  armor: "防具技能",
  series: "系列技能",
  group: "组合技能",
};

/** Label mapping for slot levels. */
export const SLOT_LEVEL_LABELS: Record<SlotLevel, string> = {
  [-1]: "无",
  1: "一级",
  2: "二级",
  3: "三级",
};

/** Label mapping for weapon types. */
export const WEAPON_TYPE_LABELS: Record<WeaponType, string> = {
  "long-sword": "大剑",
  "short-sword": "片手剑",
  "twin-sword": "双剑",
  tachi: "太刀",
  hammer: "大锤",
  whistle: "狩猎笛",
  lance: "长枪",
  "gun-lance": "铳枪",
  "slash-axe": "斩斧",
  "charge-axe": "盾斧",
  rod: "操虫棍",
  bow: "弓",
  "heavy-bowgun": "重弩炮",
  "light-bowgun": "轻弩炮",
};

/** Label mapping for weapon attributes. */
export const ATTRIBUTE_TYPE_LABELS: Record<AttributeType, string> = {
  fire: "火",
  water: "水",
  ice: "冰",
  elec: "雷",
  dragon: "龙",
  poison: "毒",
  sleep: "睡眠",
  blast: "爆破",
  paralyse: "麻痹",
};

/** Rarity filter configurations for database list pages. */
export const RARITY_FILTERS = [
  { value: "all", icon: List, label: "全部" },
  { value: "low", icon: ChevronDown, label: "下位" },
  { value: "high", icon: ChevronsDown, label: "上位" },
  { value: "master", icon: Award, label: "大师位" },
] as const;
