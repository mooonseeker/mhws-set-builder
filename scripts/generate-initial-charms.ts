import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import type { Charm } from "../src/types";

import { generateFromCsv } from "./lib/csv-json.ts";
import type { DatabaseMeta } from "./lib/schemas.ts";
import { charmRowSchema, databaseMetaSchema } from "./lib/schemas.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const metaFilePath = path.resolve(__dirname, "../src/data/database.meta.json");
const outputFilePath = path.resolve(
  __dirname,
  "../src/data/initial-charms.json",
);

async function main(): Promise<void> {
  const { meta, items } = await generateFromCsv<Charm, DatabaseMeta>({
    scriptName: "generate-initial-charms",
    metaFilePath,
    metaSchema: databaseMetaSchema,
    getCsvPathFromMeta: (m) => {
      if (!m.charmsData) {
        throw new Error("charmsData not defined in meta file");
      }
      return m.charmsData;
    },
    rowSchema: charmRowSchema,
  });

  const charms = items.sort((a, b) => a.id.localeCompare(b.id));

  const finalJson = {
    version: meta.version,
    exportedAt: new Date().toISOString(),
    dataType: "charms",
    charms,
  };

  fs.writeFileSync(outputFilePath, JSON.stringify(finalJson, null, 2));
  console.log(`Generated ${charms.length} charms`);
}

void main().catch((error: unknown) => {
  console.error("Error during CSV processing:", error);
  process.exit(1);
});
