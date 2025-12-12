import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import type { Skill } from "../src/types";

import { generateFromCsv } from "./lib/csv-json.ts";
import type { DatabaseMeta } from "./lib/schemas.ts";
import { databaseMetaSchema, skillRowSchema } from "./lib/schemas.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const metaFilePath = path.resolve(__dirname, "../src/data/database.meta.json");
const outputFilePath = path.resolve(
  __dirname,
  "../src/data/initial-skills.json",
);

async function main(): Promise<void> {
  const { meta, items } = await generateFromCsv<Skill, DatabaseMeta>({
    scriptName: "generate-initial-skills",
    metaFilePath,
    metaSchema: databaseMetaSchema,
    getCsvPathFromMeta: (m) => m.skillsData,
    rowSchema: skillRowSchema,
  });

  const skills = items.sort((a, b) => a.sortId - b.sortId);

  const finalJson = {
    version: meta.version,
    exportedAt: new Date().toISOString(),
    dataType: "skills",
    skills,
  };

  fs.writeFileSync(outputFilePath, JSON.stringify(finalJson, null, 2));
  console.log(`Generated ${skills.length} skills`);
}

void main().catch((error: unknown) => {
  console.error("Error during CSV processing:", error);
  process.exit(1);
});
