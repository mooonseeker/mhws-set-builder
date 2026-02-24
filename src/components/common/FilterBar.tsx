/**
 * @fileoverview Unified FilterBar components for consistent layout across database lists.
 * Provides a set of sub-components to build flexible and responsive filter bars.
 */

import React from "react";

import { RotateCcw } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface RootProps {
  children: React.ReactNode;
  className?: string;
}

export function FilterBarRoot({ children, className }: RootProps) {
  return (
    <div
      className={cn(
        "bg-card shrink-0 rounded-lg border p-2 shadow-sm sm:p-4",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        {children}
      </div>
    </div>
  );
}

interface SectionProps {
  children: React.ReactNode;
  className?: string;
}

export function FilterBarSection({ children, className }: SectionProps) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-1.5 sm:gap-2", className)}
    >
      {children}
    </div>
  );
}

export function FilterBarSeparator() {
  return <div className="bg-border mx-0.5 h-6 w-px shrink-0" />;
}

/** Standardized button for the filter bar. */
export function FilterBarButton({
  children,
  className,
  isSelected,
  tooltip,
  ...props
}: ButtonProps & { isSelected?: boolean; tooltip?: string }) {
  const button = (
    <Button
      variant={isSelected ? "default" : "outline"}
      size="icon"
      className={cn("h-9 w-9 shrink-0 p-0 transition-all", className)}
      {...props}
    >
      {children}
    </Button>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    );
  }

  return button;
}

/** Standardized toggle item for the filter bar. */
export function FilterBarToggleItem({
  children,
  className,
  tooltip,
  ...props
}: React.ComponentPropsWithoutRef<typeof ToggleGroupItem> & {
  tooltip?: string;
}) {
  return (
    <ToggleGroupItem
      variant="primary"
      className={cn("h-9 w-9 shrink-0 p-0 transition-all", className)}
      tooltip={tooltip}
      {...props}
    >
      {children}
    </ToggleGroupItem>
  );
}

/** Standardized image icon for filter buttons. */
export function FilterBarIcon({
  src,
  alt,
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn("h-5 w-5 transition-all", className)}
    />
  );
}

interface ResetProps {
  onClick: () => void;
  tooltip?: string;
  className?: string;
}

export function FilterBarReset({
  onClick,
  tooltip = "重置筛选",
  className,
}: ResetProps) {
  return (
    <FilterBarButton
      onClick={onClick}
      tooltip={tooltip}
      className={cn("hover:bg-accent hover:text-accent-foreground", className)}
    >
      <RotateCcw className="h-4 w-4" />
    </FilterBarButton>
  );
}

interface SearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function FilterBarSearch({ className, ...props }: SearchProps) {
  return (
    <Input
      type="text"
      {...props}
      className={cn("h-9 max-w-40 flex-1 shrink-0", className)}
    />
  );
}

interface CountProps {
  count: number;
  label: string;
  className?: string;
}

export function FilterBarCount({ count, label, className }: CountProps) {
  return (
    <div
      className={cn(
        "text-muted-foreground text-sm whitespace-nowrap",
        className,
      )}
    >
      共 {count} {label}
    </div>
  );
}

interface CollapsibleProps {
  children: React.ReactNode;
  isVisible: boolean;
  className?: string;
}

export function FilterBarCollapsible({
  children,
  isVisible,
  className,
}: CollapsibleProps) {
  if (!isVisible) return null;
  return (
    <div
      className={cn(
        "bg-muted mt-2 shrink-0 space-y-4 rounded-lg p-4 sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
