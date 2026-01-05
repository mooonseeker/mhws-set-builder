/**
 * @fileoverview
 * This script processes weapon data from a directory of proprietary JSON formats
 * (`.user.json` and `.msg.json`) and converts it into a single, standardized CSV file.
 * It reads all weapon-related files, merges translations, extracts detailed stats for
 * each weapon, and outputs a comprehensive dataset.
 *
 * Before running, ensure the `WEAPON_DATA_DIR` in the "Configuration" section
 * points to the correct directory containing the source JSON files.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { cleanValue, cleanText, escapeCsv } from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MARK: Configuration
const ROOT_DIR = path.resolve(__dirname, "../../");
const WEAPON_DATA_DIR = path.join(ROOT_DIR, "path/to/weapon-data");
const OUTPUT_FILE = path.join(ROOT_DIR, "scripts/json2csv/weapon.csv");
const LANG_INDEX = 13; // Simplified Chinese

/** Represents the core data for a single weapon. */
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
  // Weapon-specific ID fields, only one will be present for each weapon.
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

/** Represents the nested structure of a weapon data file. */
interface WeaponDataWrapper {
  "app.user_data.WeaponData": {
    _Values: {
      "app.user_data.WeaponData.cData": WeaponData;
    }[];
  };
}

/** Represents a single translation entry in a message file. */
interface MsgEntry {
  guid: string;
  content: string[];
}

/** Represents the structure of a message file. */
interface MsgFile {
  entries: MsgEntry[];
}

/** Maps raw weapon type strings to standardized slugs. */
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

/** A list of possible keys that hold the unique weapon ID. */
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

/** Maps raw attribute strings to standardized slugs. */
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

/**
 * The main function to execute the script.
 */
const main = () => {
  try {
    const files = fs.readdirSync(WEAPON_DATA_DIR);
    const userFiles = files.filter(
      (f) => f.includes(".user.") && f.endsWith(".json"),
    );
    const msgFiles = files.filter(
      (f) => f.includes(".msg.") && f.endsWith(".json"),
    );

    // Build translation map from all message files.
    const translationMap = new Map<string, string>();
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

    // Process all weapon data files.
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

          if (!weaponId) return; // Skip if no valid ID found

          const name = cleanText(translationMap.get(data._Name) ?? "");
          if (!name || name.startsWith("#Rejected#")) return; // Skip invalid entries

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

    // Sort and write to CSV.
    allRows.sort((a, b) => {
      // Sort by ID alphabetically (e.g., "Bow_001", "Hammer_001").
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
