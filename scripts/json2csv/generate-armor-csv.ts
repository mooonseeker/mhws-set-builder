/**
 * @fileoverview
 * This script processes armor and armor series data from multiple proprietary JSON
 * formats (`.user.json` and `.msg.json`) and converts it into a single,
 * standardized CSV file. It handles the complexity of merging data from four
 * different source files to create a comprehensive armor dataset.
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
const ARMOR_DATA_FILE = path.join(ROOT_DIR, "path/to/ArmorData.user.json");
const ARMOR_MSG_FILE = path.join(ROOT_DIR, "path/to/Armor.msg.json");
const SERIES_DATA_FILE = path.join(
  ROOT_DIR,
  "path/to/ArmorSeriesData.user.json",
);
const SERIES_MSG_FILE = path.join(ROOT_DIR, "path/to/ArmorSeries.msg.json");
const OUTPUT_FILE = path.join(ROOT_DIR, "scripts/json2csv/armor.csv");
const LANG_INDEX = 13; // Simplified Chinese

/** Represents the nested structure of the main armor data file. */
interface ArmorDataWrapper {
  "app.user_data.ArmorData": {
    _Values: {
      "app.user_data.ArmorData.cData": ArmorData;
    }[];
  };
}

/** Represents the core data for a single armor piece. */
interface ArmorData {
  _DataValue: number; // ID
  _Name: string; // GUID
  _Explain: string; // GUID
  _Series: {
    "app.ArmorDef.SERIES_Serializable": { _Value: string };
  };
  _PartsType: {
    "app.ArmorDef.ARMOR_PARTS_Serializable": { _Value: string };
  };
  _Defense: number;
  _Resistance: number[]; // [Fire, Water, Thunder, Ice, Dragon]
  _SlotLevel: {
    "app.EquipDef.SlotLevel_Serializable": { _Value: string };
  }[];
  _Skill: {
    "app.HunterDef.Skill_Serializable": { _Value: string };
  }[];
  _SkillLevel: number[];
}

/** Represents the nested structure of the armor series data file. */
interface ArmorSeriesDataWrapper {
  "app.user_data.ArmorSeriesData": {
    _Values: {
      "app.user_data.ArmorSeriesData.cData": ArmorSeriesData;
    }[];
  };
}

/** Represents the core data for a single armor series entry. */
interface ArmorSeriesData {
  _Series: {
    "app.ArmorDef.SERIES_Serializable": { _Value: string };
  };
  _Rare: {
    "app.ItemDef.RARE_Serializable": { _Value: string };
  };
}

/** Represents a single translation entry in a message file. */
interface MsgEntry {
  guid?: string;
  name?: string;
  content: string[];
}

/** Represents the structure of a message file. */
interface MsgFile {
  entries: MsgEntry[];
}

/**
 * Extracts the numeric index from a string (e.g., "[-123]Value" -> -123).
 * @param val The string to extract from.
 * @returns The extracted number or null if not found.
 */
const extractIndex = (val: string): number | null => {
  if (!val) return null;
  const match = /^\[(-?\d+)\]/.exec(val);
  return match ? parseInt(match[1], 10) : null;
};

/**
 * Main function to read, process, and write armor data to a CSV file.
 */
