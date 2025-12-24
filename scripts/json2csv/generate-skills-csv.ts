import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const ROOT_DIR = path.resolve(__dirname, "../../");
const DATA_FILE = path.join(ROOT_DIR, "path/to/SkillCommonData.user.json");
const MSG_FILE = path.join(ROOT_DIR, "path/to/SkillCommon.msg.json");
const OUTPUT_FILE = path.join(ROOT_DIR, "scripts/json2csv/skills.csv");

// Interfaces for JSON structures
interface SkillDataWrapper {
  "app.user_data.SkillCommonData": {
    _Values: {
      "app.user_data.SkillCommonData.cData": SkillData;
    }[];
  };
}

interface SkillData {
  _skillId: string;
  _skillName: string;
  _skillExplain: string;
  _SortId: number;
  _skillCategory: string;
  _SkillIconType: string;
}

interface MsgEntry {
  guid: string;
  content: string[];
}

interface MsgFile {
  entries: MsgEntry[];
}

// Helper to clean strings (remove [number] prefix)
const cleanValue = (val: string): string => {
  const match = /^\[-?\d+\](.*)$/.exec(val);
  return match ? match[1] : val;
};

// Helper to clean text (remove newlines and tags)
const cleanText = (val: string): string => {
  if (!val) return "";
  // Remove HTML tags
  let text = val.replace(/<[^>]*>/g, "");
  // Remove newlines
  text = text.replace(/[\r\n]+/g, "");
  return text;
};

// Helper to escape CSV fields
const escapeCsv = (field: string | number | boolean): string => {
  const str = String(field);
  // Always quote fields to match src/data/skills.csv
  return `"${str.replace(/"/g, '""')}"`;
};

const main = () => {
  try {
    console.log("Reading data files...");
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

    // Create a map for translations
    // Index 13 is for Simplified Chinese as per instructions
    const LANG_INDEX = 13;
    const translationMap = new Map<string, string>();

    msgData.entries.forEach((entry) => {
      if (entry.content && entry.content.length > LANG_INDEX) {
        translationMap.set(entry.guid, entry.content[LANG_INDEX]);
      }
    });

    console.log("Processing skills...");

    // Flatten the data structure
    // The root is an array, but usually contains one object with the wrapper
    const skillsList: SkillData[] = [];
    rawData.forEach((wrapper) => {
      const values = wrapper["app.user_data.SkillCommonData"]._Values;
      values.forEach((v) => {
        skillsList.push(v["app.user_data.SkillCommonData.cData"]);
      });
    });

    // CSV Header
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

    // Header row is NOT quoted
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

      // Remove "#Rejected# " prefix from description if present
      if (description.startsWith("#Rejected#")) {
        description = description.replace("#Rejected#", "").trim();
      }

      // Skip entries starting with #Rejected# but keep the first one (NONE)
      if (name.startsWith("#Rejected#") && id !== "NONE") {
        return;
      }

      // Handle "NONE" skill specifically to match src/data/skills.csv
      let maxLevel = 10;
      const accessoryLevel = -1;
      const isKey = false;

      if (id === "NONE") {
        name = "SkillCommon_0"; // As per src/data/skills.csv
        description = "占位技能"; // As per src/data/skills.csv
        maxLevel = 1; // As per src/data/skills.csv
      }

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

    // Ensure directory exists
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
