/**
 * MHWS护石管理器 - 核心类型定义
 *
 * 本文件包含应用的所有核心TypeScript类型和接口定义
 */

/* 技能相关 */
/**
 * 技能分类枚举
 * - weapon: 武器技能
 * - armor: 防具技能
 * - series: 系列技能
 * - group: 组合技能
 */
export const SKILL_CATEGORIES = ["weapon", "armor", "series", "group"] as const;
export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

/**
 * 技能完整定义
 *
 * @property id - 技能唯一ID
 * @property name - 技能名称
 * @property category - 技能分类
 * @property maxLevel - 技能最大等级（1-7不等）
 * @property accessoryLevel - 装饰品等级（1-3）
 * @property isKey - 是否为核心技能
 * @property description - 技能描述
 * @property type - 技能类型（影响技能图标）
 * @property sortId - 排序ID
 */
export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  maxLevel: number;
  accessoryLevel: SlotLevel;
  isKey: boolean;
  description: string;
  type: string;
  sortId: number;
}

/**
 * 带等级的技能引用
 *
 * @property skillId - 技能ID（引用Skill.id）
 * @property level - 当前等级（1-maxLevel）
 */
export interface SkillWithLevel {
  skillId: string;
  level: number;
}

/* 孔位&装饰品相关 */
/**
 * 孔位类型
 * - weapon: 武器孔位
 * - armor: 防具孔位
 */
export const SLOT_TYPES = ["weapon", "armor"] as const;
export type SlotType = (typeof SLOT_TYPES)[number];

/**
 * 孔位等级（1-3级，-1表示特殊技能无装饰品）
 */
export type SlotLevel = -1 | 1 | 2 | 3;

/**
 * 孔位定义
 *
 * @property type - 孔位类型（武器/防具）
 * @property level - 孔位等级（1-3）
 */
export interface Slot {
  type: SlotType;
  level: SlotLevel;
  /** 孔位的来源装备ID（可选），用于回溯和结果组装 */
  sourceId?: string;
}

/**
 * 装饰品完整定义
 *
 * @property id - 装饰品唯一ID
 * @property name - 装饰品名称
 * @property type - 装饰品类型（weapon/armor）
 * @property description - 装饰品描述
 * @property sortID - 排序ID
 * @property skills - 技能列表
 * @property rarity - 稀有度
 * @property slotLevel - 镶嵌所需孔位等级
 * @property color - 图标颜色
 */
export interface Accessory {
  id: string;
  name: string;
  type: SlotType;
  description: string;
  sortID: number;
  skills: SkillWithLevel[];
  rarity: number;
  slotLevel: SlotLevel;
  color: string;
}

/* 防具相关 */
/**
 * 防具类型
 * - helm: 头部防具
 * - body: 身体防具
 * - arm: 手部防具
 * - waist: 腰部防具
 * - leg: 腿部防具
 */
export const ARMOR_TYPES = ["helm", "body", "arm", "waist", "leg"] as const;
export type ArmorType = (typeof ARMOR_TYPES)[number];

/**
 * 属性耐性
 * 五种属性耐性依次为：火、水、冰、雷、龙
 */
export type Resistance = [number, number, number, number, number];

/**
 * 防具完整定义
 *
 * @property id - 防具唯一ID
 * @property name - 防具名称
 * @property type - 防具类型（）
 * @property description - 防具描述
 * @property skills - 技能列表
 * @property slots - 孔位列表
 * @property rarity - 稀有度
 * @property defense - 防御
 * @property resistance - 属性耐性（五种属性耐性）
 * @property series - 防具系列
 */
export interface Armor {
  id: string;
  name: string;
  type: ArmorType;
  description: string;
  skills: SkillWithLevel[];
  slots: Slot[];
  rarity: number;
  defense: number;
  resistance: Resistance;
  series: string;
}

/**
 * 按系列分组的防具数据结构
 */
