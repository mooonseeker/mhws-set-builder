/**
 * @fileoverview Defines base Zod schemas, helper functions, and transform
 * functions for processing CSV data. These are used as building blocks for
 * more specific data schemas.
 */

import { z } from "zod";

import type {
  ArmorType,
  AttributeType,
  Resistance,
  SkillCategory,
  SkillWithLevel,
  Slot,
  SlotLevel,
  SlotType,
  WeaponType,
} from "../../src/types";

// MARK: Helpers

/**
 * Parses a string into an integer, throwing an error if parsing fails.
 * @param value The string to parse.
 * @param field The name of the field being parsed, for error messages.
 * @returns The parsed number.
 */
export function parseIntStrict(value: string, field: string): number {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid integer for '${field}': '${value}'`);
  }
  return parsed;
}

/**
 * Parses a string into a boolean, supporting 'true' and 'false' case-insensitively.
 * @param value The string to parse.
 * @returns The parsed boolean.
 */
export function parseBoolLoose(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  throw new Error(`Invalid boolean: '${value}' (expected true|false)`);
}

/**
 * Splits a comma-separated string into an array of trimmed strings.
 * @param value The string to split.
 * @returns An array of strings.
 */
export function splitCsvList(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return [];
  return trimmed.split(",").map((s) => s.trim());
}

// MARK: Metadata Schema

/**
 * Schema for the `database.meta.json` file.
 */
export const databaseMetaSchema = z
  .object({
    version: z.string().min(1),
    skillsData: z.string().min(1),
    accessoriesData: z.string().min(1),
    armorData: z.string().min(1),
    weaponsData: z.string().min(1),
    charmsData: z.string().min(1).optional(),

    // Optional fields for forward compatibility.
    dataType: z.string().optional(),
    skillsLastModified: z.string().optional(),
    accessoriesLastModified: z.string().optional(),
    armorLastModified: z.string().optional(),
    weaponsLastModified: z.string().optional(),
  })
  .passthrough();

export type DatabaseMeta = z.infer<typeof databaseMetaSchema>;

// MARK: Value-Domain Schemas

/** Schema for slot levels, including -1 for special cases. */
export const slotLevelSchema: z.ZodType<SlotLevel> = z.union([
  z.literal(-1),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

/** Schema for armor and weapon slot levels (1-3). */
export const armorWeaponSlotLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);

/** Schema for slot types ('weapon' or 'armor'). */
export const slotTypeSchema: z.ZodType<SlotType> = z.union([
  z.literal("weapon"),
  z.literal("armor"),
]);

/** Schema for skill categories. */
export const skillCategorySchema: z.ZodType<SkillCategory> = z.union([
  z.literal("weapon"),
  z.literal("armor"),
  z.literal("series"),
  z.literal("group"),
]);

/** Schema for armor types (helm, body, etc.). */
export const armorTypeSchema: z.ZodType<ArmorType> = z.union([
  z.literal("helm"),
  z.literal("body"),
  z.literal("arm"),
  z.literal("waist"),
  z.literal("leg"),
]);

/** Schema for weapon types. */
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

/** Schema for attribute types (elemental, status, etc.). */
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

// MARK: Transforms

/**
 * Parses a CSV string of skill pairs (e.g., "skill1,1,skill2,2") into an array of objects.
 * @param value The raw string value from the CSV.
 * @returns An array of `SkillWithLevel` objects.
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
      // Maintain behavior: a non-NONE skill ID must have a level.
      throw new Error(`Invalid skills pair: missing level for '${skillId}'`);
    }

    skills.push({
      skillId,
      level: parseIntStrict(levelText, "skills.level"),
    });
  }
  return skills;
}

/**
 * Parses a CSV string of slot levels (e.g., "1,2,3") into an array of Slot objects.
 * @param value The raw string value from the CSV.
 * @param type The type of slot ('weapon' or 'armor').
 * @returns An array of `Slot` objects.
 */
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

    // For armor/weapon CSV, levels are expected to be 1-3.
    const slotLevel = armorWeaponSlotLevelSchema.parse(level);
    slots.push({ type, level: slotLevel });
  }
  return slots;
}

/**
 * Parses a JSON-formatted tuple string (e.g., "[0,1,2,3,4]") into a Resistance array.
 * @param value The JSON string.
 * @returns A `Resistance` tuple.
 */
export function parseResistanceTuple(value: string): Resistance {
  const parsed: unknown = JSON.parse(value);
  const schema: z.ZodType<Resistance> = z
    .tuple([z.number(), z.number(), z.number(), z.number(), z.number()])
    .transform((t) => t as Resistance);
  return schema.parse(parsed);
}

/**
 * Parses a CSV string of numbers into a number array.
 * @param value The CSV string.
 * @returns An array of numbers.
 */
export function parseNumberArray(value: string): number[] {
  const parts = splitCsvList(value);
  return parts.map((p, idx) => parseIntStrict(p, `numberArray[${idx}]`));
}

/**
 * Parses an optional, fixed-length CSV string of numbers.
 * @param value The CSV string.
 * @param length The expected length of the array.
 * @param field The name of the field for error messages.
 * @returns A number array or undefined if the input is empty.
 */
export function parseOptionalFixedLengthTuple(
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

// MARK: Row Schemas Helpers (CSV row -> strongly typed item)

/** A Zod preprocessor to parse a string field into an integer. */
export const intField = (field: string) =>
  z.preprocess(
    (v) => (typeof v === "string" ? parseIntStrict(v, field) : v),
    z.number().int(),
  );

/** A Zod preprocessor to parse a string into a `SlotLevel`. */
export const slotLevelFromString: z.ZodType<SlotLevel> = z.preprocess(
  (v) => (typeof v === "string" ? parseIntStrict(v, "slotLevel") : v),
  slotLevelSchema,
);

/** A Zod preprocessor to parse a string into a `SlotType`. */
export const slotTypeFromString: z.ZodType<SlotType> = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
  slotTypeSchema,
);

/** A Zod preprocessor to parse a string into a `SkillCategory`. */
export const skillCategoryFromString: z.ZodType<SkillCategory> = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
  skillCategorySchema,
);

/** A Zod preprocessor to parse a string into a boolean. */
export const boolFromString: z.ZodType<boolean> = z.preprocess(
  (v) => (typeof v === "string" ? parseBoolLoose(v) : v),
  z.boolean(),
);

/** A Zod preprocessor to parse an optional, empty-string-as-undefined attribute type. */
export const optionalAttributeFromString: z.ZodType<AttributeType | undefined> =
  z.preprocess((v) => {
    if (typeof v !== "string") return v;
    return v === "" ? undefined : v;
  }, attributeTypeSchema.optional());

/** A Zod preprocessor to parse an optional, empty-string-as-undefined integer. */
export const optionalIntFromString = (field: string) =>
  z
    .string()
    .transform((v) => (v === "" ? undefined : parseIntStrict(v, field)));
