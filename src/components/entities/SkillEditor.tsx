/**
 * @fileoverview Component for editing a list of skills with levels.
 * Allows adding, removing, and viewing skills within a limit.
 */

import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSkills } from "@/hooks";
import { type SkillWithLevel } from "@/types";

import { SkillItem } from "./SkillItem";
import { SkillSelector } from "./SkillSelector";

/**
 * Props for the SkillEditor component.
 */
interface SkillEditorProps {
  /** List of current skills with their levels. */
  skills: SkillWithLevel[];
  /** Callback fired when a new skill is added. */
  onAdd: (skill: SkillWithLevel) => void;
  /** Callback fired when a skill is removed. */
  onRemove: (skillId: string) => void;
  /** Maximum number of skills allowed. Defaults to 3. */
  maxSkills?: number;
}

/**
 * A component that provides an interface for managing a list of skills.
 * Displays current skills, empty slots, and a selector for adding new skills.
 */
export function SkillEditor({
  skills,
  onAdd,
  onRemove,
  maxSkills = 3,
}: SkillEditorProps) {
  const { getSkillById } = useSkills();

  return (
    <div className="flex flex-col gap-3">
      <Label className="space-y-3 text-base font-medium">
        技能 ({skills.length}/{maxSkills})
      </Label>

      {skills.slice(0, maxSkills).map((skillWithLevel) => {
        const skill = getSkillById(skillWithLevel.skillId);

        if (!skill) {
          return (
            <div
              key={`empty-skill-${skillWithLevel.skillId}`}
              className="h-10"
            />
          );
        }

        return (
          <div
            key={skillWithLevel.skillId}
            className="bg-muted flex h-10 items-center gap-2 rounded-md p-2"
          >
            <div className="flex-1">
              <SkillItem
                skillId={skillWithLevel.skillId}
                level={skillWithLevel.level}
                variant="default"
              />
            </div>
            <Badge variant="outline">
              {skill.category === "weapon"
                ? "武器"
                : skill.category === "armor"
                  ? "防具"
                  : "特殊"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(skillWithLevel.skillId)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
      {/* Fill empty skill slots */}
      {Array.from(
        { length: Math.max(0, maxSkills - skills.length) },
        (_unused, index) => index,
      ).map((index) => (
        <div
          key={`empty-skill-${skills.length + index}`}
          className="bg-muted h-10 rounded-md"
        />
      ))}

      {/* Skill selector */}
      <SkillSelector
        onSelect={onAdd}
        excludeSkillIds={skills.map((s) => s.skillId)}
      />
    </div>
  );
}
