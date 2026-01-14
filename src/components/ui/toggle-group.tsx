/**
 * @fileoverview A set of two-state buttons that can be toggled on or off.
 */
"use client";

import * as React from "react";

import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

import { toggleVariants } from "./toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: "default",
  variant: "default",
});

/**
 * A container for a group of toggle buttons.
 */
const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn("flex items-center justify-center gap-1", className)}
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant, size }}>
      <TooltipProvider>{children}</TooltipProvider>
    </ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
));

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

/**
 * Props for the ToggleGroupItem component.
 */
interface ToggleGroupItemProps
  extends
    React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>,
    VariantProps<typeof toggleVariants> {
  /** The content to display in the tooltip. */
  tooltip?: string | React.ReactNode;
}

/**
 * An individual toggle button within a ToggleGroup.
 * It can optionally display a tooltip on hover.
 */
const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  ToggleGroupItemProps
>(({ className, children, variant, size, tooltip, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext);

  const item = (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: context.variant ?? variant,
          size: context.size ?? size,
        }),
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {/* The div is necessary to ensure the tooltip trigger works correctly with the toggle item. */}
          <div style={{ display: "inline-flex" }}>{item}</div>
        </TooltipTrigger>
        <TooltipContent>
          {typeof tooltip === "string" ? <p>{tooltip}</p> : tooltip}
        </TooltipContent>
      </Tooltip>
    );
  }

  return item;
});

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

export { ToggleGroup, ToggleGroupItem };
