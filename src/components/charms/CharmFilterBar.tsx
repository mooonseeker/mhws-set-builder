import { Anchor, List as ListIcon, UserPlus } from "lucide-react";

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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
      <div className="bg-card shrink-0 rounded-lg border p-2 shadow-sm sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Group 1: Global Reset */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onClearFilters}
                    className="h-9 w-9"
                  >
                    <ListIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>全部护石 (重置所有筛选)</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="bg-border mx-0.5 h-6 w-px shrink-0" />

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
                <ToggleGroupItem
                  key={rarity}
                  value={rarity.toString()}
                  variant="outline"
                  tooltip={`R${rarity}护石`}
                  className={cn(
                    "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary h-9 w-9 text-xs font-black transition-all",
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
                  }}
                >
                  R{rarity}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            <div className="bg-border mx-0.5 h-6 w-px shrink-0" />

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
              <ToggleGroupItem
                value="official"
                variant="outline"
                tooltip="仅官方护石"
                className="h-9 w-9 data-[state=on]:border-blue-600 data-[state=on]:bg-blue-600 data-[state=on]:text-white"
              >
                <Anchor
                  className={
                    isOfficialOnly ? "h-4 w-4" : "h-4 w-4 text-blue-500"
                  }
                />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="custom"
                variant="outline"
                tooltip="仅自定义护石"
                className="h-9 w-9 data-[state=on]:border-orange-600 data-[state=on]:bg-orange-600 data-[state=on]:text-white"
              >
                <UserPlus
                  className={
                    isCustomOnly ? "h-4 w-4" : "h-4 w-4 text-orange-500"
                  }
                />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex items-center justify-end gap-4">
            {showCount && (
              <div className="text-muted-foreground text-sm">
                共 {totalCount} 个护石
              </div>
            )}
            <Input
              type="text"
              placeholder="搜索技能名称..."
              className="h-9 max-w-40"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />

            <Button
              variant={isFilterVisible ? "secondary" : "outline"}
              size="sm"
              onClick={onToggleFilter}
            >
              筛选
            </Button>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
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
        </div>
      )}
    </>
  );
}
