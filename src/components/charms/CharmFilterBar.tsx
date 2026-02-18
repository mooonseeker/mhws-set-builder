import { List as ListIcon } from "lucide-react";

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
import { useSkills } from "@/hooks";
import { cn } from "@/lib/utils";

interface CharmFilterBarProps {
  selectedRarity: "all" | number;
  onRarityChange: (rarity: "all" | number) => void;
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
          <TooltipProvider>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedRarity === "all" ? "default" : "outline"}
                    size="icon"
                    onClick={() => onRarityChange("all")}
                  >
                    <ListIcon className="h-4 w-4" />
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
                      onClick={() => onRarityChange(rarity)}
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
