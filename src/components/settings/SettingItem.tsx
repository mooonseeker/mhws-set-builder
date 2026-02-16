/**
 * @fileoverview Atomic components for building the settings interface.
 * Provides SettingGroup for categorization and SettingItem for individual controls.
 */

import { type ReactNode } from "react";

import { Info } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SettingGroupProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * A container for grouping related settings together.
 */
export function SettingGroup({
  title,
  icon,
  children,
  className,
}: SettingGroupProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 px-1">
        {icon && <div className="text-muted-foreground">{icon}</div>}
        <h3 className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
          {title}
        </h3>
      </div>
      <Card>
        <CardContent className="divide-y p-0">{children}</CardContent>
      </Card>
    </div>
  );
}

interface SettingItemProps {
  label: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * An individual setting row with a label, optional description (via tooltip), and control.
 */
export function SettingItem({
  label,
  description,
  icon,
  children,
  className,
}: SettingItemProps) {
  return (
    <div
      className={cn(
        "hover:bg-muted/30 flex items-center justify-between p-4 transition-colors sm:p-6",
        className,
      )}
    >
      <div className="mr-4 flex items-center gap-3">
        {icon && <div className="text-muted-foreground shrink-0">{icon}</div>}
        <div className="flex items-center gap-1.5">
          <span className="text-sm leading-none font-medium">{label}</span>
          {description && (
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Info className="text-muted-foreground/40 hover:text-muted-foreground h-4 w-4 cursor-help transition-colors" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs leading-relaxed">{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
