import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import type { Accessory } from "../src/types";

import { generateFromCsv } from "./lib/csv-json.ts";
import type { DatabaseMeta } from "./lib/schemas.ts";
import { accessoryRowSchema, databaseMetaSchema } from "./lib/schemas.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const metaFilePath = path.resolve(__dirname, "../src/data/database.meta.json");
const outputFilePath = path.resolve(
  __dirname,
  "../src/data/initial-accessories.json",
);

async function main(): Promise<void> {
  const { meta, items } = await generateFromCsv<Accessory, DatabaseMeta>({
    scriptName: "generate-initial-accessories",
    metaFilePath,
    metaSchema: databaseMetaSchema,
    getCsvPathFromMeta: (m) => m.accessoriesData,
    rowSchema: accessoryRowSchema,
  });

  const accessories = items.sort((a, b) => a.sortID - b.sortID);

  const finalJson = {
    version: meta.version,
    exportedAt: new Date().toISOString(),
    dataType: "accessories",
    accessories,
  };

  fs.writeFileSync(outputFilePath, JSON.stringify(finalJson, null, 2));
  console.log(`Generated ${accessories.length} accessories`);
}

void main().catch((error: unknown) => {
  console.error("Error during CSV processing:", error);
  process.exit(1);
});
