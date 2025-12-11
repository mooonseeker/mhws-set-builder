import type { Weapon } from "../types";

/**
 * 将武器列表按sortId升序排序后，按稀有度分组为二维数组
 * @param weapons - Weapon数组（可无序）
 * @returns 二维数组，每个子数组表示一行武器
 */
export function groupWeaponsIntoRows(weapons: Weapon[]): Weapon[][] {
  if (weapons.length === 0) {
    return [];
  }

  // 先按sortId升序排序
  const sortedWeapons = [...weapons].sort((a, b) => a.sortId - b.sortId);

  const rows: Weapon[][] = [[sortedWeapons[0]]];

  for (let i = 1; i < sortedWeapons.length; i++) {
    const currentWeapon = sortedWeapons[i];
    const previousWeapon = sortedWeapons[i - 1];

    if (currentWeapon.rarity > previousWeapon.rarity) {
      // 稀有度增加，添加到当前行末尾
      rows[rows.length - 1].push(currentWeapon);
    } else {
      // 稀有度不变或减少，创建新行
      rows.push([currentWeapon]);
    }
  }

  return rows;
}
