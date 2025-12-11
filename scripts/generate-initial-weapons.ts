import csv from "csv-parser";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

import type { Weapon, Slot } from "../src/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const metaFilePath = path.resolve(__dirname, "../src/data/database.meta.json");
const outputFilePath = path.resolve(
  __dirname,
  "../src/data/initial-weapons.json",
);

// 1. 读取元数据
const metadata = JSON.parse(fs.readFileSync(metaFilePath, "utf-8"));
const weapons: Weapon[] = [];

// 2. 根据元数据找到CSV文件路径
const csvFilePath = path.resolve(
  __dirname,
  "../src/data/",
  metadata.weaponsData,
);

// 3. 读取并解析CSV
fs.createReadStream(csvFilePath, { encoding: "utf8" })
  .pipe(csv())
  .on("data", (row) => {
    // 数据类型转换
    // CSV字段顺序: id,name,type,description,sortId,skills,slots,rarity,attack,critical,defense,attribute,attributeValue,subattribute,subattributeValue,sharpness,takumi

    // 解析skills字符串: "HunterSkill_019,1,HunterSkill_001,1"
    // -> [{skillId: 'HunterSkill_019', level: 1}, {skillId: 'HunterSkill_001', level: 1}]
    const skillsString = row.skills.trim();
    const skillPairs: string[] = skillsString
      ? skillsString.split(",").map((s: string) => s.trim())
      : [];
    const skills: { skillId: string; level: number }[] = [];

    for (let i = 0; i < skillPairs.length; i += 2) {
      const skillId = skillPairs[i];
      const levelStr = skillPairs[i + 1];
      if (skillId && skillId !== "NONE" && levelStr) {
        skills.push({
          skillId: skillId,
          level: parseInt(levelStr, 10),
        });
      }
    }

    // 解析slots字符串: "2,1,0"
    // -> [{type: 'weapon', level: 2}, {type: 'weapon', level: 1}]
    const slotsString = row.slots.trim();
    const slotLevels: number[] = slotsString
      ? slotsString.split(",").map((s: string) => parseInt(s.trim(), 10))
      : [];
    const slots: { type: "weapon" | "armor"; level: Slot["level"] }[] = [];

    slotLevels.forEach((level) => {
      if (level > 0) {
        slots.push({
          type: "weapon",
          level: level as Slot["level"],
        });
      }
    });

    const weapon: Weapon = {
      id: row.id,
      name: row.name,
      type: row.type as Weapon["type"],
      description: row.description,
      sortId: parseInt(row.sortId, 10),
      skills: skills,
      slots: slots as Slot[],
      rarity: parseInt(row.rarity, 10),
      attack: parseInt(row.attack, 10),
      critical: parseInt(row.critical, 10),
      defense: parseInt(row.defense, 10),
      attribute: row.attribute || undefined,
      attributeValue: row.attributeValue
        ? parseInt(row.attributeValue, 10)
        : undefined,
      subattribute: row.subattribute || undefined,
      subattributeValue: row.subattributeValue
        ? parseInt(row.subattributeValue, 10)
        : undefined,
      sharpness: row.sharpness
        ? row.sharpness.split(",").map((s: string) => parseInt(s.trim(), 10))
        : undefined,
      takumi: row.takumi
        ? row.takumi.split(",").map((s: string) => parseInt(s.trim(), 10))
        : undefined,
    };
    weapons.push(weapon);
  })
  .on("end", () => {
    // 按照id排序
    weapons.sort((a, b) => a.id.localeCompare(b.id));

    // 生成 weapon.json
    const finalJson = {
      version: metadata.version,
      exportedAt: new Date().toISOString(),
      dataType: "weapon",
      weapons: weapons,
    };

    // 写入文件
    fs.writeFileSync(outputFilePath, JSON.stringify(finalJson, null, 2));
    console.log(`Generated ${weapons.length} weapons`);
  })
  .on("error", (error) => {
    console.error("Error during CSV processing:", error);
    process.exit(1);
  });
