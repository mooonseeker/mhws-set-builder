/**
 * @fileoverview Orchestrates the generation of the initial database.
 * This script processes CSV files for skills, accessories, armor, weapons,
 * and charms, validates them against Zod schemas, and outputs JSON files.
 * It serves as the main entry point for the data generation process.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import type { ZodType } from "zod";

import type {
  Accessory,
  Armor,
  Charm,
  Skill,
  Weapon,
} from "../src/types/index.ts";
import { databaseMetaSchema, type DatabaseMeta } from "./lib/base-schemas.ts";
import { generateFromCsv } from "./lib/csv-json.ts";
import {
  accessoryRowSchema,
  armorRowSchema,
  charmRowSchema,
  skillRowSchema,
  weaponRowSchema,
} from "./lib/data-schemas.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const metaFilePath = path.resolve(__dirname, "../src/data/database.meta.json");

/**
 * Configuration for a single data generation task.
 */
interface GenerationTask<TItem> {
  name: string;
  dataType: string;
  outputFileName: string;
  getCsvPathFromMeta: (meta: DatabaseMeta) => string | undefined;
  rowSchema: ZodType<TItem>;
  sortFn: (a: TItem, b: TItem) => number;
}

/**
 * Executes a single data generation task.
 * Using a generic function ensures type safety between the row schema,
 * the sort function, and the processed items without resorting to 'any'.
 */
async function processTask<TItem>(task: GenerationTask<TItem>): Promise<void> {
  console.log(`Generating ${task.name}...`);

  const { meta, items } = await generateFromCsv<TItem, DatabaseMeta>({
    scriptName: `generate-${task.name}`,
    metaFilePath,
    metaSchema: databaseMetaSchema,
    getCsvPathFromMeta: (m) => {
      const csvPath = task.getCsvPathFromMeta(m);
      if (!csvPath) {
        throw new Error(`${task.name}Data not defined in meta file`);
      }
      return csvPath;
    },
    rowSchema: task.rowSchema,
  });

  const sortedItems = items.sort(task.sortFn);

  const finalJson = {
    version: meta.version,
    exportedAt: new Date().toISOString(),
    dataType: task.dataType,
    [task.dataType]: sortedItems,
  };

  const outputFilePath = path.resolve(
    __dirname,
    `../src/data/${task.outputFileName}`,
  );
  fs.writeFileSync(outputFilePath, JSON.stringify(finalJson, null, 2));
  console.log(`Successfully generated ${sortedItems.length} ${task.name}`);
}

/**
 * Main function to generate the complete database.
 */
async function main(): Promise<void> {
  console.log("Starting database generation...");

  try {
    /**
     * Define an array of task runners. Each runner is a closure that calls
     * processTask with a specific type, preserving type safety for each task.
     */
    const taskRunners: (() => Promise<void>)[] = [
      () =>
        processTask<Skill>({
          name: "skills",
          dataType: "skills",
          outputFileName: "initial-skills.json",
          getCsvPathFromMeta: (m) => m.skillsData,
          rowSchema: skillRowSchema,
          sortFn: (a, b) => a.sortId - b.sortId,
        }),
      () =>
        processTask<Accessory>({
          name: "accessories",
          dataType: "accessories",
          outputFileName: "initial-accessories.json",
          getCsvPathFromMeta: (m) => m.accessoriesData,
          rowSchema: accessoryRowSchema,
          sortFn: (a, b) => a.sortID - b.sortID,
        }),
      () =>
        processTask<Armor>({
          name: "armor",
          dataType: "armor",
          outputFileName: "initial-armor.json",
          getCsvPathFromMeta: (m) => m.armorData,
          rowSchema: armorRowSchema,
          sortFn: (a, b) => a.id.localeCompare(b.id),
        }),
      () =>
        processTask<Weapon>({
          name: "weapons",
          dataType: "weapons",
          outputFileName: "initial-weapons.json",
          getCsvPathFromMeta: (m) => m.weaponsData,
          rowSchema: weaponRowSchema,
          sortFn: (a, b) => a.id.localeCompare(b.id),
        }),
      () =>
        processTask<Charm>({
          name: "charms",
          dataType: "charms",
          outputFileName: "initial-charms.json",
          getCsvPathFromMeta: (m) => m.charmsData,
          rowSchema: charmRowSchema,
          sortFn: (a, b) => a.id.localeCompare(b.id),
        }),
    ];

    // Execute tasks sequentially
    for (const run of taskRunners) {
      await run();
    }

    console.log("Database generation completed successfully!");
  } catch (error) {
    console.error("Error during database generation:", error);
    process.exit(1);
  }
}

void main();
