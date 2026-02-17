/**
 * @fileoverview SkillItem component for displaying a single skill and its level.
 * Supports full, default, and compact variants with optional interactive level adjustment.
 */

import { useLayoutEffect, useRef, useState } from "react";

import { Minus, Plus, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  /** Callback for level changes. If provided, the item becomes interactive (except in compact variant). */
  onLevelChange?: (delta: number) => void;
}

/**
 * Displays a skill name, icon, and level information.
 */
export function SkillItem({
  skillId,
  level,
  variant = "default",
  onLevelChange,
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
  const canInteract = onLevelChange && variant !== "compact";

  // Generate level blocks (progress squares)
  const levelBlocks = Array.from({ length: maxLevel }, (_, i) => {
    const isActive = i < level;
    return (
      <Square
        key={i}
        className={cn(
          "h-4 w-4",
          isActive
            ? "fill-warning text-warning"
            : "fill-foreground/20 text-foreground/20",
        )}
      />
    );
  });

  // Common UI configs
  const heightClass = variant === "full" ? "h-8" : "h-6";
  const iconSizeClass = variant === "full" ? "w-6 h-6" : "w-4 h-4";
  const textSizeClass = variant === "full" ? "text-sm" : "text-xs";
  const btnSizeClass = variant === "full" ? "h-6 w-6" : "h-5 w-5";

  // Level text formatting
  const levelDisplay =
    variant === "full" ? `Lv${level}` : `Lv ${level}/${maxLevel}`;

  // Category-specific styles (Using negative margins to maintain alignment without bloat)
  const categoryStyles = {
    series: "border border-orange-400/50 bg-orange-400/10 rounded-sm px-1.5 -mx-1.5",
    group: "border border-blue-400/50 bg-blue-400/10 rounded-sm px-1.5 -mx-1.5",
    armor: "",
    weapon: "",
  }[skill.category];

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 transition-colors",
        heightClass,
        categoryStyles,
      )}
    >
      {/* MARK: Left Side - Icon and Name */}
      <div className="flex min-w-0 items-center gap-1.5">
        {variant !== "compact" && (
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

      {/* MARK: Right Side - Details and Interaction */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Visual blocks (Full mode only) */}
        {variant === "full" && (
          <div
            className="flex items-center gap-0.5 text-xs"
            aria-label={`等级进度 ${level}/${maxLevel}`}
          >
            {levelBlocks}
          </div>
        )}

        {/* Level Control/Display Area */}
        <div className="flex items-center">
          {canInteract ? (
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="outline"
                className={btnSizeClass}
                onClick={(e) => {
                  e.stopPropagation();
                  onLevelChange(-1);
                }}
                disabled={level <= 0}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span
                className={cn(
                  "text-center text-sm font-medium",
                  variant === "full" ? "w-8" : "w-12",
                  isOverflow
                    ? "text-destructive font-bold"
                    : isMaxLevel && "text-accent font-bold",
                )}
              >
                {levelDisplay}
              </span>
              <Button
                size="icon"
                variant="outline"
                className={btnSizeClass}
                onClick={(e) => {
                  e.stopPropagation();
                  onLevelChange(1);
                }}
                disabled={level >= maxLevel}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <span
              className={cn(
                "text-right font-medium",
                variant === "full" ? "w-8 text-sm" : "w-12 text-xs",
                "text-muted-foreground",
                isMaxLevel && "text-accent font-bold",
                isOverflow && "text-destructive font-bold",
              )}
            >
              {levelDisplay}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
