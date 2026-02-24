/**
 * @fileoverview Component for editing a list of skills with levels.
 * Allows adding, removing, and viewing skills within a limit.
 */

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSkills } from "@/hooks";
import { cn } from "@/lib/utils";
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
  /** Callback fired when a skill's level is updated. */
  onUpdate?: (skill: SkillWithLevel) => void;
  /** Maximum number of skills allowed. Defaults to 3. */
  maxSkills?: number;
  /** Visual variant of the editor items. */
  variant?: "full" | "default" | "compact";
}

/**
 * A component that provides an interface for managing a list of skills.
 * Displays current skills, empty slots, and a selector for adding new skills.
 */
export function SkillEditor({
  skills,
  onAdd,
  onRemove,
  onUpdate,
  maxSkills,
  variant = "default",
}: SkillEditorProps) {
  const { getSkillById } = useSkills();

  // Determine if there is a strict limit
  const isLimited = typeof maxSkills === "number";

  // Visual consistency: If limited, use the limit. If unlimited, default to 3 placeholders minimum.
  const targetSlots = isLimited ? maxSkills : 3;

  // Calculate how many empty placeholders to show
  const emptySlots = Math.max(0, targetSlots - skills.length);

  // If limited, strictly show up to maxSkills. If unlimited, show all.
  const displayedSkills = isLimited ? skills.slice(0, maxSkills) : skills;

  // Variant configuration
  const variantConfig = {
    full: {
      gap: "gap-3",
      rowHeight: "h-12",
      rowPadding: "p-2",
      labelClass: "text-base space-y-3",
      itemVariant: "full" as const,
      iconSize: "h-4 w-4",
    },
    default: {
      gap: "gap-3",
      rowHeight: "h-10",
      rowPadding: "p-2",
      labelClass: "text-base space-y-3",
      itemVariant: "default" as const,
      iconSize: "h-4 w-4",
    },
    compact: {
      gap: "gap-2",
      rowHeight: "h-8",
      rowPadding: "p-1",
      labelClass: "text-sm space-y-1.5",
      itemVariant: "compact" as const,
      iconSize: "h-3.5 w-3.5",
    },
  };

  const config = variantConfig[variant];

  const handleLevelChange = (
    skillId: string,
    currentLevel: number,
    delta: number,
  ) => {
    if (onUpdate) {
      onUpdate({ skillId, level: currentLevel + delta });
    }
  };

  return (
    <div className={cn("flex flex-col", config.gap)}>
      <Label className={cn("font-medium", config.labelClass)}>
        技能 ({skills.length}
        {isLimited ? `/${maxSkills}` : ""})
      </Label>

      {displayedSkills.map((skillWithLevel) => {
        const skill = getSkillById(skillWithLevel.skillId);

        if (!skill) {
          return (
            <div
              key={`empty-skill-${skillWithLevel.skillId}`}
              className={cn("bg-muted rounded-md", config.rowHeight)}
            />
          );
        }

        return (
          <div
            key={skillWithLevel.skillId}
            className={cn(
              "bg-muted flex items-center rounded-md",
              config.rowHeight,
              config.rowPadding,
              variant === "compact" ? "gap-1" : "gap-2",
            )}
          >
            <div className="min-w-0 flex-1">
              <SkillItem
                skillId={skillWithLevel.skillId}
                level={skillWithLevel.level}
                variant={config.itemVariant}
                onLevelChange={
                  onUpdate
                    ? (delta) =>
                        handleLevelChange(
                          skillWithLevel.skillId,
                          skillWithLevel.level,
                          delta,
                        )
                    : undefined
                }
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size={variant === "compact" ? "icon" : "sm"}
              className={cn("shrink-0", variant === "compact" && "h-6 w-6")}
              onClick={() => onRemove(skillWithLevel.skillId)}
            >
              <X className={config.iconSize} />
            </Button>
          </div>
        );
      })}

      {/* Fill empty skill slots for visual consistency or limit enforcement */}
      {Array.from({ length: emptySlots }, (_unused, index) => index).map(
        (index) => (
          <div
            key={`empty-skill-${skills.length + index}`}
            className={cn("bg-muted rounded-md", config.rowHeight)}
          />
        ),
      )}

      {/* Skill selector - Show if unlimited OR if not yet full */}
      {(!isLimited || skills.length < maxSkills) && (
        <SkillSelector
          onSelect={onAdd}
          excludeSkillIds={skills.map((s) => s.skillId)}
        />
      )}
    </div>
  );
}
