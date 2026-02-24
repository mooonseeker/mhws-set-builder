import { Anchor, SlidersHorizontal, UserPlus } from "lucide-react";

import { FilterBar } from "@/components/common";
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
import { ToggleGroup } from "@/components/ui/toggle-group";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSkills } from "@/hooks";
import { cn } from "@/lib/utils";

interface CharmFilterBarProps {
  selectedRarity: "all" | number;
  onRarityChange: (rarity: "all" | number) => void;
  isOfficialOnly: boolean;
  onOfficialOnlyChange: (officialOnly: boolean) => void;
  isCustomOnly: boolean;
  onCustomOnlyChange: (customOnly: boolean) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalCount: number;
  isFilterVisible: boolean;
  onToggleFilter: () => void;
  minKeySkillValue: number | null;
  onMinKeySkillValueChange: (val: number | null) => void;
  filterSkillId: string;
  onFilterSkillChange: (val: string) => void;
  onClearFilters: () => void;
  showCount?: boolean;
}

export function CharmFilterBar({
  selectedRarity,
  onRarityChange,
  isOfficialOnly,
  onOfficialOnlyChange,
  isCustomOnly,
  onCustomOnlyChange,
  searchQuery,
  onSearchChange,
  currentPage,
  totalPages,
  onPageChange,
  totalCount,
  isFilterVisible,
  onToggleFilter,
  minKeySkillValue,
  onMinKeySkillValueChange,
  filterSkillId,
  onFilterSkillChange,
  onClearFilters,
  showCount = true,
}: CharmFilterBarProps) {
  const { skills, isKeySkill } = useSkills();

  return (
    <>
      <FilterBar.Root>
        <TooltipProvider>
          <FilterBar.Section>
            {/* Group 1: Global Reset */}
            <FilterBar.Reset onClick={onClearFilters} tooltip="全部护石" />

            <FilterBar.Separator />

            {/* Group 2: Rarity Group */}
            <ToggleGroup
              type="single"
              value={selectedRarity === "all" ? "" : selectedRarity.toString()}
              onValueChange={(v) => {
                if (v) onRarityChange(parseInt(v));
                else onRarityChange("all");
              }}
              className="gap-1.5 sm:gap-2"
            >
              {[6, 7, 8].map((rarity) => (
                <FilterBar.ToggleItem
                  key={rarity}
                  value={rarity.toString()}
                  tooltip={`R${rarity}护石`}
                  className="text-xs font-black"
                  style={{
                    color:
                      selectedRarity === rarity
                        ? undefined
                        : `var(--rarity-${rarity})`,
                    borderColor:
                      selectedRarity === rarity
                        ? undefined
                        : `var(--rarity-${rarity})`,
                  }}
                >
                  R{rarity}
                </FilterBar.ToggleItem>
              ))}
            </ToggleGroup>

            <FilterBar.Separator />

            {/* Group 3: Source Group */}
            <ToggleGroup
              type="single"
              value={isOfficialOnly ? "official" : isCustomOnly ? "custom" : ""}
              onValueChange={(v) => {
                if (v === "official") {
                  onOfficialOnlyChange(true);
                  onCustomOnlyChange(false);
                } else if (v === "custom") {
                  onOfficialOnlyChange(false);
                  onCustomOnlyChange(true);
                } else {
                  onOfficialOnlyChange(false);
                  onCustomOnlyChange(false);
                }
              }}
              className="gap-1.5 sm:gap-2"
            >
              <FilterBar.ToggleItem value="official" tooltip="初始护石">
                <Anchor
                  className={cn(
                    "h-4 w-4 transition-colors",
                    !isOfficialOnly && "text-blue-500",
                  )}
                />
              </FilterBar.ToggleItem>
              <FilterBar.ToggleItem value="custom" tooltip="收藏护石">
                <UserPlus
                  className={cn(
                    "h-4 w-4 transition-colors",
                    !isCustomOnly && "text-orange-500",
                  )}
                />
              </FilterBar.ToggleItem>
            </ToggleGroup>

            <FilterBar.Separator />

            {/* Group 4: Advanced Filter Toggle */}
            <FilterBar.Button
              isSelected={isFilterVisible}
              onClick={onToggleFilter}
              tooltip="进阶筛选"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </FilterBar.Button>
          </FilterBar.Section>

          <FilterBar.Section className="justify-end gap-4">
            {showCount && <FilterBar.Count count={totalCount} label="个护石" />}
            <FilterBar.Search
              placeholder="搜索技能名称..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </FilterBar.Section>
        </TooltipProvider>
      </FilterBar.Root>

      {/* Collapsible filter section */}
      <FilterBar.Collapsible isVisible={isFilterVisible}>
        <h3 className="text-base font-medium sm:text-lg">筛选条件</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">最小核心技能价值</Label>
            <Input
              type="number"
              min={0}
              placeholder="0+"
              value={minKeySkillValue ?? ""}
              onChange={(e) =>
                onMinKeySkillValueChange(
                  e.target.value ? parseInt(e.target.value) : null,
                )
              }
            />
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-medium">包含技能</Label>
            <Select value={filterSkillId} onValueChange={onFilterSkillChange}>
              <SelectTrigger>
                <SelectValue placeholder="全部技能" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部技能</SelectItem>
                {skills.map((skill) => (
                  <SelectItem key={skill.id} value={skill.id}>
                    {skill.name} {isKeySkill(skill.id) && "⭐"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {(selectedRarity !== "all" ||
          isOfficialOnly ||
          isCustomOnly ||
          minKeySkillValue !== null ||
          (filterSkillId && filterSkillId !== "all")) && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            清除筛选
          </Button>
        )}
      </FilterBar.Collapsible>
    </>
  );
}
