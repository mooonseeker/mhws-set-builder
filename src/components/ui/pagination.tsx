/**
 * @fileoverview A component for navigating between pages.
 */

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Props for the Pagination component.
 */
interface PaginationProps {
  /** The currently active page. */
  currentPage: number;
  /** The total number of pages. */
  totalPages: number;
  /** Callback fired when the page is changed. */
  onPageChange: (page: number) => void;
}

/**
 * A pagination component that allows users to navigate through a series of pages.
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevPage}
        disabled={currentPage <= 1}
        className="h-8 px-2"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="text-muted-foreground text-sm whitespace-nowrap">
        Page {currentPage} / {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={handleNextPage}
        disabled={currentPage >= totalPages}
        className="h-8 px-2"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
