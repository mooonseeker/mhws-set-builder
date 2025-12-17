import { useMemo } from "react";

import { SkillItem } from "@/components/skills";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSkills } from "@/contexts";
import { compareSkills } from "@/utils";

import type { EquipmentSet, SlottedEquipment } from "@/types/set-builder";
import type {
  SkillWithLevel,
  Accessory,
  Weapon,
  Armor,
  Skill,
  Charm,
} from "@/types";

export interface SetSummaryProps {
  equipmentSet: EquipmentSet;
}

export function SetSummary({ equipmentSet }: SetSummaryProps) {
  const { skills: allSkillsData } = useSkills();

  // 计算套装统计信息
  const setStats = useMemo(() => {
    let totalAttack = 0;
    let totalCritical = 0;
    let totalDefense = 0;
    const totalResistance: [number, number, number, number, number] = [
      0, 0, 0, 0, 0,
    ];

    (
      Object.values(equipmentSet) as (
        | SlottedEquipment<Weapon | Armor | Charm>
        | undefined
      )[]
    ).forEach((slottedPiece) => {
      if (slottedPiece) {
        const equipment = slottedPiece.equipment;

        // 武器属性
        if ("attack" in equipment) {
          totalAttack += equipment.attack;
          totalCritical += equipment.critical;
          totalDefense += equipment.defense || 0;
        }

        // 防具属性
        if ("defense" in equipment && "resistance" in equipment) {
          totalDefense += equipment.defense;
          equipment.resistance.forEach((res, index) => {
            totalResistance[index] += res;
          });
        }
      }
    });

    return {
      attack: totalAttack,
      critical: totalCritical,
      defense: totalDefense,
      resistance: totalResistance,
    };
  }, [equipmentSet]);

  const aggregatedSkills = useMemo(() => {
    const skillMap = new Map<
      string,
      {
        skillId: string;
        level: number;
        name: string;
        maxLevel: number;
        category: string;
        skillData?: Skill;
      }
    >();

    // 遍历所有装备部件
    (
      Object.values(equipmentSet) as (
        | SlottedEquipment<Weapon | Armor | Charm>
        | undefined
      )[]
    ).forEach((slottedPiece) => {
      if (slottedPiece) {
        // 累加装备自带的技能
        slottedPiece.equipment.skills.forEach((skill: SkillWithLevel) => {
          const current = skillMap.get(skill.skillId);
          const skillData = allSkillsData.find((s) => s.id === skill.skillId);
          if (current) {
            current.level += skill.level;
          } else {
            skillMap.set(skill.skillId, {
              skillId: skill.skillId,
              level: skill.level,
              name: skillData?.name ?? "未知技能",
              maxLevel: skillData?.maxLevel ?? 1,
              category: skillData?.category ?? "armor",
              skillData,
            });
          }
        });
        // 累加装饰品技能
        slottedPiece.accessories.forEach((acc: Accessory | null) => {
          if (acc) {
            acc.skills.forEach((skill: SkillWithLevel) => {
              const current = skillMap.get(skill.skillId);
              const skillData = allSkillsData.find(
                (s) => s.id === skill.skillId,
              );
              if (current) {
                current.level += skill.level;
              } else {
                skillMap.set(skill.skillId, {
                  skillId: skill.skillId,
                  level: skill.level,
                  name: skillData?.name ?? "未知技能",
                  maxLevel: skillData?.maxLevel ?? 1,
                  category: skillData?.category ?? "armor",
                  skillData,
                });
              }
            });
          }
        });
      }
    });

    return Array.from(skillMap.values()).sort(compareSkills);
  }, [equipmentSet, allSkillsData]);

  // 计算技能列表的两列布局
  const skillColumns = useMemo(() => {
    const totalSkills = aggregatedSkills.length;

    if (totalSkills === 0) {
      return { left: [], right: [] };
    }

    // 始终均分到两列
    const leftCount = Math.ceil(totalSkills / 2);
    return {
      left: aggregatedSkills.slice(0, leftCount),
      right: aggregatedSkills.slice(leftCount),
    };
  }, [aggregatedSkills]);

  const ARMOR_RESISTANCE_META = [
    { key: "fire", icon: "/attribute-type/fire.png", alt: "火耐性" },
    { key: "water", icon: "/attribute-type/water.png", alt: "水耐性" },
    { key: "elec", icon: "/attribute-type/elec.png", alt: "雷耐性" },
    { key: "ice", icon: "/attribute-type/ice.png", alt: "冰耐性" },
    { key: "dragon", icon: "/attribute-type/dragon.png", alt: "龙耐性" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>套装汇总</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 统计信息 */}
        <div className="space-y-4">
          {/* 属性统计：攻击、会心、防御 + 五种耐性（合并为一行） */}
          <div className="grid grid-cols-3 items-center gap-4 md:grid-cols-8">
            {/* 攻击 */}
            <div className="flex items-center justify-center gap-2">
              <img
                src="/skill-type/SKILL_0000.png"
                alt="攻击"
                className="h-4 w-4"
              />
              <span className="text-sm font-medium">{setStats.attack}</span>
            </div>
            {/* 会心 */}
            <div className="flex items-center justify-center gap-2">
              <img
                src="/skill-type/SKILL_0001.png"
                alt="会心"
                className="h-4 w-4"
              />
              <span className="text-sm font-medium">{setStats.critical}%</span>
            </div>
            {/* 防御 */}
            <div className="flex items-center justify-center gap-2">
              <img
                src="/skill-type/SKILL_0005.png"
                alt="防御"
                className="h-4 w-4"
              />
              <span className="text-sm font-medium">{setStats.defense}</span>
            </div>
            {/* 五种耐性 */}
            {ARMOR_RESISTANCE_META.map((meta, index) => (
              <div
                key={meta.key}
                className="flex items-center justify-center gap-2"
              >
                <img src={meta.icon} alt={meta.alt} className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {setStats.resistance[index]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 技能列表 */}
        <div className="space-y-4">
          {aggregatedSkills.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              尚未选择任何带有技能的装备。
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
              {/* 左侧列 */}
              <ul className="space-y-1">
                {skillColumns.left.map((skill) => (
                  <SkillItem
                    key={skill.skillId}
                    skillId={skill.skillId}
                    level={skill.level}
                    variant="full"
                  />
                ))}
              </ul>
              {/* 右侧列 */}
              {skillColumns.right.length > 0 && (
                <ul className="space-y-1">
                  {skillColumns.right.map((skill) => (
                    <SkillItem
                      key={skill.skillId}
                      skillId={skill.skillId}
                      level={skill.level}
                      variant="full"
                    />
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
