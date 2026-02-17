/**
 * @fileoverview Component for managing skill requirements in automatic search mode.
 */

import { useMemo } from "react";

import { RefreshCw, Search } from "lucide-react";

import { SkillItem, SkillSelector } from "@/components/entities/";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSetBuilder, useSkills } from "@/hooks";
import { compareSkillsPriority } from "@/utils";

/**
 * Renders a list of required skills and a selector to add more.
 */
export function SkillRequirements() {
  const {
    requiredSkills,
    updateRequiredSkillLevel,
    startSearch,
    isSearching,
    addRequiredSkill,
    resetRequiredSkills,
  } = useSetBuilder();
  const { getSkillById } = useSkills();

  const handleLevelChange = (
    skillId: string,
    currentLevel: number,
    delta: number,
  ) => {
    updateRequiredSkillLevel(skillId, currentLevel + delta);
  };

  const sortedSkills = useMemo(() => {
    return requiredSkills
      .map((skill) => ({
        ...skill,
        skillData: getSkillById(skill.skillId),
      }))
      .sort(compareSkillsPriority);
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
    return (
      <li key={skill.skillId}>
        <SkillItem
          skillId={skill.skillId}
          level={skill.level}
          variant="full"
          onLevelChange={(delta) =>
            handleLevelChange(skill.skillId, skill.level, delta)
          }
        />
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

        {/* Footer: Skill selector and search button */}
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
            <Button
              variant="outline"
              onClick={resetRequiredSkills}
              title="重置技能需求"
              className="shrink-0"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              重置
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
