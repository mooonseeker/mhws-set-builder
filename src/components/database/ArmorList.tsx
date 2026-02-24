/**
 * @fileoverview Component for displaying a list of armor sets grouped by series.
 * It supports filtering by rarity and search, and has different modes for display or selection.
 */

import { useCallback, useMemo, useState } from "react";

import { Edit } from "lucide-react";

import { ErrorMessage, FilterBar, Loading } from "@/components/common";
import { EquipmentCard } from "@/components/entities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DEFAULT_ARMOR_SERIES_PER_PAGE, RARITY_FILTERS } from "@/constants";
import { useArmor, useMediaQuery, useSkills } from "@/hooks";
import { cn } from "@/lib/utils";
import { DataStorage } from "@/services/storage";
import {
  RARITY_RANGES,
  type AppSettings,
  type Armor,
  type ArmorType,
  type GroupedArmor,
  type RarityRangeKey,
  type SkillWithLevel,
} from "@/types";
import type { EquipmentCellType } from "@/types/set-builder";
import { groupArmorBySeries } from "@/utils";

const ARMOR_COLUMNS: { key: ArmorType; label: string }[] = [
  { key: "helm", label: "头盔" },
  { key: "body", label: "胸甲" },
  { key: "arm", label: "臂甲" },
  { key: "waist", label: "腰甲" },
  { key: "leg", label: "腿甲" },
];

/**
 * Displays a list of armor, grouped by series, in a table format.
 */
export interface ArmorListProps {
  mode?: "display" | "selector";
  onPieceSelect?: (piece: Armor) => void;
  /** The equipment slot being selected for. */
  selectingFor?: EquipmentCellType;
  /** The currently selected armor piece. */
  currentPiece?: Armor | null;
  onEdit?: (piece: Armor) => void;
  isLocked?: boolean;
}