const main = () => {
  try {
    const files = [
      ARMOR_DATA_FILE,
      ARMOR_MSG_FILE,
      SERIES_DATA_FILE,
      SERIES_MSG_FILE,
    ];
    files.forEach((f) => {
      if (!fs.existsSync(f)) throw new Error(`File not found: ${f}`);
    });

    const armorDataRaw = JSON.parse(
      fs.readFileSync(ARMOR_DATA_FILE, "utf-8"),
    ) as ArmorDataWrapper[];
    const armorMsgRaw = JSON.parse(
      fs.readFileSync(ARMOR_MSG_FILE, "utf-8"),
    ) as MsgFile;
    const seriesDataRaw = JSON.parse(
      fs.readFileSync(SERIES_DATA_FILE, "utf-8"),
    ) as ArmorSeriesDataWrapper[];
    const seriesMsgRaw = JSON.parse(
      fs.readFileSync(SERIES_MSG_FILE, "utf-8"),
    ) as MsgFile;

    // Build translation and rarity maps for efficient lookup.
    const armorMsgMap = new Map<string, string>();
    armorMsgRaw.entries.forEach((entry) => {
      if (entry.guid && entry.content.length > LANG_INDEX) {
        armorMsgMap.set(entry.guid, entry.content[LANG_INDEX]);
      }
    });

    const seriesMsgMap = new Map<string, string>();
    seriesMsgRaw.entries.forEach((entry) => {
      if (entry.name && entry.content.length > LANG_INDEX) {
        seriesMsgMap.set(entry.name, entry.content[LANG_INDEX]);
      }
    });

    const seriesRarityMap = new Map<string, string>();
    seriesDataRaw.forEach((wrapper) => {
      wrapper["app.user_data.ArmorSeriesData"]._Values.forEach((v) => {
        const data = v["app.user_data.ArmorSeriesData.cData"];
        const seriesKey =
          data._Series["app.ArmorDef.SERIES_Serializable"]._Value;
        const rareRaw = cleanValue(
          data._Rare["app.ItemDef.RARE_Serializable"]._Value,
        ); // e.g. RARE0
        const rareNum = parseInt(rareRaw.replace("RARE", ""), 10) + 1;
        seriesRarityMap.set(seriesKey, rareNum.toString());
      });
    });

    // Process armor data.
    const rows: string[] = [];
    const headers = [
      "id",
      "name",
      "type",
      "description",
      "rarity",
      "defense",
      "resistance",
      "series",
      "skills",
      "slots",
    ];
    rows.push(headers.join(","));

    armorDataRaw.forEach((wrapper) => {
      wrapper["app.user_data.ArmorData"]._Values.forEach((v) => {
        const data = v["app.user_data.ArmorData.cData"];

        const idNum = data._DataValue;
        const id = `ARMOR_ID_${idNum.toString().padStart(4, "0")}`;

        const name = cleanText(armorMsgMap.get(data._Name) ?? "");
        if (name === "无装备") return;
        const description = cleanText(armorMsgMap.get(data._Explain) ?? "");

        const typeRaw = cleanValue(
          data._PartsType["app.ArmorDef.ARMOR_PARTS_Serializable"]._Value,
        );
        const type = typeRaw.toLowerCase(); // e.g. HELM -> helm

        const seriesKey =
          data._Series["app.ArmorDef.SERIES_Serializable"]._Value;
        const seriesIndex = extractIndex(seriesKey);

        let seriesNameKey = "";
        if (seriesIndex !== null) {
          const indexStr = seriesIndex.toString();
          // Handle negative index: -123 -> m123
          const formattedIndex = indexStr.startsWith("-")
            ? `m${indexStr.substring(1)}`
            : indexStr;
          seriesNameKey = `ArmorSeries_${formattedIndex}`;
        }

        const series = cleanText(seriesMsgMap.get(seriesNameKey) ?? "");
        const rarity = seriesRarityMap.get(seriesKey) ?? "1";

        const defense = data._Defense;

        const resistance = `[${data._Resistance.join(",")}]`;

        const skillsList: string[] = [];
        data._Skill.forEach((s, idx) => {
          const skillVal = s["app.HunterDef.Skill_Serializable"]._Value;
          const skillName = cleanValue(skillVal);
          if (skillName && skillName !== "NONE") {
            const level = data._SkillLevel[idx];
            skillsList.push(skillName);
            skillsList.push(level.toString());
          }
        });
        const skills = skillsList.join(",");

        const slotsList: number[] = [];
        data._SlotLevel.forEach((s) => {
          const slotVal = cleanValue(
            s["app.EquipDef.SlotLevel_Serializable"]._Value,
          );
          // Default to 0 for "NONE" or unparsable values.
          if (slotVal === "NONE") {
            slotsList.push(0);
          } else {
            // Parse "Lv1" to 1.
            const match = /Lv(\d+)/.exec(slotVal);
            slotsList.push(match ? parseInt(match[1]) : 0);
          }
        });
        // Ensure 3 slots for consistency.
        while (slotsList.length < 3) slotsList.push(0);
        const slots = slotsList.slice(0, 3).join(",");

        const row = [
          escapeCsv(id),
          escapeCsv(name),
          escapeCsv(type),
          escapeCsv(description),
          escapeCsv(rarity),
          escapeCsv(defense),
          escapeCsv(resistance),
          escapeCsv(series),
          escapeCsv(skills),
          escapeCsv(slots),
        ];
        rows.push(row.join(","));
      });
    });

    console.log(`Generated ${rows.length - 1} armor rows.`);

    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(OUTPUT_FILE, rows.join("\n"), "utf-8");
    console.log(`Successfully wrote to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

main();
