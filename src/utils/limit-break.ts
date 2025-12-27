import { cloneDeep } from "lodash-es";
import { DataStorage } from "@/services/DataStorage";
import type { AppSettings, Armor, SlotLevel } from "@/types";

/**
 * 升级单个防具至极限突破状态
 *
 * 规则：
 * - 稀有度 5: 三个孔位依次增加 1 级（上限 3 级）
 * - 稀有度 6: 前两个孔位依次增加 1 级（上限 3 级）
 * - 名字: 增加 "+" 后缀
 */
export function upgradeArmor(armor: Armor): Armor {
  // 仅处理 R5 和 R6 防具
  if (armor.rarity !== 5 && armor.rarity !== 6) {
    return armor;
  }

  // 如果名字已经包含 "+" 后缀，说明已经升级过，直接返回
  if (armor.name.endsWith("+")) {
    return armor;
  }

  const newArmor = cloneDeep(armor);
  newArmor.name = `${newArmor.name}+`;

  // 1. 标准化孔位为等级数组，不足3个的用0补齐
  const currentSlotLevels: number[] = [
    ...newArmor.slots.map((s) => s.level),
    0,
    0,
    0,
  ].slice(0, 3);

  // 2. 应用升级规则
  let upgradedLevels: number[];
  if (newArmor.rarity === 5) {
    // R5: 三个孔位依次增加 1 级
    upgradedLevels = currentSlotLevels.map((level) => Math.min(level + 1, 3));
  } else {
    // R6: 前两个孔位依次增加 1 级
    upgradedLevels = currentSlotLevels.map((level, index) =>
      index < 2 ? Math.min(level + 1, 3) : level,
    );
  }

  // 3. 重新生成 slots 数组，过滤掉0级孔位，并按等级降序排序
  newArmor.slots = upgradedLevels
    .filter((level): level is 1 | 2 | 3 => level > 0)
    .sort((a, b) => b - a)
    .map((level) => ({
      type: "armor", // 假设防具孔位类型固定为 "armor"
      level: level as SlotLevel,
    }));

  return newArmor;
}

/**
 * 全局切换极限突破状态
 *
 * @param enable - 是否开启
 */
export async function toggleLimitBreakGlobal(enable: boolean): Promise<void> {
  // 1. 获取当前设置
  const settingsData = DataStorage.loadData<AppSettings>("settings");
  if (!settingsData || settingsData.length === 0) {
    throw new Error("Settings not initialized");
  }
  const settings = settingsData[0];

  // 如果状态未改变，直接返回
  if (settings.enableLimitBreak === enable) {
    return;
  }

  // 2. 更新 Armor 数据
  if (enable) {
    // 开启：读取当前防具 -> 升级 -> 保存
    const currentArmors = DataStorage.loadData<Armor>("armor");
    const upgradedArmors = currentArmors.map(upgradeArmor);
    DataStorage.saveData("armor", upgradedArmors);
  } else {
    // 关闭：重置防具数据回初始状态
    await DataStorage.resetData("armor");
  }

  // 3. 更新设置状态
  settings.enableLimitBreak = enable;
  DataStorage.saveData("settings", [settings]);
}
