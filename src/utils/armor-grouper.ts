/**
 * @fileoverview Utility functions for grouping armor pieces in MHWS Set Builder.
 */

import type { Armor, GroupedArmor } from "@/types";

/**
 * Groups an array of armor pieces by series and calculates the skills for the full set.
 * @param armorList - The list of armor pieces.
 * @returns A list of armor pieces grouped by series.
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

    // Assign the piece to the corresponding field based on its type.
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

  // Calculate the full set skills for each series.
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
