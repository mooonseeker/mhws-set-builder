import { z } from "zod";

import type {
  Accessory,
  Armor,
  ArmorType,
  AttributeType,
  Resistance,
  Sharpness,
  Skill,
  SkillCategory,
  SkillWithLevel,
  Slot,
  SlotLevel,
  SlotType,
  Takumi,
  Weapon,
  WeaponType,
} from "../../src/types";

/**
 * Helpers
 */

function parseIntStrict(value: string, field: string): number {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid integer for '${field}': '${value}'`);
  }
  return parsed;
}

function parseBoolLoose(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  throw new Error(`Invalid boolean: '${value}' (expected true|false)`);
}

function splitCsvList(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return [];
  return trimmed.split(",").map((s) => s.trim());
}

/**
 * database.meta.json
 */

export const databaseMetaSchema = z
  .object({
    version: z.string().min(1),
    skillsData: z.string().min(1),
    accessoriesData: z.string().min(1),
    armorData: z.string().min(1),
    weaponsData: z.string().min(1),

    // optional fields (kept for forward compatibility)
    dataType: z.string().optional(),
    skillsLastModified: z.string().optional(),
    accessoriesLastModified: z.string().optional(),
    armorLastModified: z.string().optional(),
    weaponsLastModified: z.string().optional(),
  })
  .passthrough();

export type DatabaseMeta = z.infer<typeof databaseMetaSchema>;

/**
 * Value-domain schemas
 */

export const slotLevelSchema: z.ZodType<SlotLevel> = z.union([
  z.literal(-1),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

const armorWeaponSlotLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

export const slotTypeSchema: z.ZodType<SlotType> = z.union([
  z.literal("weapon"),
  z.literal("armor"),
]);

export const skillCategorySchema: z.ZodType<SkillCategory> = z.union([
  z.literal("weapon"),
  z.literal("armor"),
  z.literal("series"),
  z.literal("group"),
]);

export const armorTypeSchema: z.ZodType<ArmorType> = z.union([
  z.literal("helm"),
  z.literal("body"),
  z.literal("arm"),
  z.literal("waist"),
  z.literal("leg"),
]);

export const weaponTypeSchema: z.ZodType<WeaponType> = z.union([
  z.literal("hammer"),
  z.literal("lance"),
  z.literal("long-sword"),
  z.literal("short-sword"),
  z.literal("tachi"),
  z.literal("twin-sword"),
  z.literal("charge-axe"),
  z.literal("gun-lance"),
  z.literal("rod"),
  z.literal("slash-axe"),
  z.literal("whistle"),
  z.literal("bow"),
  z.literal("heavy-bowgun"),
  z.literal("light-bowgun"),
]);

export const attributeTypeSchema: z.ZodType<AttributeType> = z.union([
  z.literal("fire"),
  z.literal("water"),
  z.literal("ice"),
  z.literal("elec"),
  z.literal("dragon"),
  z.literal("poison"),
  z.literal("sleep"),
  z.literal("blast"),
  z.literal("paralyse"),
]);

/**
 * Transforms
 */

export function parseSkillPairs(value: string | undefined): SkillWithLevel[] {
  if (!value) return [];
  const parts = splitCsvList(value);
  if (parts.length === 0) return [];

  const skills: SkillWithLevel[] = [];
  for (let i = 0; i < parts.length; i += 2) {
    const skillId = parts[i];
    const levelText = parts[i + 1];

    if (!skillId || skillId === "NONE") continue;
    if (!levelText) {
      // keep behavior close to current scripts: non-NONE id without level is invalid
      throw new Error(`Invalid skills pair: missing level for '${skillId}'`);
    }

    skills.push({
      skillId,
      level: parseIntStrict(levelText, "skills.level"),
    });
  }
  return skills;
}

export function parseSlotList(
  value: string | undefined,
  type: SlotType,
): Slot[] {
  if (!value) return [];
  const parts = splitCsvList(value);
  if (parts.length === 0) return [];

  const slots: Slot[] = [];
  for (const levelText of parts) {
    const level = parseIntStrict(levelText, "slots.level");
    if (level <= 0) continue;

    // For armor/weapon CSV, levels are expected to be 1..3.
    const slotLevel = armorWeaponSlotLevelSchema.parse(level);
    slots.push({ type, level: slotLevel });
  }
  return slots;
}

export function parseResistanceTuple(value: string): Resistance {
  const parsed: unknown = JSON.parse(value);
  const schema: z.ZodType<Resistance> = z
    .tuple([z.number(), z.number(), z.number(), z.number(), z.number()])
    .transform((t) => t as Resistance);
  return schema.parse(parsed);
}

export function parseNumberArray(value: string): number[] {
  const parts = splitCsvList(value);
  return parts.map((p, idx) => parseIntStrict(p, `numberArray[${idx}]`));
}

function parseOptionalFixedLengthTuple(
  value: string,
  length: number,
  field: string,
): number[] | undefined {
  if (value === "") return undefined;
  const arr = parseNumberArray(value);
  if (arr.length !== length) {
    throw new Error(
      `Invalid ${field}: expected length ${length}, got ${arr.length}`,
    );
  }
  return arr;
}

/**
 * Row schemas (CSV row -> strongly typed item)
 */

const intField = (field: string) =>
  z.preprocess(
    (v) => (typeof v === "string" ? parseIntStrict(v, field) : v),
    z.number().int(),
  );

const slotLevelFromString: z.ZodType<SlotLevel> = z.preprocess(
  (v) => (typeof v === "string" ? parseIntStrict(v, "slotLevel") : v),
  slotLevelSchema,
);

const slotTypeFromString: z.ZodType<SlotType> = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
  slotTypeSchema,
);

const skillCategoryFromString: z.ZodType<SkillCategory> = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
  skillCategorySchema,
);

const boolFromString: z.ZodType<boolean> = z.preprocess(
  (v) => (typeof v === "string" ? parseBoolLoose(v) : v),
  z.boolean(),
);

export const skillRowSchema: z.ZodType<Skill> = z
  .object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    description: z.string(),
    sortId: intField("sortId"),
    category: skillCategoryFromString,
    maxLevel: intField("maxLevel"),
    accessoryLevel: slotLevelFromString,
    isKey: boolFromString,
  })
  .passthrough()
  .transform((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description,
    sortId: row.sortId,
    category: row.category,
    maxLevel: row.maxLevel,
    accessoryLevel: row.accessoryLevel,
    isKey: row.isKey,
  }));

export const accessoryRowSchema: z.ZodType<Accessory> = z
  .object({
    id: z.string(),
    name: z.string(),
    type: slotTypeFromString,
    description: z.string(),
    sortID: intField("sortID"),
    skills: z
      .string()
      .optional()
      .transform((v) => parseSkillPairs(v)),
    rarity: intField("rarity"),
    slotLevel: slotLevelFromString,
    color: z.string(),
  })
  .passthrough()
  .transform((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description,
    sortID: row.sortID,
    skills: row.skills,
    rarity: row.rarity,
    slotLevel: row.slotLevel,
    color: row.color,
  }));

export const armorRowSchema: z.ZodType<Armor> = z
  .object({
    id: z.string(),
    name: z.string(),
    type: armorTypeSchema,
    description: z.string(),
    rarity: intField("rarity"),
    defense: intField("defense"),
    resistance: z.string().transform((v) => parseResistanceTuple(v)),
    series: z.string(),
    skills: z
      .string()
      .optional()
      .transform((v) => parseSkillPairs(v)),
    slots: z
      .string()
      .optional()
      .transform((v) => parseSlotList(v, "armor")),
  })
  .passthrough()
  .transform((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description,
    skills: row.skills,
    slots: row.slots,
    rarity: row.rarity,
    defense: row.defense,
    resistance: row.resistance,
    series: row.series,
  }));

const optionalAttributeFromString: z.ZodType<AttributeType | undefined> =
  z.preprocess((v) => {
    if (typeof v !== "string") return v;
    return v === "" ? undefined : v;
  }, attributeTypeSchema.optional());

const optionalIntFromString = (field: string) =>
  z
    .string()
    .transform((v) => (v === "" ? undefined : parseIntStrict(v, field)));

export const weaponRowSchema: z.ZodType<Weapon> = z
  .object({
    id: z.string(),
    name: z.string(),
    type: weaponTypeSchema,
    description: z.string(),
    sortId: intField("sortId"),
    skills: z
      .string()
      .optional()
      .transform((v) => parseSkillPairs(v)),
    slots: z
      .string()
      .optional()
      .transform((v) => parseSlotList(v, "weapon")),
    rarity: intField("rarity"),
    attack: intField("attack"),
    critical: intField("critical"),
    defense: intField("defense"),
    attribute: optionalAttributeFromString,
    attributeValue: optionalIntFromString("attributeValue"),
    subattribute: optionalAttributeFromString,
    subattributeValue: optionalIntFromString("subattributeValue"),
    sharpness: z
      .string()
      .transform((v) => parseOptionalFixedLengthTuple(v, 7, "sharpness"))
      .transform((v) => (v ? (v as Sharpness) : undefined)),
    takumi: z
      .string()
      .transform((v) => parseOptionalFixedLengthTuple(v, 4, "takumi"))
      .transform((v) => (v ? (v as Takumi) : undefined)),
  })
  .passthrough()
  .transform((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description,
    sortId: row.sortId,
    skills: row.skills,
    slots: row.slots,
    rarity: row.rarity,
    attack: row.attack,
    critical: row.critical,
    defense: row.defense,
    attribute: row.attribute,
    attributeValue: row.attributeValue,
    subattribute: row.subattribute,
    subattributeValue: row.subattributeValue,
    sharpness: row.sharpness,
    takumi: row.takumi,
  }));
