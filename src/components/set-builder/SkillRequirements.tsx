import { Search } from "lucide-react";
import { useMemo } from "react";

import { SkillSelector } from "@/components/skills";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSkills } from "@/contexts";
import { useSetBuilder } from "@/contexts/SetBuilderContext";
import { cn } from "@/lib/utils";
import { compareSkills } from "@/utils";

export function SkillRequirements() {
  const {
    requiredSkills,
    updateRequiredSkillLevel,
    startSearch,
    isSearching,
    addRequiredSkill,
  } = useSetBuilder();
  const { getSkillById } = useSkills();

  const handleLevelChange = (
    skillId: string,
    currentLevel: number,
    change: number,
  ) => {
    const newLevel = currentLevel + change;
    updateRequiredSkillLevel(skillId, newLevel);
  };

  const sortedSkills = useMemo(() => {
    return requiredSkills
      .map((skill) => ({
        ...skill,
        skillData: getSkillById(skill.skillId),
      }))
      .sort(compareSkills);
  }, [requiredSkills, getSkillById]);

  const skillColumns = useMemo(() => {
    const totalSkills = sortedSkills.length;
    if (totalSkills === 0) return { left: [], right: [] };

    const leftCount = Math.ceil(totalSkills / 2);
    return {
      left: sortedSkills.slice(0, leftCount),
      right: sortedSkills.slice(leftCount),
    };
  }, [sortedSkills]);

  const renderSkillItem = (skill: (typeof sortedSkills)[0]) => {
    const skillInfo = skill.skillData;
    if (!skillInfo) return null;

    return (
      <li key={skill.skillId} className="flex h-8 items-center justify-between">
        <div className="flex min-w-0 items-center gap-1.5">
          <img
            src={`/skill-type/${skillInfo.type}.png`}
            alt={skillInfo.name}
            className="h-5 w-5"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <span
            className={cn(
              "truncate text-sm",
              skillInfo.isKey ? "font-bold" : "font-medium",
            )}
          >
            {skillInfo.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleLevelChange(skill.skillId, skill.level, -1)}
          >
            -
          </Button>
          <span className="w-8 text-center">Lv {skill.level}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleLevelChange(skill.skillId, skill.level, 1)}
          >
            +
          </Button>
        </div>
      </li>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>技能需求</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {requiredSkills.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            请通过下方的技能选择器添加技能需求。
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <ul className="space-y-2">
              {skillColumns.left.map(renderSkillItem)}
            </ul>
            {skillColumns.right.length > 0 && (
              <ul className="space-y-2">
                {skillColumns.right.map(renderSkillItem)}
              </ul>
            )}
          </div>
        )}

        {/* 底部：技能选择器和搜索按钮 */}
        <div className="border-border border-t pt-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <SkillSelector
                onSelect={addRequiredSkill}
                excludeSkillIds={requiredSkills.map((s) => s.skillId)}
              />
            </div>
            <Button
              onClick={startSearch}
              disabled={isSearching}
              className="shrink-0"
            >
              <Search className="mr-2 h-4 w-4" />
              搜索
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
