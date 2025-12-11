import csv from "csv-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import type { Skill } from "../src/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const metaFilePath = path.resolve(__dirname, "../src/data/database.meta.json");
const outputFilePath = path.resolve(
  __dirname,
  "../src/data/initial-skills.json",
);

// 1. 读取元数据
const metadata = JSON.parse(fs.readFileSync(metaFilePath, "utf-8"));
const skills: Skill[] = [];

// 2. 根据元数据找到CSV文件路径
const csvFilePath = path.resolve(
  __dirname,
  "../src/data/",
  metadata.skillsData,
);

// 3. 读取并解析CSV
fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on("data", (row) => {
    // 4. 数据类型转换
    // CSV字段顺序: id,name,type,description,sortId,category,maxLevel,accessoryLevel,isKey
    const accessoryLevelNum = parseInt(row.accessoryLevel, 10);
    const skill: Skill = {
      id: row.id,
      name: row.name,
      type: row.type,
      description: row.description,
      sortId: parseInt(row.sortId, 10),
      category: row.category as Skill["category"],
      maxLevel: parseInt(row.maxLevel, 10),
      accessoryLevel: accessoryLevelNum as Skill["accessoryLevel"],
      isKey: row.isKey.toLowerCase() === "true",
    };
    skills.push(skill);
  })
  .on("end", () => {
    // 5. 生成 skills.json
    const finalJson = {
      version: metadata.version,
      exportedAt: new Date().toISOString(),
      dataType: "skills",
      skills: skills.sort((a, b) => a.sortId - b.sortId), // 确保排序
    };

    // 6. 写入文件
    fs.writeFileSync(outputFilePath, JSON.stringify(finalJson, null, 2));
    console.log(`Generated ${skills.length} skills`);
  })
  .on("error", (error) => {
    console.error("Error during CSV processing:", error);
    process.exit(1);
  });
