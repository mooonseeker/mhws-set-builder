/**
 * MHWS护石管理器 - ID生成工具
 *
 * 提供唯一ID生成功能
 */

import hash from "string-hash";

/**
 * 为技能名称生成确定性ID
 *
 * 为技能名称生成一个确定性的、同步的ID，保证相同名称始终对应相同ID
 *
 * @param name - 技能名称
 * @returns 技能ID字符串
 *
 * @example
 * generateSkillId('攻击') // 返回: "skill-12345"
 * generateSkillId('防御') // 返回: "skill-67890"
 */
export function generateSkillId(name: string): string {
  const uniqueHash = hash(name);
  return `skill-${uniqueHash}`;
}

/**
 * 生成护石ID
 *
 * 生成一个新的、非确定性的护石ID，使用时间戳和缩减的随机字符串
 *
 * @returns 护石ID字符串
 *
 * @example
 * generateCharmId() // 返回: "charm-1634567890123-abcd"
 */
export function generateCharmId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6); // 缩短至4位
  return `charm-${timestamp}-${random}`;
}

/**
 * 验证ID格式是否正确
 *
 * 检查ID是否符合 generateSkillId 或 generateCharmId 生成的格式
 *
 * @param id - 待验证的ID
 * @returns true表示格式正确
 *
 * @example
 * validateIdFormat("skill-12345") // 返回: true
 * validateIdFormat("charm-1634567890123-abcd") // 返回: true
 * validateIdFormat("invalid-id") // 返回: false
 */
export function validateIdFormat(id: string): boolean {
  if (!id || typeof id !== "string") {
    return false;
  }

  // 检查官方技能ID格式: HunterSkill_XXX 或 NONE 等
  if (
    id.startsWith("HunterSkill_") ||
    id === "NONE" ||
    /^[A-Z][a-zA-Z]*_\d+$/.test(id)
  ) {
    return true;
  }

  // 检查用户自定义技能ID格式: skill-{数字}
  if (id.startsWith("skill-")) {
    const hashPart = id.substring(6); // 移除 'skill-'
    return /^\d+$/.test(hashPart);
  }

  // 检查护石ID格式: charm-{时间戳}-{4位随机串}
  if (id.startsWith("charm-")) {
    const parts = id.split("-");
    if (parts.length !== 3) {
      return false;
    }

    const [, timestamp, random] = parts;

    // 验证时间戳：应该是13位数字（毫秒级时间戳）
    if (!/^\d{13}$/.test(timestamp)) {
      return false;
    }

    // 验证随机字符串：应该是4位36进制字符（0-9, a-z）
    if (!/^[0-9a-z]{4}$/.test(random)) {
      return false;
    }

    return true;
  }

  return false;
}