export interface GroupedArmor {
  series: string;
  helm?: Armor;
  body?: Armor;
  arm?: Armor;
  waist?: Armor;
  leg?: Armor;
  fullSetSkills: SkillWithLevel[];
}

/* 护石相关 */
/**
 * 护石完整定义
 *
 * @property id - 护石唯一ID
 * @property rarity - 稀有度（1-12）
 * @property skills - 技能列表（1-3个）
 * @property slots - 孔位列表（0-3个）
 * @property equivalentSlots - 等效孔位（根据技能和孔位计算得出）
 * @property keySkillValue - 核心技能价值（根据等效孔位计算得出）
 * @property createdAt - 创建时间（ISO 8601格式）
 */
export interface Charm {
  id: string;
  name: string;
  rarity: number;
  skills: SkillWithLevel[];
  slots: Slot[];
  equivalentSlots: EquivalentSlots;
  keySkillValue: number;
  createdAt: string;
}

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
 * 核心技能价值阈值
 *
 * 用于判断护石是否低于平均水平
 */
export const KEY_SKILL_VALUE_THRESHOLD = 2;

/**
 * 等效孔位统计
 *
 * 用于统计护石技能和孔位转换后的等效孔位数量
 *
 * @property weaponSlot1 - 1级武器孔位数量
 * @property weaponSlot2 - 2级武器孔位数量
 * @property weaponSlot3 - 3级武器孔位数量
 * @property armorSlot1 - 1级防具孔位数量
 * @property armorSlot2 - 2级防具孔位数量
 * @property armorSlot3 - 3级防具孔位数量
 */
export interface EquivalentSlots {
  weaponSlot1: number;
  weaponSlot2: number;
  weaponSlot3: number;
  armorSlot1: number;
  armorSlot2: number;
  armorSlot3: number;
}

/**
 * 护石验证状态
 *
 * - `ACCEPTED_AS_FIRST`: 数据库为空，直接接受
 * - `ACCEPTED_BY_MAX_VALUE`: 因核心价值最高而快速接受
 * - `ACCEPTED_BY_MAX_SLOTS`: 因等效孔位最高而快速接受
 * - `ACCEPTED_AS_UNIQUE_SKILL`: 因拥有独特的核心/高级技能而接受
 * - `ACCEPTED`: 通过详细比较后接受
 * - `REJECTED_AS_INFERIOR`: 因存在绝对更优的护石而被拒绝
 */
export type CharmValidationStatus =
  | "ACCEPTED_AS_FIRST"
  | "ACCEPTED_BY_MAX_VALUE"
  | "ACCEPTED_BY_MAX_SLOTS"
  | "ACCEPTED_AS_UNIQUE_SKILL"
  | "ACCEPTED"
  | "REJECTED_AS_INFERIOR";

/**
 * 护石验证结果
 *
 * @property isValid - 是否通过验证
 * @property status - 验证状态的枚举
 * @property warnings - （可选）警告消息列表
 * @property betterCharm - （可选）当 status 为 REJECTED_AS_INFERIOR 时提供，指更优的护石
 * @property outclassedCharms - （可选）当找到被完爆的护石时提供
 */
export interface CharmValidationResult {
  isValid: boolean;
  status: CharmValidationStatus;
  warnings?: string[];
  betterCharm?: Charm;
  outclassedCharms?: Charm[];
}

/**
 * 护石排序字段
 *
 * - keySkillValue: 核心技能价值
 * - rarity: 稀有度
 * - createdAt: 创建时间
 * - weaponSlot1/2/3: 武器孔位1/2/3级数量
 * - armorSlot1/2/3: 防具孔位1/2/3级数量
 */
export type CharmSortField =
  | "keySkillValue"
  | "rarity"
  | "createdAt"
  | "weaponSlot1"
  | "weaponSlot2"
  | "weaponSlot3"
  | "armorSlot1"
  | "armorSlot2"
  | "armorSlot3";

