/**
 * @fileoverview This component displays a list of charms with features
 * like filtering, sorting, pagination, and management operations.
 */

import { useMemo, useState } from "react";

import { DEFAULT_CHARMS_PER_PAGE } from "@/constants";
import { useCharmOperations, useCharms, useSkills } from "@/hooks";
import { DataStorage } from "@/services/storage";
import type {
  AppSettings,
  Charm,
  CharmSortField,
  SortDirection,
} from "@/types";
import type { EquipmentCellType } from "@/types/set-builder";
import { isOfficialCharmId, sortCharms } from "@/utils";

import { CharmFilterBar } from "./CharmFilterBar";
import { CharmGallery } from "./CharmGallery";
import { CharmTable } from "./CharmTable";

interface CharmListProps {
  onEdit?: (charm: Charm) => void;
  mode?: "display" | "table" | "selector";
  onCharmSelect?: (charm: Charm) => void;
  selectingFor?: EquipmentCellType;
  currentCharm?: Charm | null;
}

/**
 * Renders a list of charms with sorting, filtering, and pagination.
 *
 * Supports three modes:
 * - `display`: Gallery view for managing the charm collection.
 * - `table`: Table view for managing the charm collection.
 * - `selector`: Gallery view (compact) for selecting a charm for a build.
 */
export function CharmList({
  onEdit,
  mode = "display",
  onCharmSelect,
  selectingFor,
  currentCharm,
}: CharmListProps) {
  const { enhancedCharms } = useCharms();
  const { skills } = useSkills();

  // Filter states
  const [selectedRarity, setSelectedRarity] = useState<"all" | number>("all");
  const [isOfficialOnly, setIsOfficialOnly] = useState(false);
  const [isCustomOnly, setIsCustomOnly] = useState(false);
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
    let filtered = [...enhancedCharms];

    // Filter by rarity
    if (selectedRarity !== "all") {
      filtered = filtered.filter((c) => c.rarity === selectedRarity);
    }

    // Filter by official status
    if (isOfficialOnly) {
      filtered = filtered.filter((c) => isOfficialCharmId(c.id));
    }

    // Filter by custom status
    if (isCustomOnly) {
      filtered = filtered.filter((c) => !isOfficialCharmId(c.id));
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
    enhancedCharms,
    selectedRarity,
    isOfficialOnly,
    isCustomOnly,
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
      <CharmFilterBar
        selectedRarity={selectedRarity}
        onRarityChange={(val) => {
          setSelectedRarity(val);
          setCurrentPage(1);
        }}
        isOfficialOnly={isOfficialOnly}
        onOfficialOnlyChange={(val) => {
          setIsOfficialOnly(val);
          if (val) setIsCustomOnly(false); // Mutually exclusive
          setCurrentPage(1);
        }}
        isCustomOnly={isCustomOnly}
        onCustomOnlyChange={(val) => {
          setIsCustomOnly(val);
          if (val) setIsOfficialOnly(false); // Mutually exclusive
          setCurrentPage(1);
        }}
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setCurrentPage(1);
        }}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalCount={searchedCharms.length}
        isFilterVisible={isFilterVisible}
        onToggleFilter={() => setIsFilterVisible((prev) => !prev)}
        minKeySkillValue={minKeySkillValue}
        onMinKeySkillValueChange={(val) => {
          setMinKeySkillValue(val);
          setCurrentPage(1);
        }}
        filterSkillId={filterSkillId}
        onFilterSkillChange={(val) => {
          setFilterSkillId(val);
          setCurrentPage(1);
        }}
        onClearFilters={() => {
          setSelectedRarity("all");
          setIsOfficialOnly(false);
          setIsCustomOnly(false);
          setMinKeySkillValue(null);
          setFilterSkillId("all");
          setSearchQuery("");
          setCurrentPage(1);
        }}
        showCount={mode !== "selector"}
      />

      {/* Charm View (Gallery or Table) */}
      {mode === "table" ? (
        <CharmTable
          charms={paginatedCharms}
          hasCharms={enhancedCharms.length > 0}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={handleSortFieldChange}
          onToggleFilter={() => setIsFilterVisible((prev) => !prev)}
          onEdit={onEdit}
          onDelete={handleDelete}
        />
      ) : (
        <CharmGallery
          charms={paginatedCharms}
          variant={mode === "display" ? "full" : "default"}
          selectingFor={selectingFor}
          currentCharm={currentCharm}
          onEdit={mode === "display" ? onEdit : undefined}
          onSelect={mode === "selector" ? onCharmSelect : undefined}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={handleSortFieldChange}
        />
      )}
    </div>
  );
}
