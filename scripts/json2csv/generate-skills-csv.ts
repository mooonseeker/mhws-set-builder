/**
 * @fileoverview
 * This script processes skill data from proprietary JSON formats (`.user.json` and `.msg.json`)
 * and converts it into a standardized CSV file. It extracts, translates, and maps data fields,
 * handling special cases and data cleaning to create a comprehensive skill dataset.
 *
 * Before running, ensure the paths in the "Configuration" section are correctly set.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { cleanText, cleanValue, escapeCsv } from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MARK: Configuration
const ROOT_DIR = path.resolve(__dirname, "../../");
const DATA_FILE = path.join(ROOT_DIR, "path/to/SkillCommonData.user.json");
const MSG_FILE = path.join(ROOT_DIR, "path/to/SkillCommon.msg.json");
const OUTPUT_FILE = path.join(ROOT_DIR, "scripts/json2csv/skills.csv");
const LANG_INDEX = 13; // Simplified Chinese

/** Represents the nested structure of the main skill data file. */
interface SkillDataWrapper {
  "app.user_data.SkillCommonData": {
    _Values: {
      "app.user_data.SkillCommonData.cData": SkillData;
    }[];
  };
}

/** Represents the core data for a single skill. */
interface SkillData {
  _skillId: string;
  _skillName: string;
  _skillExplain: string;
  _SortId: number;
  _skillCategory: string;
  _SkillIconType: string;
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
 * The main function to execute the script.
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

    const rawData = JSON.parse(dataContent) as SkillDataWrapper[];
    const msgData = JSON.parse(msgContent) as MsgFile;

    // Create a map for translations.
    const translationMap = new Map<string, string>();
    msgData.entries.forEach((entry) => {
      if (entry.content && entry.content.length > LANG_INDEX) {
        translationMap.set(entry.guid, entry.content[LANG_INDEX]);
      }
    });

    // Flatten the data structure.
    const skillsList: SkillData[] = [];
    rawData.forEach((wrapper) => {
      const values = wrapper["app.user_data.SkillCommonData"]._Values;
      values.forEach((v) => {
        skillsList.push(v["app.user_data.SkillCommonData.cData"]);
      });
    });

    // Process and generate CSV rows.
    const headers = [
      "id",
      "name",
      "type",
      "description",
      "sortId",
      "category",
      "maxLevel",
      "accessoryLevel",
      "isKey",
    ];

    const rows: string[] = [headers.join(",")];

    skillsList.forEach((skill) => {
      const id = cleanValue(skill._skillId);
      const rawName = translationMap.get(skill._skillName) ?? skill._skillName;
      let name = cleanText(rawName);
      const type = cleanValue(skill._SkillIconType);
      const rawDescription =
        translationMap.get(skill._skillExplain) ?? skill._skillExplain;
      let description = cleanText(rawDescription);
      const sortId = skill._SortId;
      let category = cleanValue(skill._skillCategory).toLowerCase();

      // Clean up rejected/placeholder text
      if (description.startsWith("#Rejected#")) {
        description = description.replace("#Rejected#", "").trim();
      }

      // Skip entries that are marked as rejected, but keep the essential "NONE" skill.
      if (name.startsWith("#Rejected#") && id !== "NONE") {
        return;
      }

      // Default values, can be overridden by specific logic below.
      let maxLevel = 10;
      const accessoryLevel = -1;
      const isKey = false;

      // Handle the "NONE" skill specifically to match existing data format.
      if (id === "NONE") {
        name = "SkillCommon_0";
        description = "占位技能";
        maxLevel = 1;
      }

      // Normalize category names.
      if (category === "equip") {
        category = "armor";
      }

      if (category === "series" || category === "group") {
        maxLevel = 5;
      }

      const row = [
        escapeCsv(id),
        escapeCsv(name),
        escapeCsv(type),
        escapeCsv(description),
        escapeCsv(sortId),
        escapeCsv(category),
        escapeCsv(maxLevel),
        escapeCsv(accessoryLevel),
        escapeCsv(isKey),
      ];

      rows.push(row.join(","));
    });

    console.log(`Generated ${rows.length - 1} skill rows.`);

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
