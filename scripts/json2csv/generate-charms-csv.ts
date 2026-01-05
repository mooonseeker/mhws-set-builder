/**
 * @fileoverview
 * This script processes charm data from proprietary JSON formats (`.user.json` and `.msg.json`)
 * and converts it into a standardized CSV file. It extracts, transforms, and maps data fields,
 * and includes a filtering logic to keep only the most relevant charms (multi-skill charms
 * or the highest-level single-skill charms).
 *
 * Before running, ensure the paths in the "Configuration" section are correctly set.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { cleanValue, cleanText, escapeCsv } from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MARK: Configuration
const ROOT_DIR = path.resolve(__dirname, "../../");
const CHARM_DATA_FILE = path.join(ROOT_DIR, "path/to/AmuletData.user.json");
const CHARM_MSG_FILE = path.join(ROOT_DIR, "path/to/Amulet.msg.json");
const OUTPUT_FILE = path.join(ROOT_DIR, "scripts/json2csv/charms.csv");
const LANG_INDEX = 13; // Simplified Chinese

/** Represents the nested structure of the main charm data file. */
interface CharmDataWrapper {
  "app.user_data.AmuletData": {
    _Values: {
      "app.user_data.AmuletData.cData": CharmData;
    }[];
  };
}

/** Represents the core data for a single charm from the source file. */
interface CharmData {
  _DataId: number; // ID
  _Name: string; // GUID for the name
  _Explain: string; // GUID for the description
  _Rare: {
    "app.ItemDef.RARE_Serializable": { _Value: string };
  };
  _Skill: {
    "app.HunterDef.Skill_Serializable": { _Value: string };
  }[];
  _SkillLevel: number[];
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

/** Represents a processed charm with cleaned and structured data, ready for CSV conversion. */
interface ProcessedCharm {
  id: string;
  name: string;
  rarity: string;
  skills: { name: string; level: number }[];
  skillsStr: string;
  slots: string;
  equivalentSlots: string;
  keySkillValue: string;
  createdAt: string;
}

/**
 * The main function to execute the script.
 */
const main = () => {
  try {
    const files = [CHARM_DATA_FILE, CHARM_MSG_FILE];
    files.forEach((f) => {
      if (!fs.existsSync(f)) throw new Error(`File not found: ${f}`);
    });

    const charmDataRaw = JSON.parse(
      fs.readFileSync(CHARM_DATA_FILE, "utf-8"),
    ) as CharmDataWrapper[];
    const charmMsgRaw = JSON.parse(
      fs.readFileSync(CHARM_MSG_FILE, "utf-8"),
    ) as MsgFile;

    // Build translation map.
    const charmMsgMap = new Map<string, string>();
    charmMsgRaw.entries.forEach((entry) => {
      if (entry.guid && entry.content.length > LANG_INDEX) {
        charmMsgMap.set(entry.guid, entry.content[LANG_INDEX]);
      }
    });

    // Process charm data.
    // Fixed values for the output CSV, as they are not present in the source data.
    const createdAt = "2025-02-27T16:00:00.000Z"; // Beijing 2025/2/28 00:00:00
    const slots = "0,0,0";
    const equivalentSlots = "0,0,0,0,0,0";
    const keySkillValue = "0";

    const allCharms: ProcessedCharm[] = [];

    charmDataRaw.forEach((wrapper) => {
      if (!wrapper["app.user_data.AmuletData"]) return;

      wrapper["app.user_data.AmuletData"]._Values.forEach((v) => {
        const data = v["app.user_data.AmuletData.cData"];

        const idNum = data._DataId;
        const id = `CHARM_ID_${idNum.toString().padStart(4, "0")}`;

        const name = cleanText(charmMsgMap.get(data._Name) ?? "");
        if (!name) return; // Skip if no name

        const rareRaw = cleanValue(
          data._Rare["app.ItemDef.RARE_Serializable"]._Value,
        );
        const rareNum = parseInt(rareRaw.replace("RARE", ""), 10) + 1;
        const rarity = rareNum.toString();

        const skills: { name: string; level: number }[] = [];
        const skillsList: string[] = [];
        data._Skill.forEach((s, idx) => {
          const skillVal = s["app.HunterDef.Skill_Serializable"]._Value;
          const skillName = cleanValue(skillVal);
          if (skillName && skillName !== "NONE") {
            const level = data._SkillLevel[idx];
            skills.push({ name: skillName, level });
            skillsList.push(skillName);
            skillsList.push(level.toString());
          }
        });
        if (skills.length === 0) return; // Skip if no skills

        const skillsStr = skillsList.join(",");

        allCharms.push({
          id,
          name,
          rarity,
          skills,
          skillsStr,
          slots,
          equivalentSlots,
          keySkillValue,
          createdAt,
        });
      });
    });

    // Filter charms: Keep all multi-skill charms, but only the highest-level
    // version of each single-skill charm.
    const singleSkillCharms = new Map<string, ProcessedCharm[]>();
    const multiSkillCharms: ProcessedCharm[] = [];

    allCharms.forEach((charm) => {
      if (charm.skills.length === 1) {
        const skillName = charm.skills[0].name;
        if (!singleSkillCharms.has(skillName)) {
          singleSkillCharms.set(skillName, []);
        }
        singleSkillCharms.get(skillName)!.push(charm);
      } else {
        multiSkillCharms.push(charm);
      }
    });

    const filteredSingleSkillCharms: ProcessedCharm[] = [];
    singleSkillCharms.forEach((charms) => {
      // Sort by level (desc) and keep only the highest-level charm.
      charms.sort((a, b) => b.skills[0].level - a.skills[0].level);
      if (charms.length > 0) {
        filteredSingleSkillCharms.push(charms[0]);
      }
    });

    // Combine and sort by ID for consistent output.
    const finalCharms = [...multiSkillCharms, ...filteredSingleSkillCharms];
    finalCharms.sort((a, b) => a.id.localeCompare(b.id));

    const rows: string[] = [];
    const headers = [
      "id",
      "name",
      "rarity",
      "skills",
      "slots",
      "equivalentSlots",
      "keySkillValue",
      "createdAt",
    ];
    rows.push(headers.join(","));

    finalCharms.forEach((charm) => {
      const row = [
        escapeCsv(charm.id),
        escapeCsv(charm.name),
        escapeCsv(charm.rarity),
        escapeCsv(charm.skillsStr),
        escapeCsv(charm.slots),
        escapeCsv(charm.equivalentSlots),
        escapeCsv(charm.keySkillValue),
        escapeCsv(charm.createdAt),
      ];
      rows.push(row.join(","));
    });

    console.log(
      `Generated ${rows.length - 1} charm rows (filtered from ${allCharms.length}).`,
    );

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
