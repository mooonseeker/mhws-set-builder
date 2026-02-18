/**
 * @fileoverview
 * This script processes accessory data from proprietary JSON formats (`.user.json` and `.msg.json`)
 * and converts it into a standardized CSV file. It extracts, transforms, and maps data fields
 * to create a clean, relational dataset.
 *
 * Before running, ensure the paths in the "Configuration" section are correctly set.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { cleanText, cleanValue, escapeCsv } from "./utils.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MARK: Configuration
const ROOT_DIR = path.resolve(__dirname, "../../");
const DATA_FILE = path.join(ROOT_DIR, "path/to/AccessoryData.user.json");
const MSG_FILE = path.join(ROOT_DIR, "path/to/Accessory.msg.json");
const OUTPUT_FILE = path.join(ROOT_DIR, "scripts/json2csv/accessories.csv");
const LANG_INDEX = 13; // Simplified Chinese

/** Represents the nested structure of the main data file. */
interface AccessoryDataWrapper {
  "app.user_data.AccessoryData": {
    _Values: {
      "app.user_data.AccessoryData.cData": AccessoryData;
    }[];
  };
}

/** Represents the core data for a single accessory. */
interface AccessoryData {
  _AccessoryId: {
    "app.EquipDef.ACCESSORY_ID_Serializable": { _Value: string };
  };
  _Name: string; // GUID for the name
  _Explain: string; // GUID for the description
  _AccessoryType: {
    "app.EquipDef.ACCESSORY_TYPE_Serializable": { _Value: string };
  };
  _SortId: number;
  _Rare: { "app.ItemDef.RARE_Serializable": { _Value: string } };
  _IconColor: string;
  _Price: number;
  _SlotLevelAcc: { "app.EquipDef.SlotLevel_Serializable": { _Value: string } };
  _Skill: { "app.HunterDef.Skill_Serializable": { _Value: string } }[];
  _SkillLevel: number[];
}

/** Represents a single translation entry in the message file. */
interface MsgEntry {
  guid: string;
  content: string[];
}

/** Represents the structure of the message file. */
interface MsgFile {
  entries: MsgEntry[];
}

/**
 * Main function to read, process, and write accessory data to a CSV file.
 */
const main = () => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      throw new Error(`Data file not found: ${DATA_FILE}`);
    }
    if (!fs.existsSync(MSG_FILE)) {
      throw new Error(`Msg file not found: ${MSG_FILE}`);
    }

    const dataContent = fs.readFileSync(DATA_FILE, "utf-8");
    const msgContent = fs.readFileSync(MSG_FILE, "utf-8");

    const rawData = JSON.parse(dataContent) as AccessoryDataWrapper[];
    const msgData = JSON.parse(msgContent) as MsgFile;

    const translationMap = new Map<string, string>();

    msgData.entries.forEach((entry) => {
      if (entry.content && entry.content.length > LANG_INDEX) {
        translationMap.set(entry.guid, entry.content[LANG_INDEX]);
      }
    });

    const accessoriesList: AccessoryData[] = [];
    rawData.forEach((wrapper) => {
      const values = wrapper["app.user_data.AccessoryData"]._Values;
      values.forEach((v) => {
        accessoriesList.push(v["app.user_data.AccessoryData.cData"]);
      });
    });

    const headers = [
      "id",
      "name",
      "type",
      "description",
      "sortID",
      "skills",
      "rarity",
      "slotLevel",
      "color",
    ];
    const rows: string[] = [headers.join(",")];

    accessoriesList.forEach((acc) => {
      const id = cleanValue(
        acc._AccessoryId["app.EquipDef.ACCESSORY_ID_Serializable"]._Value,
      );

      const name = cleanText(translationMap.get(acc._Name) ?? "");
      const description = cleanText(translationMap.get(acc._Explain) ?? "");

      const accTypeRaw = cleanValue(
        acc._AccessoryType["app.EquipDef.ACCESSORY_TYPE_Serializable"]._Value,
      );
      const type = accTypeRaw === "ACC_TYPE_01" ? "armor" : "weapon"; // Correct logic: 01 is armor

      const sortID = acc._SortId;

      // Format skills as "SkillId1,Level1,SkillId2,Level2"
      const skillsParts: string[] = [];
      for (let i = 0; i < 2; i++) {
        const skillId = cleanValue(
          acc._Skill[i]["app.HunterDef.Skill_Serializable"]._Value,
        );
        const skillLevel = acc._SkillLevel[i];
        skillsParts.push(skillId, skillLevel.toString());
      }
      const skills = skillsParts.join(",");

      const rarityRaw = cleanValue(
        acc._Rare["app.ItemDef.RARE_Serializable"]._Value,
      );
      const rarity = rarityRaw.replace("RARE", "");

      const slotLevelRaw = cleanValue(
        acc._SlotLevelAcc["app.EquipDef.SlotLevel_Serializable"]._Value,
      );
      const slotLevel = slotLevelRaw.replace("Lv", "");

      const colorRaw = cleanValue(acc._IconColor);
      const color = colorRaw.replace("I_", "");

      const row = [
        escapeCsv(id),
        escapeCsv(name),
        escapeCsv(type),
        escapeCsv(description),
        escapeCsv(sortID),
        escapeCsv(skills),
        escapeCsv(rarity),
        escapeCsv(slotLevel),
        escapeCsv(color),
      ];

      rows.push(row.join(","));
    });

    console.log(`Generated ${rows.length - 1} accessory rows.`);

    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, rows.join("\n"), "utf-8");
    console.log(`Successfully wrote to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error("Error generating CSV:", error);
    process.exit(1);
  }
};

main();
