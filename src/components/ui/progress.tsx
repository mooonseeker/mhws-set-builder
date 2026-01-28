import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A reusable Progress bar component.
 */
interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The progress value from 0 to 100. */
  value?: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-secondary relative h-4 w-full overflow-hidden rounded-full",
        className,
      )}
      {...props}
    >
      <div
        className="bg-primary h-full w-full flex-1 transition-all duration-300 ease-in-out"
        style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
      />
    </div>
  ),
);
Progress.displayName = "Progress";

export { Progress };
