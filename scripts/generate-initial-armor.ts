import csv from "csv-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import type { Armor, Resistance } from "../src/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const metaFilePath = path.resolve(__dirname, "../src/data/database.meta.json");
const outputFilePath = path.resolve(
  __dirname,
  "../src/data/initial-armor.json",
);

// 1. 读取元数据
const metadata = JSON.parse(fs.readFileSync(metaFilePath, "utf-8"));
const armors: Armor[] = [];

// 2. 根据元数据找到CSV文件路径
const csvFilePath = path.resolve(__dirname, "../src/data/", metadata.armorData);

// 3. 读取并解析CSV
fs.createReadStream(csvFilePath, { encoding: "utf8" })
  .pipe(csv())
  .on("data", (row) => {
    // 数据类型转换
    // CSV字段顺序: id,name,type,description,rarity,defense,resistance,series,skills,slots

    // 解析skills字符串: "HunterSkill_086,1,HunterSkill_137,1"
    // -> [{skillId: 'HunterSkill_086', level: 1}, {skillId: 'HunterSkill_137', level: 1}]
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

    // 解析slots字符串: "1,2,0"
    // -> [{type: 'armor', level: 1}, {type: 'armor', level: 2}]
    const slotsString = row.slots.trim();
    const slotLevels: number[] = slotsString
      ? slotsString.split(",").map((s: string) => parseInt(s.trim(), 10))
      : [];
    const slots: { type: "weapon" | "armor"; level: 1 | 2 | 3 }[] = [];

    slotLevels.forEach((level) => {
      if (level > 0) {
        slots.push({
          type: "armor",
          level: level as 1 | 2 | 3,
        });
      }
    });

    // 解析resistance字符串: "[1,0,1,0,0]" -> [1,0,1,0,0]
    const resistance = JSON.parse(row.resistance) as Resistance;

    const armor: Armor = {
      id: row.id,
      name: row.name,
      type: row.type as Armor["type"],
      description: row.description,
      skills: skills,
      slots: slots,
      rarity: parseInt(row.rarity, 10),
      defense: parseInt(row.defense, 10),
      resistance: resistance,
      series: row.series,
    };
    armors.push(armor);
  })
  .on("end", () => {
    // 按照sortId（如果存在，否则按id）对armors数组进行排序
    // 由于armor数据中没有sortId字段，按id排序
    armors.sort((a, b) => a.id.localeCompare(b.id));

    // 生成 armor.json
    const finalJson = {
      version: metadata.version,
      exportedAt: new Date().toISOString(),
      dataType: "armor",
      armor: armors,
    };

    // 写入文件
    fs.writeFileSync(outputFilePath, JSON.stringify(finalJson, null, 2));
    console.log(`Generated ${armors.length} armor`);
  })
  .on("error", (error) => {
    console.error("Error during CSV processing:", error);
    process.exit(1);
  });
