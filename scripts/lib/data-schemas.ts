/**
 * @fileoverview Defines Zod schemas for validating and transforming data
 * from CSV files into strongly-typed JSON objects for specific data types.
 */

import { z } from "zod";

import type {
  Accessory,
  Armor,
  Charm,
  Sharpness,
  Skill,
  Takumi,
  Weapon,
} from "../../src/types";
import {
  armorTypeSchema,
  boolFromString,
  intField,
  optionalAttributeFromString,
  optionalIntFromString,
  parseEquivalentSlots,
  parseOptionalFixedLengthTuple,
  parseResistanceTuple,
  parseSkillPairs,
  parseSlotList,
  skillCategoryFromString,
  slotLevelFromString,
  slotTypeFromString,
  weaponTypeSchema,
} from "./base-schemas.ts";

/**
 * Schema for a row in the skills CSV file.
 */
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

/**
 * Schema for a row in the accessories CSV file.
 */
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

/**
 * Schema for a row in the armor CSV file.
 */
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

/**
 * Schema for a row in the weapons CSV file.
 */
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

/**
 * Schema for a row in the charms CSV file.
 */
export const charmRowSchema: z.ZodType<Charm> = z
  .object({
    id: z.string(),
    name: z.string(),
    rarity: intField("rarity"),
    createdAt: z.string(),
    keySkillValue: intField("keySkillValue"),
    skills: z
      .string()
      .optional()
      .transform((v) => parseSkillPairs(v)),
    slots: z
      .string()
      .optional()
      .transform((v) => parseSlotList(v, "armor")),
    equivalentSlots: z.string().transform((v) => parseEquivalentSlots(v)),
  })
  .passthrough()
  .transform((row) => ({
    id: row.id,
    name: row.name,
    rarity: row.rarity,
    skills: row.skills,
    slots: row.slots,
    equivalentSlots: row.equivalentSlots,
    keySkillValue: row.keySkillValue,
    createdAt: row.createdAt,
  }));
