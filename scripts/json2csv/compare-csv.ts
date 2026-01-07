/**
 * @fileoverview
 * This script compares two CSV files based on a primary key and reports the
 * differences. It identifies added, removed, and modified rows.
 *
 * It is configurable via the constants in the "Configuration" section.
 * Before running, set `FILE_1_PATH`, `FILE_2_PATH`, `PRIMARY_KEY`, and
 * `IGNORED_KEYS`.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import csv from "csv-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../../");

// MARK: Configuration
const FILE_1_PATH = path.join(ROOT_DIR, "path1");
const FILE_2_PATH = path.join(ROOT_DIR, "path2");
const PRIMARY_KEY = "id";
const IGNORED_KEYS: string[] = [];

type CsvRow = Record<string, string>;

/**
 * Reads a CSV file and returns its content as an array of objects.
 * @param filePath The path to the CSV file.
 * @returns A promise that resolves with the CSV data.
 */
const readCsv = (filePath: string): Promise<CsvRow[]> => {
  return new Promise((resolve, reject) => {
    const results: CsvRow[] = [];
    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: File not found: ${filePath}`);
      resolve([]);
      return;
    }
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data: unknown) => results.push(data as CsvRow))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
};

/**
 * Main function to read two CSV files, compare them, and log the differences.
 */
const compareCsv = async () => {
  console.log(
    `Comparing:\nFile 1 (Old): ${FILE_1_PATH}\nFile 2 (New): ${FILE_2_PATH}\nPrimary Key: ${PRIMARY_KEY}\nIgnored Keys: ${IGNORED_KEYS.join(", ")}\n`,
  );

  const [data1, data2] = await Promise.all([
    readCsv(FILE_1_PATH),
    readCsv(FILE_2_PATH),
  ]);

  const map1 = new Map<string, CsvRow>();
  const map2 = new Map<string, CsvRow>();

  /**
   * Builds a map from CSV data using the primary key and validates key uniqueness.
   * @param data The CSV data.
   * @param map The map to populate.
   * @param sourceName The name of the source file for logging purposes.
   */
  const buildMap = (
    data: CsvRow[],
    map: Map<string, CsvRow>,
    sourceName: string,
  ) => {
    data.forEach((row, index) => {
      const pkValue = row[PRIMARY_KEY];
      if (!pkValue) {
        console.warn(
          `[${sourceName}] Row ${index + 2} missing primary key '${PRIMARY_KEY}':`,
          row,
        );
        return;
      }
      if (map.has(pkValue)) {
        console.warn(
          `[${sourceName}] Duplicate primary key '${pkValue}' found at row ${index + 2}. Overwriting.`,
        );
      }
      map.set(pkValue, row);
    });
  };

  buildMap(data1, map1, "File 1");
  buildMap(data2, map2, "File 2");

  // Summary
  console.log("--- Summary ---");
  console.log(`File 1 Total Rows: ${map1.size}`);
  console.log(`File 2 Total Rows: ${map2.size}`);
  const countDiff = map2.size - map1.size;
  console.log(`Row Count Difference: ${countDiff > 0 ? "+" : ""}${countDiff}`);
  console.log("");

  // Added/Removed Items
  const addedKeys = Array.from(map2.keys()).filter((k) => !map1.has(k));
  const removedKeys = Array.from(map1.keys()).filter((k) => !map2.has(k));

  if (addedKeys.length > 0) {
    console.log(`--- Added Rows: ${addedKeys.length} ---`);
    addedKeys.forEach((key) => {
      console.log(JSON.stringify(map2.get(key)));
    });
    console.log("");
  }

  if (removedKeys.length > 0) {
    console.log(`--- Removed Rows: ${removedKeys.length} ---`);
    removedKeys.forEach((key) => {
      console.log(JSON.stringify(map1.get(key)));
    });
    console.log("");
  }

  // Row Differences
  console.log("--- Row Differences ---");
  const commonKeys = Array.from(map1.keys()).filter((k) => map2.has(k));
  let diffCount = 0;

  commonKeys.forEach((key) => {
    const row1 = map1.get(key)!;
    const row2 = map2.get(key)!;
    const diffs: Record<string, { old: string; new: string }> = {};

    // Get all unique columns from both rows to handle added/removed columns
    const allColumns = new Set([...Object.keys(row1), ...Object.keys(row2)]);

    allColumns.forEach((col) => {
      if (col === PRIMARY_KEY || IGNORED_KEYS.includes(col)) return;

      const val1 = row1[col] ?? "undefined";
      const val2 = row2[col] ?? "undefined";

      // Simple string comparison
      if (val1 !== val2) {
        diffs[col] = { old: val1, new: val2 };
      }
    });

    if (Object.keys(diffs).length > 0) {
      diffCount++;
      console.log(`Key (${PRIMARY_KEY}): ${key}`);
      Object.entries(diffs).forEach(([field, change]) => {
        console.log(`  - Field: ${field}`);
        console.log(`    - Old: "${change.old}"`);
        console.log(`    - New: "${change.new}"`);
      });
      console.log("");
    }
  });

  if (diffCount === 0) {
    console.log("No differences found in common rows.");
  } else {
    console.log(`Total rows with differences: ${diffCount}`);
  }
};

compareCsv().catch((err) => console.error("An error occurred:", err));
