import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const ROOT_DIR = path.resolve(__dirname, "../../");
const WEAPON_DATA_DIR = path.join(ROOT_DIR, "path/to/weapon-data");
const OUTPUT_FILE = path.join(ROOT_DIR, "scripts/json2csv/weapon.csv");

// Interfaces
interface WeaponData {
  _Attack: number;
  _Critical: number;
  _Defense: number;
  _Attribute: { "app.WeaponDef.ATTR_Serializable": { _Value: string } };
  _AttributeValue: number;
  _SubAttribute: { "app.WeaponDef.ATTR_Serializable": { _Value: string } };
  _SubAttributeValue: number;
  _Name: string; // GUID for Name
  _Explain: string; // GUID for Description
  _Rare: { "app.ItemDef.RARE_Serializable": { _Value: string } };
  _SortId: number;
  _Type: string;
  _SlotLevel: { "app.EquipDef.SlotLevel_Serializable": { _Value: string } }[];
  _Skill: { "app.HunterDef.Skill_Serializable": { _Value: string } }[];
  _SkillLevel: number[];
  _SharpnessValList: number[];
  _TakumiValList: number[];
  // Weapon-specific ID fields
  _Bow?: string;
  _LongSword?: string;
  _ShortSword?: string;
  _TwinSword?: string;
  _Tachi?: string;
  _Hammer?: string;
  _Whistle?: string;
  _Lance?: string;
  _GunLance?: string;
  _SlashAxe?: string;
  _ChargeAxe?: string;
  _Rod?: string;
  _HeavyBowgun?: string;
  _LightBowgun?: string;
}

interface WeaponDataWrapper {
  "app.user_data.WeaponData": {
    _Values: {
      "app.user_data.WeaponData.cData": WeaponData;
    }[];
  };
}

interface MsgEntry {
  guid: string;
  content: string[];
}

interface MsgFile {
  entries: MsgEntry[];
}

const WEAPON_TYPE_MAP: Record<string, string> = {
  "[1]LIGHT_BOWGUN": "light-bowgun",
  "[2]HEAVY_BOWGUN": "heavy-bowgun",
  "[3]BOW": "bow",
  "[4]ROD": "rod",
  "[5]CHARGE_AXE": "charge-axe",
  "[6]SLASH_AXE": "slash-axe",
  "[7]GUN_LANCE": "gun-lance",
  "[8]LANCE": "lance",
  "[9]WHISTLE": "whistle",
  "[10]HAMMER": "hammer",
  "[11]TACHI": "tachi",
  "[12]TWIN_SWORD": "twin-sword",
  "[13]SHORT_SWORD": "short-sword",
  "[14]LONG_SWORD": "long-sword",
};

const WEAPON_ID_KEYS: (keyof WeaponData)[] = [
  "_Bow",
  "_LongSword",
  "_ShortSword",
  "_TwinSword",
  "_Tachi",
  "_Hammer",
  "_Whistle",
  "_Lance",
  "_GunLance",
  "_SlashAxe",
  "_ChargeAxe",
  "_Rod",
  "_HeavyBowgun",
  "_LightBowgun",
];

const ATTRIBUTE_MAP: Record<string, string> = {
  NONE: "",
  FIRE: "fire",
  WATER: "water",
  ICE: "ice",
  ELEC: "elec",
  DRAGON: "dragon",
  POISON: "poison",
  SLEEP: "sleep",
  BLAST: "blast",
  PARALYSE: "paralyse",
};

// Helpers
const cleanValue = (val: string): string => {
  if (!val) return "";
  const match = /^\[-?\d+\](.*)$/.exec(val);
  return match ? match[1] : val;
};

const cleanText = (val: string): string => {
  if (!val) return "";
  return val.replace(/<[^>]*>/g, "").replace(/[\r\n]+/g, "");
};

const escapeCsv = (field: string | number): string => {
  const str = String(field);
  return `"${str.replace(/"/g, '""')}"`;
};

