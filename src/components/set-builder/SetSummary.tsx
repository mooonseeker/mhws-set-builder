/**
 * @fileoverview Component for displaying a summary of the current equipment set.
 */

import { useMemo } from "react";

import { SkillItem } from "@/components/entities/";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSkills } from "@/hooks";
import type {
  Accessory,
  Armor,
  Charm,
  Skill,
  SkillWithLevel,
  Weapon,
} from "@/types";
import type { EquipmentSet, SlottedEquipment } from "@/types/set-builder";
import { compareSkills } from "@/utils";

/** Props for SetSummary component. */
export interface SetSummaryProps {
  /** The equipment set to summarize. */
  equipmentSet: EquipmentSet;
}

/**
 * Renders a summary of total stats and aggregated skills for the given equipment set.
 */
export function SetSummary({ equipmentSet }: SetSummaryProps) {
  const { skills: allSkillsData } = useSkills();

  // Calculate aggregate stats for the set
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

        // Weapon attributes
        if ("attack" in equipment) {
          totalAttack += equipment.attack;
          totalCritical += equipment.critical;
          totalDefense += equipment.defense || 0;
        }

        // Armor attributes
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

    // Iterate through all equipment pieces
    (
      Object.values(equipmentSet) as (
        | SlottedEquipment<Weapon | Armor | Charm>
        | undefined
      )[]
    ).forEach((slottedPiece) => {
      if (slottedPiece) {
        // Accumulate innate skills from equipment
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
        // Accumulate skills from accessories
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

  // Split skills into two columns for layout
  const skillColumns = useMemo(() => {
    const totalSkills = aggregatedSkills.length;

    if (totalSkills === 0) {
      return { left: [], right: [] };
    }

    // Evenly distribute skills between columns
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
        {/* Stats Section */}
        <div className="space-y-4">
          {/* Stats: Attack, Critical, Defense + 5 Resistances */}
          <div className="grid grid-cols-3 items-center gap-4 md:grid-cols-8">
            {/* Attack */}
            <div className="flex items-center justify-center gap-2">
              <img
                src="/skill-type/SKILL_0000.png"
                alt="攻击"
                className="h-4 w-4"
              />
              <span className="text-sm font-medium">{setStats.attack}</span>
            </div>
            {/* Critical */}
            <div className="flex items-center justify-center gap-2">
              <img
                src="/skill-type/SKILL_0001.png"
                alt="会心"
                className="h-4 w-4"
              />
              <span className="text-sm font-medium">{setStats.critical}%</span>
            </div>
            {/* Defense */}
            <div className="flex items-center justify-center gap-2">
              <img
                src="/skill-type/SKILL_0005.png"
                alt="防御"
                className="h-4 w-4"
              />
              <span className="text-sm font-medium">{setStats.defense}</span>
            </div>
            {/* Elemental Resistances */}
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

        {/* Skill List Section */}
        <div className="space-y-4">
          {aggregatedSkills.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              尚未选择任何带有技能的装备。
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
              {/* Left Column */}
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
              {/* Right Column */}
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
