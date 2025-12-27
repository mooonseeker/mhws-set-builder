import { List } from "lucide-react";
import { useMemo, useState } from "react";

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
import { useCharms, useSkills } from "@/hooks";
import { cn } from "@/lib/utils";
import { DataStorage } from "@/services/DataStorage";
import { DEFAULT_CHARMS_PER_PAGE } from "@/types/constants";
import { sortCharms } from "@/utils";

import { CharmTable } from "./CharmTable";

import type {
  AppSettings,
  Charm,
  CharmSortField,
  SortDirection,
} from "@/types";
import type { EquipmentCellType } from "@/types/set-builder";

interface CharmListProps {
  onEdit?: (charm: Charm) => void;
  mode?: "display" | "selector";
  onCharmSelect?: (charm: Charm) => void;
  selectingFor?: EquipmentCellType;
  currentCharm?: Charm | null;
}

/**
 * 护石列表组件
 *
 * 显示护石列表，支持：
 * - 默认按核心技能价值降序、稀有度降序排序
 * - 筛选（按稀有度、技能、核心技能阈值）
 * - 排序字段切换
 * - 编辑和删除操作
 */
export function CharmList({
  onEdit,
  mode = "display",
  onCharmSelect,
  selectingFor,
  currentCharm,
}: CharmListProps) {
  const { charms, deleteCharm } = useCharms();
  const { skills } = useSkills();

  // 筛选状态
  const [selectedRarity, setSelectedRarity] = useState<"all" | 6 | 7 | 8>(
    "all",
  );
  const [minKeySkillValue, setMinKeySkillValue] = useState<number | null>(null);
  const [filterSkillId, setFilterSkillId] = useState<string>("");
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  // 排序状态
  const [sortField, setSortField] = useState<CharmSortField>("keySkillValue");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // 分页和搜索状态
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const charmsPerPage =
    DataStorage.loadData<AppSettings>("settings")[0]?.charmsPerPage ??
    DEFAULT_CHARMS_PER_PAGE;

  // 筛选护石
  const searchedCharms = useMemo(() => {
    let filtered = [...charms];

    // 按稀有度筛选
    if (selectedRarity !== "all") {
      filtered = filtered.filter((c) => c.rarity === selectedRarity);
    }

    // 按核心技能价值筛选
    if (minKeySkillValue !== null) {
      filtered = filtered.filter((c) => c.keySkillValue >= minKeySkillValue);
    }

    // 按技能筛选
    if (filterSkillId && filterSkillId !== "all") {
      filtered = filtered.filter((c) =>
        c.skills.some((s) => s.skillId === filterSkillId),
      );
    }

    // 按搜索关键词筛选
    if (searchQuery) {
      // 检查是否为精确匹配（以等号开头）
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

  // 排序和分页护石
  const paginatedCharms = useMemo(() => {
    // 排序
    const sorted = sortCharms(searchedCharms, sortField, sortDirection);

    // 分页
    return sorted.slice(
      (currentPage - 1) * charmsPerPage,
      currentPage * charmsPerPage,
    );
  }, [searchedCharms, sortField, sortDirection, currentPage, charmsPerPage]);

  // 计算总页数
  const totalPages = Math.ceil(searchedCharms.length / charmsPerPage);

  // 切换排序字段
  const handleSortFieldChange = (field: CharmSortField) => {
    if (field === sortField) {
      // 切换方向
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // 新字段，默认降序
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // 删除护石
  const handleDelete = (id: string) => {
    if (confirm("确定要删除这个护石吗？")) {
      deleteCharm(id);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6">
      {/* 菜单栏 */}
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

      {/* 可折叠筛选器 */}
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

      {/* 护石列表 */}
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
