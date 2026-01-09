/**
 * @fileoverview A component to display detailed charm validation feedback.
 */

import { useMemo } from "react";

import {
  AlertTriangle,
  CheckCircle,
  Info,
  type LucideIcon,
} from "lucide-react";

import { EquipmentCard } from "@/components/entities";
import type { CharmValidationResult, CharmValidationStatus } from "@/types";

interface CharmValidationProps {
  validation: CharmValidationResult | null;
}

// Theme configuration for different validation statuses.
interface ValidationTheme {
  Icon: LucideIcon;
  containerClass: string;
  iconClass: string;
  titleClass: string;
  listClass: string;
  charmListClass: string;
}

const THEMES: Record<string, ValidationTheme> = {
  SUCCESS: {
    Icon: CheckCircle,
    containerClass:
      "rounded-lg border p-4 border-green-500/20 bg-green-500/10 text-green-700",
    iconClass: "h-5 w-5 flex-shrink-0 mt-0.5 text-green-700",
    titleClass: "font-medium text-green-800",
    listClass: "text-green-800/90",
    charmListClass: "text-green-800/90",
  },
  WARNING: {
    Icon: Info,
    containerClass: "rounded-lg border p-4 border-warning/20 bg-warning/10",
    iconClass: "h-5 w-5 text-warning flex-shrink-0 mt-0.5",
    titleClass: "font-medium text-warning-foreground",
    listClass: "text-warning-foreground",
    charmListClass: "text-amber-800",
  },
  DESTRUCTIVE: {
    Icon: AlertTriangle,
    containerClass:
      "rounded-lg border p-4 border-destructive/20 bg-destructive/10",
    iconClass: "h-5 w-5 text-destructive flex-shrink-0 mt-0.5",
    titleClass: "font-medium mb-1 text-destructive",
    listClass: "text-destructive",
    charmListClass: "text-destructive",
  },
};

// Maps validation status to a user-friendly message.
const getStatusMessage = (status: CharmValidationStatus): string => {
  switch (status) {
    case "REJECTED_AS_INFERIOR":
      return "验证不通过";
    case "ACCEPTED_AS_FIRST":
      return "1️⃣ 欢迎添加第一个护石";
    case "ACCEPTED_BY_MAX_VALUE":
      return "🥇 核心技能价值达到新高！";
    case "ACCEPTED_BY_MAX_SLOTS":
      return "🌟 等效孔位数量达到新高！";
    case "ACCEPTED_AS_UNIQUE_SKILL":
      return "✨ 带全新技能的护石";
    case "ACCEPTED":
      return "验证通过";
    default:
      return "验证通过";
  }
};

/**
 * Displays detailed feedback from the charm validation logic.
 * It shows whether a charm is accepted, rejected, or has warnings,
 * and provides context like superior or outclassed charms.
 */
export function CharmValidation({ validation }: CharmValidationProps) {
  // Memoize the display configuration to avoid re-calculating on every render.
  const displayConfig = useMemo(() => {
    if (!validation) {
      return null;
    }

    const { status, warnings, betterCharm, outclassedCharms } = validation;

    const isRejected = status === "REJECTED_AS_INFERIOR";
    const hasWarnings = !!warnings?.length;

    // 1. Determine the theme based on status
    const theme = isRejected
      ? THEMES.DESTRUCTIVE
      : hasWarnings
        ? THEMES.WARNING
        : THEMES.SUCCESS;

    // 2. Get the primary status message
    const message = getStatusMessage(status);

    return {
      theme,
      message,
      warnings,
      betterCharm,
      outclassedCharms,
    };
  }, [validation]);

  if (!displayConfig) {
    return null;
  }

  const { theme, message, warnings, betterCharm, outclassedCharms } =
    displayConfig;
  const { Icon, containerClass, iconClass, titleClass, listClass } = theme;

  return (
    <div className={containerClass}>
      <div className="flex items-start gap-3">
        <Icon className={iconClass} />
        <div className="flex-1">
          <p className={titleClass}>{message}</p>
          {warnings?.length || betterCharm || outclassedCharms?.length ? (
            <ul className="mt-2 space-y-2 text-sm">
              {/* Render warnings */}
              {warnings?.map((warning, index) => (
                <li key={`warn-${index}`} className={listClass}>
                  • {warning}
                </li>
              ))}

              {/* Render superior charm */}
              {betterCharm && (
                <>
                  <li className={listClass}>• 存在以下1个上位替代：</li>
                  <div className="mt-2 mb-4">
                    <EquipmentCard item={betterCharm} />
                  </div>
                </>
              )}

              {/* Render outclassed charms */}
              {outclassedCharms?.length ? (
                <>
                  <li className={listClass}>
                    • 可上位替代以下{outclassedCharms.length}个护石：
                  </li>
                  <div className="mt-2 mb-4 space-y-2">
                    {outclassedCharms.slice(0, 3).map((charm, index) => (
                      <EquipmentCard key={`out-${index}`} item={charm} />
                    ))}
                  </div>
                </>
              ) : null}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
