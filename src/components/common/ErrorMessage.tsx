/**
 * @fileoverview Defines the ErrorMessage component for displaying errors.
 */

import { AlertCircle } from "lucide-react";

/**
 * Props for the ErrorMessage component.
 */
interface ErrorMessageProps {
  /** The error message to display. */
  message: string;
  /** Optional callback to be executed when the user clicks the retry button. */
  onRetry?: () => void;
}

/**
 * Renders a standardized error message box.
 *
 * Includes an icon, the error message, and an optional "Retry" button.
 */
export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
        <div className="flex-1">
          <p className="text-sm text-red-800">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm font-medium text-red-600 hover:text-red-700"
            >
              重试
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
