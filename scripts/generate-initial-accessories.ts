import csv from "csv-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import type { Accessory } from "../src/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const metaFilePath = path.resolve(__dirname, "../src/data/database.meta.json");
const outputFilePath = path.resolve(
  __dirname,
  "../src/data/initial-accessories.json",
);

// 1. 读取元数据
const metadata = JSON.parse(fs.readFileSync(metaFilePath, "utf-8"));
const accessories: Accessory[] = [];

// 2. 根据元数据找到CSV文件路径
const csvFilePath = path.resolve(
  __dirname,
  "../src/data/",
  metadata.accessoriesData,
);

// 3. 读取并解析CSV
fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on("data", (row) => {
    // 4. 数据类型转换
    // CSV字段顺序: id,name,type,description,sortID,skills,rarity,slotLevel,color

    // 解析skills字符串: "HunterSkill_028, 3, HunterSkill_005, 1"
    // -> [{skillId: 'HunterSkill_028', level: 3}, {skillId: 'HunterSkill_005', level: 1}]
    const skillPairs: string[] = row.skills
      ? row.skills.split(",").map((s: string) => s.trim())
      : [];
    const skills: { skillId: string; level: number }[] = [];

    for (let i = 0; i < skillPairs.length; i += 2) {
      const skillId = skillPairs[i];
      const level = skillPairs[i + 1];
      if (skillId && skillId !== "NONE") {
        skills.push({
          skillId: skillId,
          level: parseInt(level, 10),
        });
      }
    }

    const accessory: Accessory = {
      id: row.id,
      name: row.name,
      type: row.type as Accessory["type"],
      description: row.description,
      sortID: parseInt(row.sortID, 10),
      skills: skills,
      rarity: parseInt(row.rarity, 10),
      slotLevel: parseInt(row.slotLevel, 10),
      color: row.color,
    };
    accessories.push(accessory);
  })
  .on("end", () => {
    // 5. 生成 accessories.json
    const finalJson = {
      version: metadata.version,
      exportedAt: new Date().toISOString(),
      dataType: "accessories",
      accessories: accessories.sort((a, b) => a.sortID - b.sortID), // 确保排序
    };

    // 6. 写入文件
    fs.writeFileSync(outputFilePath, JSON.stringify(finalJson, null, 2));
    console.log(`Generated ${accessories.length} accessories`);
  })
  .on("error", (error) => {
    console.error("Error during CSV processing:", error);
    process.exit(1);
  });
