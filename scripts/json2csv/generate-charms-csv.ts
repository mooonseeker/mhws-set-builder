import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const ROOT_DIR = path.resolve(__dirname, "../../");
const CHARM_DATA_FILE = path.join(ROOT_DIR, "path/to/AmuletData.user.json");
const CHARM_MSG_FILE = path.join(ROOT_DIR, "path/to/Amulet.msg.json");
const OUTPUT_FILE = path.join(ROOT_DIR, "scripts/json2csv/charms.csv");

// Interfaces
interface CharmDataWrapper {
  "app.user_data.AmuletData": {
    _Values: {
      "app.user_data.AmuletData.cData": CharmData;
    }[];
  };
}

interface CharmData {
  _DataId: number; // ID
  _Name: string; // GUID
  _Explain: string; // GUID
  _Rare: {
    "app.ItemDef.RARE_Serializable": { _Value: string };
  };
  _Skill: {
    "app.HunterDef.Skill_Serializable": { _Value: string };
  }[];
  _SkillLevel: number[];
}

interface MsgEntry {
  guid?: string;
  name?: string;
  content: string[];
}

interface MsgFile {
  entries: MsgEntry[];
}

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

// Helpers
const cleanValue = (val: string): string => {
  if (!val) return "";
  const match = /^\[-?\d+\](.*)$/.exec(val);
  return match ? match[1] : val;
};

const cleanText = (val: string): string => {
  if (!val) return "";
  let text = val.replace(/<[^>]*>/g, ""); // Basic HTML tag removal if needed
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

    const LANG_INDEX = 13; // Simplified Chinese

    // 1. Build Maps
    const charmMsgMap = new Map<string, string>();
    charmMsgRaw.entries.forEach((entry) => {
      if (entry.guid && entry.content.length > LANG_INDEX) {
        charmMsgMap.set(entry.guid, entry.content[LANG_INDEX]);
      }
    });

    // 2. Process Charm Data
    console.log("Processing charm data...");

    // Fixed values
    const createdAt = "2025-02-27T16:00:00.000Z"; // Beijing 2025/2/28 00:00:00
    const slots = "0,0,0";
    const equivalentSlots = "0,0,0,0,0,0";
    const keySkillValue = "0";

    const allCharms: ProcessedCharm[] = [];

    charmDataRaw.forEach((wrapper) => {
      if (!wrapper["app.user_data.AmuletData"]) return;

      wrapper["app.user_data.AmuletData"]._Values.forEach((v) => {
        const data = v["app.user_data.AmuletData.cData"];

        // ID
        const idNum = data._DataId;
        const id = `CHARM_ID_${idNum.toString().padStart(4, "0")}`;

        // Name
        const name = cleanText(charmMsgMap.get(data._Name) ?? "");
        if (!name) return; // Skip if no name

        // Rarity
        const rareRaw = cleanValue(
          data._Rare["app.ItemDef.RARE_Serializable"]._Value,
        );
        const rareNum = parseInt(rareRaw.replace("RARE", ""), 10) + 1;
        const rarity = rareNum.toString();

        // Skills
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

    // 3. Filter Charms
    // Strategy:
    // - If a charm has > 1 skill, keep it.
    // - If a charm has exactly 1 skill, group by that skill name.
    // - For each single-skill group, keep only the one with the highest skill level.

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
      // Sort descending by level
      charms.sort((a, b) => b.skills[0].level - a.skills[0].level);
      // Keep the first one (highest level)
      if (charms.length > 0) {
        filteredSingleSkillCharms.push(charms[0]);
      }
    });

    // Combine and sort by ID
    const finalCharms = [...multiSkillCharms, ...filteredSingleSkillCharms];
    finalCharms.sort((a, b) => a.id.localeCompare(b.id));

    // 4. Generate CSV Rows
    const rows: string[] = [];
    // Columns: id,name,rarity,skills,slots,equivalentSlots,keySkillValue,createdAt
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
