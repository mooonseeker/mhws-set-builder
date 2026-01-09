/**
 * @fileoverview A slider component for selecting a value from a range.
 */

import * as React from "react";

import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

/**
 * Props for the Slider component.
 */
interface SliderProps extends React.ComponentPropsWithoutRef<
  typeof SliderPrimitive.Root
> {
  /** If `true`, the tick marks below the slider will be hidden. */
  hideTicks?: boolean;
  /** An array of values to be displayed as tick marks. If not provided, ticks are generated automatically based on `min`, `max`, and `step`. */
  ticks?: (number | string)[];
}

/**
 * A slider component that allows users to select a value or a range of values.
 * It can display tick marks and supports all the props of the Radix Slider.
 */
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, hideTicks = false, ticks, ...props }, ref) => {
  // Generate default ticks if not provided
  const defaultTicks = React.useMemo(() => {
    if (ticks) return ticks;
    if (!props.min || !props.max || !props.step) return [];

    const min = props.min;
    const max = props.max;
    const step = props.step;
    const tickCount = Math.floor((max - min) / step) + 1;

    return Array.from({ length: tickCount }, (_, i) => min + i * step);
  }, [ticks, props.min, props.max, props.step]);

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none items-center select-none",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="bg-secondary relative h-2 w-full grow overflow-hidden rounded-full">
        <SliderPrimitive.Range className="bg-primary absolute h-full" />
      </SliderPrimitive.Track>
      {/*
        Radix Slider automatically renders one thumb for each value in the array.
        We map over the values to ensure we render the correct number of thumbs
        and apply the same styling to all of them.
      */}
      {(props.value ?? props.defaultValue ?? [0]).map((_, index) => (
        <SliderPrimitive.Thumb
          key={index}
          className="border-primary bg-background ring-offset-background focus-visible:ring-ring block h-5 w-5 rounded-full border-2 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
      {!hideTicks && defaultTicks.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-full mt-2">
          {defaultTicks.map((tick, index) => {
            // Calculate position considering thumb width (1.25rem = 20px)
            // Effective distribution width: 100% - 1.25rem, with 0.625rem margins on both sides
            const position =
              defaultTicks.length > 1
                ? `calc(0.625rem + (100% - 1.25rem) * ${index / (defaultTicks.length - 1)})`
                : "calc(0.625rem)";

            return (
              <div
                key={index}
                className="absolute flex flex-col items-center"
                style={{
                  left: position,
                  transform: "translateX(-50%)",
                }}
              >
                <span className="bg-border mb-1 h-2 w-px" />
                <span className="text-muted-foreground pointer-events-auto text-xs whitespace-nowrap">
                  {tick}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </SliderPrimitive.Root>
  );
});

Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
