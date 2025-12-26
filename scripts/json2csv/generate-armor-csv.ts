import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const ROOT_DIR = path.resolve(__dirname, "../../");
const ARMOR_DATA_FILE = path.join(ROOT_DIR, "path/to/ArmorData.user.json");
const ARMOR_MSG_FILE = path.join(ROOT_DIR, "path/to/Armor.msg.json");
const SERIES_DATA_FILE = path.join(
  ROOT_DIR,
  "path/to/ArmorSeriesData.user.json",
);
const SERIES_MSG_FILE = path.join(ROOT_DIR, "path/to/ArmorSeries.msg.json");
const OUTPUT_FILE = path.join(ROOT_DIR, "scripts/json2csv/armor.csv");

// Interfaces
interface ArmorDataWrapper {
  "app.user_data.ArmorData": {
    _Values: {
      "app.user_data.ArmorData.cData": ArmorData;
    }[];
  };
}

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

interface ArmorSeriesDataWrapper {
  "app.user_data.ArmorSeriesData": {
    _Values: {
      "app.user_data.ArmorSeriesData.cData": ArmorSeriesData;
    }[];
  };
}

interface ArmorSeriesData {
  _Series: {
    "app.ArmorDef.SERIES_Serializable": { _Value: string };
  };
  _Rare: {
    "app.ItemDef.RARE_Serializable": { _Value: string };
  };
}

interface MsgEntry {
  guid?: string;
  name?: string;
  content: string[];
}

interface MsgFile {
  entries: MsgEntry[];
}

// Helpers
const cleanValue = (val: string): string => {
  if (!val) return "";
  const match = /^\[-?\d+\](.*)$/.exec(val);
  return match ? match[1] : val;
};

const extractIndex = (val: string): number | null => {
  if (!val) return null;
  const match = /^\[(-?\d+)\]/.exec(val);
  return match ? parseInt(match[1], 10) : null;
};

const cleanText = (val: string): string => {
  if (!val) return "";
  let text = val.replace(/<[^>]*>/g, "");
  text = text.replace(/[\r\n]+/g, "");
  return text;
};

const escapeCsv = (field: string | number | boolean): string => {
  const str = String(field);
  return `"${str.replace(/"/g, '""')}"`;
};

const main = () => {
  try {
    console.log("Reading data files...");
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

    const LANG_INDEX = 13; // Simplified Chinese

    // 1. Build Maps
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

    // 2. Process Armor Data
    console.log("Processing armor data...");
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

        // ID
        const idNum = data._DataValue;
        const id = `ARMOR_ID_${idNum.toString().padStart(4, "0")}`;

        // Name & Description
        const name = cleanText(armorMsgMap.get(data._Name) ?? "");
        if (name === "无装备") return;
        const description = cleanText(armorMsgMap.get(data._Explain) ?? "");

        // Type
        const typeRaw = cleanValue(
          data._PartsType["app.ArmorDef.ARMOR_PARTS_Serializable"]._Value,
        );
        const type = typeRaw.toLowerCase(); // HELM -> helm

        // Series & Rarity
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

        // Defense
        const defense = data._Defense;

        // Resistance
        const resistance = `[${data._Resistance.join(",")}]`;

        // Skills
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

        // Slots
        const slotsList: number[] = [];
        data._SlotLevel.forEach((s) => {
          const slotVal = cleanValue(
            s["app.EquipDef.SlotLevel_Serializable"]._Value,
          );
          // Assuming NONE=0, and others might be Lv1, Lv2? Or just 0 if no slots in example.
          // Based on armor.csv having "0,0,0", we default to 0 if NONE.
          // If we see "Lv1", we parse 1.
          if (slotVal === "NONE") {
            slotsList.push(0);
          } else {
            // Try to parse "Lv1" -> 1
            const match = /Lv(\d+)/.exec(slotVal);
            slotsList.push(match ? parseInt(match[1]) : 0);
          }
        });
        // Ensure 3 slots
        while (slotsList.length < 3) slotsList.push(0);
        const slots = slotsList.slice(0, 3).join(",");

        // Construct Row
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

    // Write File
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
