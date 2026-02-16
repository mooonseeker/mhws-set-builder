/**
 * @fileoverview SkillItem component for displaying a single skill and its level.
 */

import { useLayoutEffect, useRef, useState } from "react";

import { Square } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSkills } from "@/hooks";
import { cn } from "@/lib/utils";
import { getAssetPath } from "@/utils";

/** Props for the SkillItem component. */
interface SkillItemProps {
  skillId: string;
  level: number;
  variant?: "full" | "default" | "compact";
}

/**
 * Displays a skill name, icon, and level blocks.
 * Supports different variants: full, default, and compact.
 */
export function SkillItem({
  skillId,
  level,
  variant = "default",
}: SkillItemProps) {
  const { getSkillById } = useSkills();
  const skill = getSkillById(skillId);
  const [isTruncated, setIsTruncated] = useState(false);
  const nameRef = useRef<HTMLSpanElement>(null);

  const name = skill?.name;

  useLayoutEffect(() => {
    const checkTruncation = () => {
      if (nameRef.current) {
        setIsTruncated(
          nameRef.current.scrollWidth > nameRef.current.offsetWidth,
        );
      }
    };

    checkTruncation();
    window.addEventListener("resize", checkTruncation);
    return () => window.removeEventListener("resize", checkTruncation);
  }, [name, variant]);

  if (!skill) {
    return null;
  }

  const { maxLevel, type, isKey } = skill;
  const isMaxLevel = level >= maxLevel;
  const isOverflow = level > maxLevel;

  // Generate level blocks using lucide Square icons
  const levelBlocks = Array.from({ length: maxLevel }, (_, i) => {
    const isActive = i < level;
    return (
      <Square
        key={i}
        className={cn(
          "h-3 w-3",
          isActive
            ? "fill-warning text-warning"
            : "fill-foreground text-foreground",
        )}
      />
    );
  });

  // Determine styles based on variant
  const heightClass = variant === "full" ? "h-8" : "h-6";
  const iconSizeClass = variant === "full" ? "w-5 h-5" : "w-4 h-4";
  const textSizeClass = variant === "full" ? "text-sm" : "text-xs";
  const showIcon = variant !== "compact";

  return (
    <div className={cn("flex items-center justify-between gap-2", heightClass)}>
      <div className="flex min-w-0 items-center gap-1.5">
        {showIcon && (
          <img
            src={getAssetPath(`/skill-type/${type}.png`)}
            alt={name}
            className={cn(iconSizeClass)}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
        <TooltipProvider>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <span
                ref={nameRef}
                className={cn(
                  "cursor-default truncate",
                  textSizeClass,
                  isKey ? "font-bold" : "font-medium",
                )}
              >
                {name}
              </span>
            </TooltipTrigger>
            {isTruncated && (
              <TooltipContent>
                <p>{name}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex shrink-0 items-center">
        {variant === "full" ? (
          <>
            <div
              className="flex items-center gap-0.5 text-xs"
              aria-label={`等级 ${level}/${maxLevel}`}
            >
              {levelBlocks}
            </div>
            <span
              className={cn(
                "w-8 text-right text-sm",
                isOverflow
                  ? "text-destructive text-base font-bold"
                  : isMaxLevel && "text-accent text-base font-bold",
              )}
            >
              Lv{level}
            </span>
          </>
        ) : (
          <span
            className={cn(
              "text-muted-foreground text-right text-xs",
              "w-10",
              isMaxLevel && "text-accent font-bold",
            )}
          >
            Lv {level}/{maxLevel}
          </span>
        )}
      </div>
    </div>
  );
}
