import type { Armor, GroupedArmor } from "@/types";

/**
 * 将防具数组按系列分组，并计算全套技能
 * @param armorList - 防具列表
 * @returns 按系列分组后的防具列表
 */
export function groupArmorBySeries(armorList: Armor[]): GroupedArmor[] {
  const groups = new Map<string, GroupedArmor>();

  armorList.forEach((piece: Armor) => {
    if (!groups.has(piece.series)) {
      groups.set(piece.series, {
        series: piece.series,
        fullSetSkills: [],
      });
    }

    const group = groups.get(piece.series)!;

    // 根据防具类型分配到对应字段
    switch (piece.type) {
      case "helm":
        group.helm = piece;
        break;
      case "body":
        group.body = piece;
        break;
      case "arm":
        group.arm = piece;
        break;
      case "waist":
        group.waist = piece;
        break;
      case "leg":
        group.leg = piece;
        break;
    }
  });

  // 计算每个系列的全套技能
  groups.forEach((group) => {
    const allSkills = [
      ...(group.helm?.skills ?? []),
      ...(group.body?.skills ?? []),
      ...(group.arm?.skills ?? []),
      ...(group.waist?.skills ?? []),
      ...(group.leg?.skills ?? []),
    ];

    const skillMap = new Map<string, number>();

    allSkills.forEach((skill) => {
      const currentLevel = skillMap.get(skill.skillId) ?? 0;
      skillMap.set(skill.skillId, currentLevel + skill.level);
    });

    group.fullSetSkills = Array.from(skillMap.entries()).map(
      ([skillId, level]) => ({
        skillId,
        level,
      }),
    );
  });

  return Array.from(groups.values());
}
