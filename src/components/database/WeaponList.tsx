/**
 * @fileoverview Component for displaying a list of weapons.
 * It features filtering by weapon type and rarity, a search input, and a grid layout for weapons.
 */

import { useMemo, useState } from "react";

import { Edit } from "lucide-react";

import { FilterBar } from "@/components/common";
import { EquipmentCard } from "@/components/entities/";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RARITY_FILTERS, WEAPON_TYPE_LABELS } from "@/constants";
import { useSettings, useWeapon } from "@/hooks";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import {
  RARITY_RANGES,
  WEAPON_TYPES,
  type RarityRangeKey,
  type Weapon,
  type WeaponType,
} from "@/types";
import type { EquipmentCellType } from "@/types/set-builder";
import { getAssetPath, groupWeaponsIntoRows } from "@/utils";

const RARITY_COLUMNS_MAP = {
  low: [1, 2, 3, 4],
  high: [5, 6, 7, 8],
  master: [9, 10, 11, 12],
  all: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
};

export interface WeaponListProps {
  mode?: "display" | "selector";
  onWeaponSelect?: (weapon: Weapon) => void;
  selectingFor?: EquipmentCellType;
  currentWeapon?: Weapon | null;
  onEdit?: (weapon: Weapon) => void;
  isLocked?: boolean;
}

/**
 * A component that displays a list of weapons.
 * It supports filtering by weapon type and search, and uses a 12-column grid layout.
 */
export function WeaponList({
  mode = "display",
  onWeaponSelect,
  selectingFor,
  currentWeapon,
  onEdit,
  isLocked,
}: WeaponListProps) {
  // Fetch weapon data and settings.
  const { weapons, loading, error } = useWeapon();
  const { settings } = useSettings();

  // MARK: State Management
  const [selectedWeaponType, setSelectedWeaponType] = useState<WeaponType>(
    settings.defaultWeaponType,
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRarity, setSelectedRarity] = useState<RarityRangeKey>("all");

  // Responsive card variant.
  const is2Xl = useMediaQuery("(min-width: 1536px)");
  const cardVariant = useMemo(() => {
    if (mode === "display") {
      return is2Xl ? "full" : "default";
    }
    // Selector mode
    return is2Xl ? "default" : "compact";
  }, [mode, is2Xl]);

  // MARK: Data Processing
  // Filter, sort, and group weapons into rows.
  const weaponRows = useMemo(() => {
    if (!weapons) return [];

    // Filter by weapon type, rarity, and search query.
    const filteredWeapons = weapons.filter((weapon) => {
      // Rarity filter
      const range = RARITY_RANGES[selectedRarity];
      const rankMatch =
        weapon.rarity >= range.min && weapon.rarity <= range.max;

      if (!rankMatch) return false;

      // Weapon type and search query filter
      return (
        weapon.type === selectedWeaponType &&
        (searchQuery === "" ||
          weapon.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });

    // Sort by sortId (handled in groupWeaponsIntoRows, but explicit here).
    filteredWeapons.sort((a, b) => a.sortId - b.sortId);

    // Group weapons into rows.
    return groupWeaponsIntoRows(filteredWeapons);
  }, [weapons, selectedWeaponType, searchQuery, selectedRarity]);

  // Determine columns to display based on selected rarity.
  const rarityColumns = useMemo(() => {
    return RARITY_COLUMNS_MAP[selectedRarity];
  }, [selectedRarity]);

  // MARK: Render Logic
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">加载中...</div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-500">
        加载武器数据失败: {error}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* MARK: Toolbar */}
      <FilterBar.Root>
        <TooltipProvider>
          <FilterBar.Section className="w-full">
            {/* Left side: Weapon type toggle - Using 'contents' for fluid wrapping */}
            <ToggleGroup
              type="single"
              value={selectedWeaponType}
              onValueChange={(value) =>
                value && setSelectedWeaponType(value as WeaponType)
              }
              className="contents"
            >
              {WEAPON_TYPES.map((type) => (
                <FilterBar.ToggleItem
                  key={type}
                  value={type}
                  tooltip={WEAPON_TYPE_LABELS[type]}
                >
                  <FilterBar.Icon
                    src={getAssetPath(`/weapon-type/${type}.png`)}
                  />
                </FilterBar.ToggleItem>
              ))}
            </ToggleGroup>

            {/* Right side: Reset | Rarity | Search - Pushed to the right */}
            <div className="ms-auto flex flex-wrap items-center gap-1.5 sm:gap-2">
              <FilterBar.Reset
                onClick={() => {
                  setSelectedRarity("all");
                  setSearchQuery("");
                }}
                tooltip="全部武器"
              />

              <FilterBar.Separator />

              {/* Rarity Filter */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {RARITY_FILTERS.map(({ value, icon: Icon, label }) => (
                  <FilterBar.Button
                    key={value}
                    isSelected={selectedRarity === value}
                    onClick={() => setSelectedRarity(value)}
                    tooltip={label}
                  >
                    <Icon className="h-4 w-4" />
                  </FilterBar.Button>
                ))}
              </div>

              <FilterBar.Separator />

              {/* Search input */}
              <FilterBar.Search
                placeholder="搜索武器名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </FilterBar.Section>
        </TooltipProvider>
      </FilterBar.Root>

      {/* MARK: Weapon Table */}
      <div className="bg-card min-h-0 flex-1 overflow-x-auto rounded-lg border shadow-sm">
        <Table className={cn(selectedRarity === "all" ? "w-[300%]" : "")}>
          {/* Table Header */}
          <TableHeader>
            <TableRow>
              {rarityColumns.map((rarity, index) => (
                <TableHead
                  key={`header-${rarity}`}
                  className={cn(
                    "bg-primary text-primary-foreground text-center",
                    selectedRarity === "all" ? "w-1/12" : "w-1/4",
                    index === 0
                      ? "rounded-tl-lg"
                      : index === rarityColumns.length - 1
                        ? "rounded-tr-lg"
                        : "",
                  )}
                >
                  R{rarity}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody>
            {weaponRows.map((row, rowIndex) => {
              // Create a map of rarity to weapon for quick lookup.
              const weaponMap = new Map<number, Weapon>();
              row.forEach((weapon: Weapon) => {
                weaponMap.set(weapon.rarity, weapon);
              });

              return (
                <TableRow key={`row-${rowIndex}`}>
                  {rarityColumns.map((rarity) => {
                    const weapon = weaponMap.get(rarity);
                    const isSelector = mode === "selector";
                    const isSelected =
                      !!currentWeapon && currentWeapon?.id === weapon?.id;
                    const isMatchingSlot =
                      isSelector && selectingFor === "weapon";

                    return (
                      <TableCell
                        key={`cell-${rowIndex}-${rarity}`}
                        className={cn(
                          "relative p-2",
                          selectedRarity === "all" ? "w-1/12" : "w-1/4",
                          isSelector && "rounded-lg transition-colors",
                          isSelector &&
                            isMatchingSlot &&
                            "hover:bg-accent/50 cursor-pointer",
                          isSelector &&
                            !isMatchingSlot &&
                            "cursor-not-allowed opacity-50",
                        )}
                        onClick={
                          isSelector &&
                          onWeaponSelect &&
                          isMatchingSlot &&
                          weapon
                            ? () => onWeaponSelect(weapon)
                            : undefined
                        }
                      >
                        {weapon ? (
                          <div className="group">
                            <EquipmentCard
                              item={weapon}
                              variant={cardVariant}
                              isSelected={isSelected}
                            />
                            {mode === "display" && onEdit && !isLocked && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-1 right-1 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit(weapon);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground block text-center">
                            —
                          </span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
