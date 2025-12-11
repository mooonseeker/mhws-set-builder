import type {
  Accessory,
  Armor,
  Charm,
  Skill,
  SkillWithLevel,
  Slot,
  Weapon,
  ArmorType,
} from "@/types";

/** 装备栏类型 */
export type EquipmentCellType = ArmorType | "weapon" | "charm";

/** 带有镶嵌信息的装备槽 */
export interface SlottedEquipment<T extends Weapon | Armor | Charm> {
  equipment: T;
  accessories: (Accessory | null)[]; // 数组长度应与孔位数匹配
}

/** 一套完整的防具组合（不含武器和护石） */
export interface ArmorSet {
  helm?: Armor;
  body?: Armor;
  arm?: Armor;
  waist?: Armor;
  leg?: Armor;
}

/**
 * 一套完整的装备组合（包含武器、5件防具、护石）
 * 所有属性均为可选，以支持逐步配装
 */
export interface EquipmentSet {
  weapon?: SlottedEquipment<Weapon>;
  helm?: SlottedEquipment<Armor>;
  body?: SlottedEquipment<Armor>;
  arm?: SlottedEquipment<Armor>;
  waist?: SlottedEquipment<Armor>;
  leg?: SlottedEquipment<Armor>;
  charm?: SlottedEquipment<Charm>;
}

/**
 * 分类后的技能需求
 */
export interface CategorizedSkills {
  /** 系列技能 */
  seriesSkills: SkillWithLevel[];
  /** 组合技能 */
  groupSkills: SkillWithLevel[];
  /** 无法通过装饰品获得的防具/武器技能 */
  noAccessorySkills: SkillWithLevel[];
  /** 可通过装饰品获得的武器技能 */
  weaponSkills: SkillWithLevel[];
  /** 可通过装饰品获得的防具技能 */
  armorSkills: SkillWithLevel[];
}

/**
 * 特定技能的来源装备列表
 */
export interface SkillProviders {
  armors: Armor[];
  weapons: Weapon[];
  charms: Charm[];
  accessories: Accessory[];
}

/**
 * 搜索过程中的上下文信息
 */
export interface SearchContext {
  equipment: EquipmentSet;
  currentSkills: Map<string, number>;
  availableSlots: {
    weapon: Slot[];
    armor: Slot[];
  };
  skillDeficits: CategorizedSkills;
}

/** 预处理后的数据结构，用于快速查询 */
export interface PreprocessedData {
  skillProviderMap: Map<string, SkillProviders>;
  maxPotentialPerArmorType: Map<ArmorType, Map<string, number>>;
  accessoriesBySkill: Map<string, Accessory[]>;
  skillDetails: Map<string, Skill>;
}

/** 技能需求与当前装备提供技能的差值 */
export interface SkillDeficit {
  skillId: string;
  /** 还需要多少等级 */
  missingLevel: number;
}

/** 装饰品填充方案的结果 */
export interface AccessorySolution {
  /** 是否成功找到满足所有技能需求的装饰品方案 */
  isSuccess: boolean;
  /** 装饰品的具体放置方案，Key为装备ID，Value为镶嵌的装饰品列表 */
  placement: Map<string, Accessory[]>;
  /** 填充完毕后剩余的孔位 (已按类型分类) */
  remainingSlots: {
    weapon: Slot[];
    armor: Slot[];
  };
}

/**
 * 最终返回给用户的完整配装方案
 */
export interface FinalSet {
  /** 最终装备组合 */
  equipment: EquipmentSet;
  /** 使用的装饰品详情 */
  accessories: Map<string, Accessory[]>;
  /** 剩余的孔位 */
  remainingSlots: Slot[];
}
