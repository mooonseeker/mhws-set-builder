import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { useMemo } from "react";

import { EquipmentCard } from "@/components/entities";

import type { LucideIcon } from "lucide-react";
import type { CharmValidationResult, CharmValidationStatus } from "@/types";

interface CharmValidationProps {
  validation: CharmValidationResult | null;
}

// 主题配置
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

// 集中处理状态信息
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
 * 护石验证提示组件（重构版）
 * 显示来自新验证逻辑的详细信息
 */
export function CharmValidation({ validation }: CharmValidationProps) {
  // 使用 useMemo 优化性能，避免在每次渲染时都重新计算
  const displayConfig = useMemo(() => {
    if (!validation) {
      return null;
    }

    const { status, warnings, betterCharm, outclassedCharms } = validation;

    const isRejected = status === "REJECTED_AS_INFERIOR";
    const hasWarnings = !!warnings?.length;

    // 1. 决定主题
    const theme = isRejected
      ? THEMES.DESTRUCTIVE
      : hasWarnings
        ? THEMES.WARNING
        : THEMES.SUCCESS;

    // 2. 获取主信息
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
              {/* 渲染警告信息 */}
              {warnings?.map((warning, index) => (
                <li key={`warn-${index}`} className={listClass}>
                  • {warning}
                </li>
              ))}

              {/* 渲染上位替代护石 */}
              {betterCharm && (
                <>
                  <li className={listClass}>• 存在以下1个上位替代：</li>
                  <div className="mt-2 mb-4">
                    <EquipmentCard item={betterCharm} />
                  </div>
                </>
              )}

              {/* 渲染下位替代护石 */}
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