const main = () => {
  try {
    console.log("Reading and processing weapon data...");
    const files = fs.readdirSync(WEAPON_DATA_DIR);
    const userFiles = files.filter(
      (f) => f.includes(".user.") && f.endsWith(".json"),
    );
    const msgFiles = files.filter(
      (f) => f.includes(".msg.") && f.endsWith(".json"),
    );

    // 1. Build Translation Map from all msg files
    const translationMap = new Map<string, string>();
    const LANG_INDEX = 13; // Simplified Chinese

    for (const msgFile of msgFiles) {
      const msgContent = fs.readFileSync(
        path.join(WEAPON_DATA_DIR, msgFile),
        "utf-8",
      );
      const msgData = JSON.parse(msgContent) as MsgFile;
      msgData.entries.forEach((entry) => {
        if (entry.guid && entry.content.length > LANG_INDEX) {
          translationMap.set(entry.guid, entry.content[LANG_INDEX]);
        }
      });
    }

    // 2. Process all user files
    const allRows: string[][] = [];

    for (const userFile of userFiles) {
      const dataContent = fs.readFileSync(
        path.join(WEAPON_DATA_DIR, userFile),
        "utf-8",
      );
      const rawData = JSON.parse(dataContent) as WeaponDataWrapper[];

      rawData.forEach((wrapper) => {
        wrapper["app.user_data.WeaponData"]._Values.forEach((v) => {
          const data = v["app.user_data.WeaponData.cData"];

          // Find weapon ID and Type
          let weaponId = "";
          let weaponTypeKey = "";
          for (const key of WEAPON_ID_KEYS) {
            const val = data[key];
            if (typeof val === "string" && !val.includes("INVALID")) {
              weaponId = cleanValue(val);
              weaponTypeKey = data._Type;
              break;
            }
          }

          if (!weaponId) return;

          const name = cleanText(translationMap.get(data._Name) ?? "");
          if (!name || name.startsWith("#Rejected#")) return;

          const type = WEAPON_TYPE_MAP[weaponTypeKey] ?? "";
          const description = cleanText(
            translationMap.get(data._Explain) ?? "",
          );
          const sortId = data._SortId;

          const skillsList: string[] = [];
          data._Skill.forEach((s, idx) => {
            const skillId = cleanValue(
              s["app.HunterDef.Skill_Serializable"]._Value,
            );
            if (skillId && skillId !== "NONE") {
              skillsList.push(skillId, data._SkillLevel[idx].toString());
            }
          });
          const skills = skillsList.join(",");

          const slots = data._SlotLevel
            .map((s) => {
              const slotVal = cleanValue(
                s["app.EquipDef.SlotLevel_Serializable"]._Value,
              );
              const match = /Lv(\d+)/.exec(slotVal);
              return match ? parseInt(match[1], 10) : 0;
            })
            .join(",");

          const rareRaw = cleanValue(
            data._Rare["app.ItemDef.RARE_Serializable"]._Value,
          );
          const rarity = parseInt(rareRaw.replace("RARE", ""), 10) + 1;

          const attack = data._Attack;
          const critical = data._Critical;
          const defense = data._Defense;

          const attribute =
            ATTRIBUTE_MAP[
              cleanValue(
                data._Attribute["app.WeaponDef.ATTR_Serializable"]._Value,
              )
            ] ?? "";
          const attributeValue = attribute ? data._AttributeValue : "";
          const subattribute =
            ATTRIBUTE_MAP[
              cleanValue(
                data._SubAttribute["app.WeaponDef.ATTR_Serializable"]._Value,
              )
            ] ?? "";
          const subattributeValue = subattribute ? data._SubAttributeValue : "";

          const isRemote = ["bow", "heavy-bowgun", "light-bowgun"].includes(
            type,
          );
          const sharpness = isRemote ? "" : data._SharpnessValList.join(",");
          const takumi = isRemote ? "" : data._TakumiValList.join(",");

          allRows.push([
            weaponId,
            name,
            type,
            description,
            sortId.toString(),
            skills,
            slots,
            rarity.toString(),
            attack.toString(),
            critical.toString(),
            defense.toString(),
            attribute,
            attributeValue.toString(),
            subattribute,
            subattributeValue.toString(),
            sharpness,
            takumi,
          ]);
        });
      });
    }

    // 3. Sort and Write CSV
    allRows.sort((a, b) => {
      // Sort by ID in alphabetical order
      // Since the ID format is "Bow_000", alphabetical order will automatically sort by weapon name first, then by number
      return a[0].localeCompare(b[0]);
    });

    const headers =
      "id,name,type,description,sortId,skills,slots,rarity,attack,critical,defense,attribute,attributeValue,subattribute,subattributeValue,sharpness,takumi";
    const csvContent = [
      headers,
      ...allRows.map((row) => row.map((field) => escapeCsv(field)).join(",")),
    ].join("\n");

    fs.writeFileSync(OUTPUT_FILE, csvContent, "utf-8");
    console.log(
      `Successfully generated weapon.csv with ${allRows.length} weapons.`,
    );
  } catch (error) {
    console.error("Error generating weapon CSV:", error);
    process.exit(1);
  }
};

main();
