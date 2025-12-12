import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import type { Armor } from "../src/types";

import { generateFromCsv } from "./lib/csv-json.ts";
import type { DatabaseMeta } from "./lib/schemas.ts";
import { armorRowSchema, databaseMetaSchema } from "./lib/schemas.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const metaFilePath = path.resolve(__dirname, "../src/data/database.meta.json");
const outputFilePath = path.resolve(
  __dirname,
  "../src/data/initial-armor.json",
);

async function main(): Promise<void> {
  const { meta, items } = await generateFromCsv<Armor, DatabaseMeta>({
    scriptName: "generate-initial-armor",
    metaFilePath,
    metaSchema: databaseMetaSchema,
    getCsvPathFromMeta: (m) => m.armorData,
    rowSchema: armorRowSchema,
  });

  const armor = items.sort((a, b) => a.id.localeCompare(b.id));

  const finalJson = {
    version: meta.version,
    exportedAt: new Date().toISOString(),
    dataType: "armor",
    armor,
  };

  fs.writeFileSync(outputFilePath, JSON.stringify(finalJson, null, 2));
  console.log(`Generated ${armor.length} armor`);
}

void main().catch((error: unknown) => {
  console.error("Error during CSV processing:", error);
  process.exit(1);
});
