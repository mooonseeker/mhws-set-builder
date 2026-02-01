import { Edit } from "lucide-react";

import { EquipmentCard } from "@/components/entities";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Charm, CharmSortField, SortDirection } from "@/types";
import type { EquipmentCellType } from "@/types/set-builder";

interface CharmGalleryProps {
  charms: Charm[];
  variant?: "full" | "default" | "compact";
  selectingFor?: EquipmentCellType;
  currentCharm?: Charm | null;
  onEdit?: (charm: Charm) => void;
  onSelect?: (charm: Charm) => void;
  sortField: CharmSortField;
  sortDirection: SortDirection;
  onSortChange: (field: CharmSortField) => void;
}

export function CharmGallery({
  charms,
  variant = "full",
  selectingFor,
  currentCharm,
  onEdit,
  onSelect,
}: CharmGalleryProps) {
  return (
    <div className="bg-card min-h-0 flex-1 overflow-y-auto rounded-lg border p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {charms.map((charm) => {
          const isSelectable = !!onSelect;
          const isSelected = !!currentCharm && currentCharm.id === charm.id;
          const isMatchingSlot = !isSelectable || selectingFor === "charm";

          return (
            <div
              key={charm.id}
              className={cn(
                "group relative",
                isSelectable &&
                  isMatchingSlot &&
                  "cursor-pointer transition-transform hover:scale-102",
                isSelectable &&
                  !isMatchingSlot &&
                  "cursor-not-allowed opacity-50",
              )}
              onClick={
                isSelectable && onSelect && isMatchingSlot
                  ? () => onSelect(charm)
                  : undefined
              }
            >
              <EquipmentCard
                item={charm}
                variant={variant}
                isSelected={isSelected}
                className={cn(
                  isSelectable && isMatchingSlot && "hover:bg-accent/50",
                  isSelected && "ring-primary ring-2",
                )}
              />

              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-background/80 hover:bg-background absolute top-2 right-2 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(charm);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        })}
        {charms.length === 0 && (
          <div className="text-muted-foreground col-span-full flex h-40 items-center justify-center">
            没有找到符合条件的护石
          </div>
        )}
      </div>
    </div>
  );
}
