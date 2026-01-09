/**
 * @fileoverview Defines the Loading component for displaying a loading spinner.
 */

import { Loader2 } from "lucide-react";

/**
 * Props for the Loading component.
 */
interface LoadingProps {
  /** The message to display below the spinner. */
  message?: string;
}

/**
 * Renders a loading spinner with an optional message.
 *
 * This component is used to indicate that content is being loaded.
 */
export function Loading({ message = "加载中..." }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="text-primary h-8 w-8 animate-spin" />
      <p className="text-muted-foreground mt-4">{message}</p>
    </div>
  );
}
