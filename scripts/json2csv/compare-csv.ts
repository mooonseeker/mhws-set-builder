import fs from "fs";
import csv from "csv-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../../");

// ==========================================
// CONFIG
// ==========================================
const FILE_1_PATH = path.join(ROOT_DIR, "path1");
const FILE_2_PATH = path.join(ROOT_DIR, "path2");
const PRIMARY_KEY = "id";
const IGNORED_KEYS: string[] = [];
// ==========================================

type CsvRow = Record<string, string>;

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

  // Helper to build map and validate PK
  const buildMap = (
    data: CsvRow[],
    map: Map<string, CsvRow>,
    sourceName: string,
  ) => {
    data.forEach((row, index) => {
      const pkValue = row[PRIMARY_KEY];
      if (!pkValue) {
        console.warn(
          `[${sourceName}] Row ${index + 1} missing primary key '${PRIMARY_KEY}':`,
          row,
        );
        return;
      }
      if (map.has(pkValue)) {
        console.warn(
          `[${sourceName}] Duplicate primary key '${pkValue}' found at row ${index + 1}. Overwriting.`,
        );
      }
      map.set(pkValue, row);
    });
  };

  buildMap(data1, map1, "File 1");
  buildMap(data2, map2, "File 2");

  // Summary
  console.log("--- Summary ---");
  console.log(`File 1 Total: ${map1.size}`);
  console.log(`File 2 Total: ${map2.size}`);
  const countDiff = map2.size - map1.size;
  console.log(`Count Diff: ${countDiff > 0 ? "+" : ""}${countDiff}`);
  console.log("");

  // Add/Remove
  const addedKeys = Array.from(map2.keys()).filter((k) => !map1.has(k));
  const removedKeys = Array.from(map1.keys()).filter((k) => !map2.has(k));

  if (addedKeys.length > 0) {
    console.log(`--- Added: ${addedKeys.length} ---`);
    addedKeys.forEach((key) => {
      console.log(JSON.stringify(map2.get(key)));
    });
    console.log("");
  }

  if (removedKeys.length > 0) {
    console.log(`--- Removed: ${removedKeys.length} ---`);
    removedKeys.forEach((key) => {
      console.log(JSON.stringify(map1.get(key)));
    });
    console.log("");
  }

  // Differences
  console.log("--- Differences ---");
  const commonKeys = Array.from(map1.keys()).filter((k) => map2.has(k));
  let diffCount = 0;

  commonKeys.forEach((key) => {
    const row1 = map1.get(key)!;
    const row2 = map2.get(key)!;
    const diffs: Record<string, { old: string; new: string }> = {};

    // Get all unique columns from both rows
    const allColumns = new Set([...Object.keys(row1), ...Object.keys(row2)]);

    allColumns.forEach((col) => {
      if (col === PRIMARY_KEY || IGNORED_KEYS.includes(col)) return;

      const val1 = row1[col];
      const val2 = row2[col];

      // Simple string comparison
      if (val1 !== val2) {
        diffs[col] = { old: val1, new: val2 };
      }
    });

    if (Object.keys(diffs).length > 0) {
      diffCount++;
      console.log(`Key (${PRIMARY_KEY}): ${key}`);
      Object.entries(diffs).forEach(([field, change]) => {
        console.log(`  ${field}:`);
        console.log(`    Old: "${change.old}"`);
        console.log(`    New: "${change.new}"`);
      });
      console.log("");
    }
  });

  if (diffCount === 0) {
    console.log("No differences found in common items.");
  } else {
    console.log(`Total items with differences: ${diffCount}`);
  }
};

compareCsv().catch((err) => console.error(err));
