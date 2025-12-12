import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

import type { Weapon } from "../src/types";

import { generateFromCsv } from "./lib/csv-json.ts";
import type { DatabaseMeta } from "./lib/schemas.ts";
import { databaseMetaSchema, weaponRowSchema } from "./lib/schemas.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const metaFilePath = path.resolve(__dirname, "../src/data/database.meta.json");
const outputFilePath = path.resolve(
  __dirname,
  "../src/data/initial-weapons.json",
);

async function main(): Promise<void> {
  const { meta, items } = await generateFromCsv<Weapon, DatabaseMeta>({
    scriptName: "generate-initial-weapons",
    metaFilePath,
    metaSchema: databaseMetaSchema,
    getCsvPathFromMeta: (m) => m.weaponsData,
    rowSchema: weaponRowSchema,
  });

  const weapons = items.sort((a, b) => a.id.localeCompare(b.id));

  const finalJson = {
    version: meta.version,
    exportedAt: new Date().toISOString(),
    dataType: "weapon",
    weapons,
  };

  fs.writeFileSync(outputFilePath, JSON.stringify(finalJson, null, 2));
  console.log(`Generated ${weapons.length} weapons`);
}

void main().catch((error: unknown) => {
  console.error("Error during CSV processing:", error);
  process.exit(1);
});