export function ArmorList({
  mode = "display",
  onPieceSelect,
  selectingFor,
  currentPiece,
  onEdit,
  isLocked,
}: ArmorListProps) {
  const { armor, loading, error } = useArmor();
  const { skills } = useSkills();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRarity, setSelectedRarity] = useState<RarityRangeKey>("all");

  const armorSeriesPerPage =
    DataStorage.loadData<AppSettings>("settings")[0]?.armorSeriesPerPage ??
    DEFAULT_ARMOR_SERIES_PER_PAGE;

  const is2Xl = useMediaQuery("(min-width: 1536px)");
  const cardVariant = useMemo(() => {
    if (mode === "display") {
      return is2Xl ? "full" : "default";
    }
    // selector mode
    return is2Xl ? "default" : "compact";
  }, [mode, is2Xl]);

  // Helper function to get a skill name by its ID.
  const getSkillName = useCallback(
    (skillId: string) => {
      const skill = skills.find((s) => s.id === skillId);
      return skill?.name ?? "Unknown Skill";
    },
    [skills],
  );

  /**
   * Groups armor pieces by series and calculates full set skills.
   */
  const groupedArmor = useMemo((): GroupedArmor[] => {
    return groupArmorBySeries(armor);
  }, [armor]);

  /**
   * Handles search filtering and pagination.
   */
  const filteredAndPaginatedArmor = useMemo(() => {
    // Search filtering
    let filtered = groupedArmor;

    if (searchQuery) {
      const keyword = searchQuery.toLowerCase();
      filtered = groupedArmor.filter((group) => {
        // Check series name
        if (group.series.toLowerCase().includes(keyword)) return true;

        // Check equipment names
        const pieceNames = [
          group.helm?.name,
          group.body?.name,
          group.arm?.name,
          group.waist?.name,
          group.leg?.name,
        ].filter(Boolean);

        if (pieceNames.some((name) => name?.toLowerCase().includes(keyword)))
          return true;

        // Check skill names
        const skillNames = group.fullSetSkills.map((skill) =>
          getSkillName(skill.skillId),
        );
        return skillNames.some((name) => name.toLowerCase().includes(keyword));
      });
    }

    // Rarity filtering
    if (selectedRarity !== "all") {
      const range = RARITY_RANGES[selectedRarity];
      filtered = filtered.filter((group) => {
        const pieces = [
          group.helm,
          group.body,
          group.arm,
          group.waist,
          group.leg,
        ].filter(Boolean);

        // Check if any piece in the series matches the rarity range.
        return pieces.some((piece) => {
          if (!piece) return false;
          return piece.rarity >= range.min && piece.rarity <= range.max;
        });
      });
    }

    // Pagination
    const totalPages = Math.ceil(filtered.length / armorSeriesPerPage);
    const startIndex = (currentPage - 1) * armorSeriesPerPage;
    const endIndex = startIndex + armorSeriesPerPage;
    const paginated = filtered.slice(startIndex, endIndex);

    return {
      data: paginated,
      totalCount: filtered.length,
      totalPages,
    };
  }, [
    groupedArmor,
    searchQuery,
    currentPage,
    getSkillName,
    selectedRarity,
    armorSeriesPerPage,
  ]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  /**
   * Renders a cell for a single armor piece.
   */
  const renderArmorPiece = (piece: Armor | undefined, key: string) => {
    if (!piece) {
      return <TableCell key={key}>-</TableCell>;
    }

    const isSelector = mode === "selector";
    const isSelected = !!currentPiece && currentPiece.id === piece.id;
    const isMatchingSlot = isSelector && piece.type === selectingFor;

    return (
      <TableCell
        key={key}
        className={cn(
          "relative",
          isSelector && "transition-colors",
          isSelector && isMatchingSlot && "hover:bg-accent/50 cursor-pointer",
          isSelector && !isMatchingSlot && "cursor-not-allowed opacity-50",
        )}
        onClick={
          isSelector && onPieceSelect
            ? () => {
                if (piece.type === selectingFor) {
                  onPieceSelect(piece);
                }
              }
            : undefined
        }
      >
        <div className="group">
          <EquipmentCard
            item={piece}
            variant={cardVariant}
            isSelected={isSelected}
          />
          {mode === "display" && onEdit && !isLocked && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-1 right-1 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(piece);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    );
  };

  /**
   * Renders the cell for full set skills.
   */
  const renderFullSetSkills = (skills: SkillWithLevel[]) => {
    if (skills.length === 0) {
      return <TableCell>-</TableCell>;
    }

    return (
      <TableCell>
        <div className="space-y-1">
          {skills.map((skill) => (
            <div key={skill.skillId} className="text-xs">
              {getSkillName(skill.skillId)} Lv.{skill.level}
            </div>
          ))}
        </div>
      </TableCell>
    );
  };

  return (
    <div className="flex h-full flex-col gap-6">
      {/* MARK: Toolbar */}
      <FilterBar.Root>
        <TooltipProvider>
          <FilterBar.Section>
            {/* Group 1: Reset */}
            <FilterBar.Reset
              onClick={() => {
                setSelectedRarity("all");
                setSearchQuery("");
              }}
              tooltip="全部防具"
            />

            <FilterBar.Separator />

            {/* Group 2: Rarity Filter */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {RARITY_FILTERS.map(({ value, icon: Icon, label }) => (
                <FilterBar.Button
                  key={value}
                  isSelected={selectedRarity === value}
                  onClick={() => {
                    setSelectedRarity(value);
                    setCurrentPage(1);
                  }}
                  tooltip={label}
                >
                  <Icon className="h-4 w-4" />
                </FilterBar.Button>
              ))}
            </div>
          </FilterBar.Section>

          <FilterBar.Section className="justify-end gap-4">
            {mode !== "selector" && (
              <FilterBar.Count
                count={filteredAndPaginatedArmor.totalCount}
                label="个防具系列"
              />
            )}
            <FilterBar.Search
              placeholder="搜索系列、防具或技能..."
              className="max-w-64"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={filteredAndPaginatedArmor.totalPages}
              onPageChange={setCurrentPage}
            />
          </FilterBar.Section>
        </TooltipProvider>
      </FilterBar.Root>

      {/* MARK: Armor Table */}
      <div className="bg-card min-h-0 flex-1 rounded-lg border shadow-sm">
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow>
              {mode !== "selector" && (
                <TableHead className="bg-primary text-primary-foreground w-[10%] rounded-tl-lg text-center">
                  防具系列
                </TableHead>
              )}
              {ARMOR_COLUMNS.map(({ key, label }, index) => (
                <TableHead
                  key={key}
                  className={cn(
                    "bg-primary text-primary-foreground text-center",
                    mode === "selector" ? "w-[20%]" : "w-[15%]",
                    mode === "selector" && index === 0 && "rounded-tl-lg",
                    mode === "selector" &&
                      index === ARMOR_COLUMNS.length - 1 &&
                      "rounded-tr-lg",
                  )}
                >
                  {label}
                </TableHead>
              ))}
              {mode !== "selector" && (
                <TableHead className="bg-primary text-primary-foreground w-[15%] rounded-tr-lg text-center">
                  全套技能
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndPaginatedArmor.data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={mode === "selector" ? 6 : 7}
                  className="text-muted-foreground py-8 text-center"
                >
                  暂无防具数据
                </TableCell>
              </TableRow>
            ) : (
              filteredAndPaginatedArmor.data.map((group) => (
                <TableRow key={group.series}>
                  {mode !== "selector" && (
                    <TableCell className="text-center">
                      <Badge variant="outline">{group.series}</Badge>
                    </TableCell>
                  )}
                  {ARMOR_COLUMNS.map(({ key }) =>
                    renderArmorPiece(group[key], key),
                  )}
                  {mode !== "selector" &&
                    renderFullSetSkills(group.fullSetSkills)}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