/* 武器相关 */
/**
 * 武器类型
 */
export const WEAPON_TYPES = [
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
] as const;
export type WeaponType = (typeof WEAPON_TYPES)[number];

/**
 * 属性/异常类型
 */
export const ATTRIBUTE_TYPES = [
  "fire",
  "water",
  "ice",
  "elec",
  "dragon",
  "poison",
  "sleep",
  "blast",
  "paralyse",
] as const;
export type AttributeType = (typeof ATTRIBUTE_TYPES)[number];

/**
 * 斩味定义
 * 斩味数组长度为7，依次代表 红、橙、黄、绿、蓝、白、紫 斩味的长度
 * 匠数组长度为4，依次代表匠技能(50刀)斩味的分布
 */
export type Sharpness = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];
export type Takumi = [number, number, number, number];

/**
 * 武器基础定义
 *
 * 适用武器：大剑、片手、大锤、太刀、长枪、双刀
 * 其它武器具有独有属性，但此版本先忽略独有属性
 *
 * @property id - 武器id
 * @property name - 武器名称
 * @property type - 武器类型
 * @property description - 武器描述
 * @property sortId - 排序id
 * @property skills - 技能列表（1-3个）
 * @property slots - 孔位列表（0-3个）
 * @property rarity - 稀有度（1-12）
 * @property attack - 攻击力
 * @property critical - 会心率
 * @property defense - 防御力
 * @property attribute - 属性类型（可选：无属性武器）
 * @property attributeValue - 属性值（可选：无属性武器）
 * @property subattribute - 副属性类型（可选：目前无双属性武器，保留作未来拓展）
 * @property subattributeValue - 副属性值（可选：目前无双属性武器，保留作未来拓展）
 * @property sharpness - 斩味（可选：远程武器无此属性）
 * @property takumi - 匠（可选：远程武器无此属性）
 */
export interface Weapon {
  id: string;
  name: string;
  type: WeaponType;
  description: string;
  sortId: number;
  skills: SkillWithLevel[];
  slots: Slot[];
  rarity: number;
  attack: number;
  critical: number;
  defense: number;
  attribute?: AttributeType;
  attributeValue?: number;
  subattribute?: AttributeType;
  subattributeValue?: number;
  sharpness?: Sharpness;
  takumi?: Takumi;
}

/* 装备通用 */
/**
 * 通用装备类型联合类型
 */
export type Equipment = Charm | Armor | Weapon;

/**
 * 稀有度范围定义
 */
export const RARITY_MIN = 1;
export const RARITY_MAX = 12;
export const RARITY_RANGES = {
  low: { min: 1, max: 4 },
  high: { min: 5, max: 8 },
  master: { min: 9, max: 12 },
  all: { min: 1, max: 12 },
} as const;
export type RarityRangeKey = keyof typeof RARITY_RANGES;

/* 其它类型 */
/**
 * 排序方向
 * - asc: 升序
 * - desc: 降序
 */
export type SortDirection = "asc" | "desc";

/**
 * 应用设置接口
 */
export interface AppSettings {
  id: "app-settings"; // 固定ID，用于DataStorage统一处理
  enableLimitBreak: boolean; // 是否开启防具极限突破
  skillsPerPage: number; // 技能列表每页显示数量
  armorSeriesPerPage: number; // 防具列表每页显示数量
  charmsPerPage: number; // 护石列表每页显示数量
  accessoriesPerPage: number; // 装饰品列表每页显示数量
}

/**
 * 支持的数据库ID类型
 */
export const ALL_DATA_IDS = [
  "skills",
  "accessories",
  "armor",
  "weapons",
  "charms",
  "settings",
] as const;
export type DataId = (typeof ALL_DATA_IDS)[number];

/**
 * 各种数据类型的联合类型
 */
export type DataItem = Skill | Accessory | Armor | Charm | Weapon | AppSettings;
