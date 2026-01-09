/**
 * @fileoverview This component displays a list of charms with features
 * like filtering, sorting, pagination, and management operations.
 */

import { useMemo, useState } from "react";

import { List } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DEFAULT_CHARMS_PER_PAGE } from "@/constants";
import { useCharmOperations, useCharms, useSkills } from "@/hooks";
import { cn } from "@/lib/utils";
import { DataStorage } from "@/services/storage";
import type {
  AppSettings,
  Charm,
  CharmSortField,
  SortDirection,
} from "@/types";
import type { EquipmentCellType } from "@/types/set-builder";
import { sortCharms } from "@/utils";

import { CharmTable } from "./CharmTable";

interface CharmListProps {
  onEdit?: (charm: Charm) => void;
  mode?: "display" | "selector";
  onCharmSelect?: (charm: Charm) => void;
  selectingFor?: EquipmentCellType;
  currentCharm?: Charm | null;
}

/**
 * Renders a list of charms with sorting, filtering, and pagination.
 *
 * Supports two modes:
 * - `display`: For managing the charm collection.
 * - `selector`: For selecting a charm for a build.
 */
export function CharmList({
  onEdit,
  mode = "display",
  onCharmSelect,
  selectingFor,
  currentCharm,
}: CharmListProps) {
  const { charms } = useCharms();
  const { skills } = useSkills();

  // Filter states
  const [selectedRarity, setSelectedRarity] = useState<"all" | number>("all");
  const [minKeySkillValue, setMinKeySkillValue] = useState<number | null>(null);
  const [filterSkillId, setFilterSkillId] = useState<string>("");
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  // Sort states
  const [sortField, setSortField] = useState<CharmSortField>("keySkillValue");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Pagination and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const charmsPerPage =
    DataStorage.loadData<AppSettings>("settings")[0]?.charmsPerPage ??
    DEFAULT_CHARMS_PER_PAGE;

  // Memoized filtered charms based on current filter criteria.
  const searchedCharms = useMemo(() => {
    let filtered = [...charms];

    // Filter by rarity
    if (selectedRarity !== "all") {
      filtered = filtered.filter((c) => c.rarity === selectedRarity);
    }

    // Filter by minimum key skill value
    if (minKeySkillValue !== null) {
      filtered = filtered.filter((c) => c.keySkillValue >= minKeySkillValue);
    }

    // Filter by skill
    if (filterSkillId && filterSkillId !== "all") {
      filtered = filtered.filter((c) =>
        c.skills.some((s) => s.skillId === filterSkillId),
      );
    }

    // Filter by search query
    if (searchQuery) {
      // Check for exact match (starts with '=')
      const isExactMatch = searchQuery.startsWith("=");
      const keyword = isExactMatch ? searchQuery.slice(1) : searchQuery;

      filtered = filtered.filter((c) =>
        c.skills.some((s) => {
          const skill = skills.find((sk) => sk.id === s.skillId);
          const skillName = skill?.name ?? "未知技能";
          return isExactMatch
            ? skillName.toLowerCase() === keyword.toLowerCase()
            : skillName.toLowerCase().includes(keyword.toLowerCase());
        }),
      );
    }

    return filtered;
  }, [
    charms,
    selectedRarity,
    minKeySkillValue,
    filterSkillId,
    searchQuery,
    skills,
  ]);

  // Memoized sorted and paginated charms.
  const paginatedCharms = useMemo(() => {
    // Sort the charms
    const sorted = sortCharms(searchedCharms, sortField, sortDirection);

    // Paginate the results
    return sorted.slice(
      (currentPage - 1) * charmsPerPage,
      currentPage * charmsPerPage,
    );
  }, [searchedCharms, sortField, sortDirection, currentPage, charmsPerPage]);

  // Calculate total pages for pagination.
  const totalPages = Math.ceil(searchedCharms.length / charmsPerPage);

  // Handles changing the sort field or direction.
  const handleSortFieldChange = (field: CharmSortField) => {
    if (field === sortField) {
      // Toggle direction if the same field is clicked
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field, default to descending
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const { deleteCharm: deleteCharmSecurely } = useCharmOperations();

  // Handles charm deletion with confirmation.
  const handleDelete = (id: string) => {
    if (confirm("确定要删除这个护石吗？")) {
      deleteCharmSecurely(id);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6">
      {/* Control bar */}
      <div className="bg-card shrink-0 rounded-lg border p-2 shadow-sm sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <TooltipProvider>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedRarity === "all" ? "default" : "outline"}
                    size="icon"
                    onClick={() => {
                      setSelectedRarity("all");
                      setCurrentPage(1);
                    }}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>全部护石</p>
                </TooltipContent>
              </Tooltip>
              {([6, 7, 8] as const).map((rarity) => (
                <Tooltip key={rarity}>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className={cn(
                        "hover:bg-accent hover:text-accent-foreground flex h-9 w-9 cursor-pointer items-center justify-center text-xs transition-colors",
                        selectedRarity === rarity &&
                          "bg-primary text-primary-foreground hover:bg-primary/90",
                      )}
                      style={{
                        color:
                          selectedRarity === rarity
                            ? undefined
                            : `var(--rarity-${rarity})`,
                        borderColor:
                          selectedRarity === rarity
                            ? undefined
                            : `var(--rarity-${rarity})`,
                        background:
                          selectedRarity === rarity ? undefined : "transparent",
                      }}
                      onClick={() => {
                        setSelectedRarity(rarity);
                        setCurrentPage(1);
                      }}
                    >
                      R{rarity}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>R{rarity}护石</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>

          <div className="flex items-center justify-end gap-4">
            {mode !== "selector" && (
              <div className="text-muted-foreground text-sm">
                共 {searchedCharms.length} 个护石
              </div>
            )}
            <Input
              type="text"
              placeholder="搜索技能名称..."
              className="h-9 max-w-40"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>

      {/* Collapsible filter section */}
      {isFilterVisible && (
        <div className="bg-muted shrink-0 space-y-4 rounded-lg p-4 sm:p-6">
          <h3 className="text-base font-medium sm:text-lg">筛选条件</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">最小核心技能价值</Label>
              <Input
                type="number"
                min={0}
                placeholder="0+"
                value={minKeySkillValue ?? ""}
                onChange={(e) => {
                  setMinKeySkillValue(
                    e.target.value ? parseInt(e.target.value) : null,
                  );
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium">包含技能</Label>
              <Select
                value={filterSkillId}
                onValueChange={(val) => {
                  setFilterSkillId(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部技能" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部技能</SelectItem>
                  {skills.map((skill) => (
                    <SelectItem key={skill.id} value={skill.id}>
                      {skill.name} {skill.isKey && "⭐"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {(selectedRarity !== "all" ||
            minKeySkillValue !== null ||
            (filterSkillId && filterSkillId !== "all")) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedRarity("all");
                setMinKeySkillValue(null);
                setFilterSkillId("all");
                setCurrentPage(1);
              }}
            >
              清除筛选
            </Button>
          )}
        </div>
      )}

      {/* Charm table */}
      <CharmTable
        charms={paginatedCharms}
        hasCharms={charms.length > 0}
        sortField={sortField}
        sortDirection={sortDirection}
        mode={mode}
        selectingFor={selectingFor}
        currentCharm={currentCharm}
        onSortChange={handleSortFieldChange}
        onToggleFilter={() => setIsFilterVisible((prev) => !prev)}
        onEdit={onEdit}
        onDelete={handleDelete}
        onSelect={onCharmSelect}
      />
    </div>
  );
}
