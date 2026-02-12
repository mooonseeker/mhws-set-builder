/**
 * @fileoverview A component to display detailed charm validation feedback.
 */

import { useMemo } from "react";

import {
  AlertTriangle,
  CheckCircle,
  Info,
  Star,
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
}

const THEMES: Record<string, ValidationTheme> = {
  SUPERIOR: {
    Icon: Star,
    containerClass:
      "rounded-lg border p-4 border-amber-500/20 bg-amber-500/10 text-amber-700 shadow-sm",
    iconClass: "h-5 w-5 flex-shrink-0 mt-0.5 text-amber-600 fill-amber-600/20",
    titleClass: "font-bold text-amber-800",
    listClass: "text-amber-800/90",
  },
  SUCCESS: {
    Icon: CheckCircle,
    containerClass:
      "rounded-lg border p-4 border-green-500/20 bg-green-500/10 text-green-700",
    iconClass: "h-5 w-5 flex-shrink-0 mt-0.5 text-green-700",
    titleClass: "font-medium text-green-800",
    listClass: "text-green-800/90",
  },
  WARNING: {
    Icon: Info,
    containerClass: "rounded-lg border p-4 border-warning/20 bg-warning/10",
    iconClass: "h-5 w-5 text-warning flex-shrink-0 mt-0.5",
    titleClass: "font-medium text-warning-foreground",
    listClass: "text-warning-foreground",
  },
  DESTRUCTIVE: {
    Icon: AlertTriangle,
    containerClass:
      "rounded-lg border p-4 border-destructive/20 bg-destructive/10",
    iconClass: "h-5 w-5 text-destructive flex-shrink-0 mt-0.5",
    titleClass: "font-medium mb-1 text-destructive",
    listClass: "text-destructive",
  },
};

// Maps validation status to a user-friendly message.
const getStatusMessage = (status: CharmValidationStatus): string => {
  switch (status) {
    case "ACCEPTED_AS_SUPERIOR":
      return "🌟 极品发现！可替代现有护石";
    case "REJECTED_AS_INFERIOR":
      return "验证不通过：已有更好替代品";
    case "ACCEPTED":
    default:
      return "验证通过：建议保留";
  }
};

/**
 * Displays detailed feedback from the charm validation logic.
 * It shows whether a charm is superior, accepted, or rejected,
 * and provides context like better or outclassed charms.
 */
export function CharmValidation({ validation }: CharmValidationProps) {
  // Memoize the display configuration to avoid re-calculating on every render.
  const displayConfig = useMemo(() => {
    if (!validation) {
      return null;
    }

    const { status, warnings, betterCharm, outclassedCharms } = validation;

    const isRejected = status === "REJECTED_AS_INFERIOR";
    const isSuperior = status === "ACCEPTED_AS_SUPERIOR";
    const hasWarnings = !!warnings?.length;

    // 1. Determine the theme based on status
    let theme = THEMES.SUCCESS;
    if (isRejected) {
      theme = THEMES.DESTRUCTIVE;
    } else if (isSuperior) {
      theme = THEMES.SUPERIOR;
    } else if (hasWarnings) {
      theme = THEMES.WARNING;
    }

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
          {(warnings?.length ?? 0) > 0 ||
          betterCharm ||
          (outclassedCharms?.length ?? 0) > 0 ? (
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
                  <li className={listClass}>• 存在以下更好的上位替代：</li>
                  <div className="mt-2 mb-4">
                    <EquipmentCard item={betterCharm} />
                  </div>
                </>
              )}

              {/* Render outclassed charms */}
              {outclassedCharms?.length ? (
                <>
                  <li className={listClass}>
                    • 存入库后将完爆以下 {outclassedCharms.length} 个护石：
                  </li>
                  <div className="mt-2 mb-4 space-y-2">
                    {outclassedCharms.slice(0, 3).map((charm, index) => (
                      <EquipmentCard key={`out-${index}`} item={charm} />
                    ))}
                    {outclassedCharms.length > 3 && (
                      <li className={listClass + " list-none italic"}>
                        ... 以及另外 {outclassedCharms.length - 3} 个护石
                      </li>
                    )}
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
