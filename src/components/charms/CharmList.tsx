import {
  ChevronDown,
  ChevronUp,
  Filter,
  List,
  Pencil,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { SkillItem } from "@/components/skills/SkillItem";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCharms, useSkills } from "@/contexts";
import { cn } from "@/lib/utils";
import { CHARMS_PER_PAGE } from "@/types/constants";
import { sortCharms } from "@/utils";

import type { Charm, CharmSortField, SortDirection } from "@/types";
import type { EquipmentCellType } from "@/types/set-builder";

interface CharmListProps {
  onEdit?: (charm: Charm) => void;
  mode?: "display" | "selector";
  onCharmSelect?: (charm: Charm) => void;
  selectingFor?: EquipmentCellType; // 新增
  currentCharm?: Charm | null; // 新增
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
          const skillName = skill?.name || "未知技能";
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
      (currentPage - 1) * CHARMS_PER_PAGE,
      currentPage * CHARMS_PER_PAGE,
    );
  }, [searchedCharms, sortField, sortDirection, currentPage]);

  // 计算总页数
  const totalPages = Math.ceil(searchedCharms.length / CHARMS_PER_PAGE);

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

  // 当筛选条件变化时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRarity, minKeySkillValue, filterSkillId, searchQuery]);

  // 删除护石
  const handleDelete = (id: string) => {
    if (confirm("确定要删除这个护石吗？")) {
      deleteCharm(id);
    }
  };

  // 获取装饰品等级图标
  const getAccessoryIcon = (slotType: "weapon" | "armor", level: number) => {
    return `/slot/${slotType}-slot-${level}.png`;
  };

  // 渲染排序图标
  const SortIcon = ({ field }: { field: CharmSortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="ml-1 inline h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 inline h-4 w-4" />
    );
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
                    onClick={() => setSelectedRarity("all")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>全部护石</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className={cn(
                      "hover:bg-accent hover:text-accent-foreground flex h-9 w-9 cursor-pointer items-center justify-center text-xs transition-colors",
                      selectedRarity === 6 &&
                        "bg-primary text-primary-foreground hover:bg-primary/90",
                    )}
                    style={{
                      color:
                        selectedRarity === 6 ? undefined : "var(--rarity-6)",
                      borderColor:
                        selectedRarity === 6 ? undefined : "var(--rarity-6)",
                      background:
                        selectedRarity === 6 ? undefined : "transparent",
                    }}
                    onClick={() => setSelectedRarity(6)}
                  >
                    R6
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>R6护石</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className={cn(
                      "hover:bg-accent hover:text-accent-foreground flex h-9 w-9 cursor-pointer items-center justify-center text-xs transition-colors",
                      selectedRarity === 7 &&
                        "bg-primary text-primary-foreground hover:bg-primary/90",
                    )}
                    style={{
                      color:
                        selectedRarity === 7 ? undefined : "var(--rarity-7)",
                      borderColor:
                        selectedRarity === 7 ? undefined : "var(--rarity-7)",
                      background:
                        selectedRarity === 7 ? undefined : "transparent",
                    }}
                    onClick={() => setSelectedRarity(7)}
                  >
                    R7
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>R7护石</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className={cn(
                      "hover:bg-accent hover:text-accent-foreground flex h-9 w-9 cursor-pointer items-center justify-center text-xs transition-colors",
                      selectedRarity === 8 &&
                        "bg-primary text-primary-foreground hover:bg-primary/90",
                    )}
                    style={{
                      color:
                        selectedRarity === 8 ? undefined : "var(--rarity-8)",
                      borderColor:
                        selectedRarity === 8 ? undefined : "var(--rarity-8)",
                      background:
                        selectedRarity === 8 ? undefined : "transparent",
                    }}
                    onClick={() => setSelectedRarity(8)}
                  >
                    R8
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>R8护石</p>
                </TooltipContent>
              </Tooltip>
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
              onChange={(e) => setSearchQuery(e.target.value)}
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
                onChange={(e) =>
                  setMinKeySkillValue(
                    e.target.value ? parseInt(e.target.value) : null,
                  )
                }
              />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium">包含技能</Label>
              <Select value={filterSkillId} onValueChange={setFilterSkillId}>
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
            minKeySkillValue ||
            (filterSkillId && filterSkillId !== "all")) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedRarity("all");
                setMinKeySkillValue(null);
                setFilterSkillId("all");
              }}
            >
              清除筛选
            </Button>
          )}
        </div>
      )}

      {/* 护石列表 */}
      <div className="min-h-0 flex-1 rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-tl-lg text-center"
                onClick={() => handleSortFieldChange("rarity")}
              >
                <span className="hidden sm:inline">稀有度</span>
                <span className="sm:hidden">R</span> <SortIcon field="rarity" />
              </TableHead>
              <TableHead className="bg-primary text-primary-foreground px-4 text-center">
                技能
              </TableHead>
              <TableHead className="bg-primary text-primary-foreground hidden text-center md:table-cell">
                孔位
              </TableHead>
              {mode === "display" && (
                <>
                  <TableHead
                    className="bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer text-center"
                    onClick={() => handleSortFieldChange("keySkillValue")}
                  >
                    <span className="hidden sm:inline">核心价值</span>
                    <span className="sm:hidden">价值</span>{" "}
                    <SortIcon field="keySkillValue" />
                  </TableHead>
                  <TableHead className="bg-primary text-primary-foreground hidden text-center lg:table-cell">
                    等效孔位
                  </TableHead>
                  <TableHead
                    className="bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground hidden cursor-pointer text-center lg:table-cell"
                    onClick={() => handleSortFieldChange("createdAt")}
                  >
                    创建时间 <SortIcon field="createdAt" />
                  </TableHead>
                  <TableHead className="bg-primary text-primary-foreground rounded-tr-lg text-right">
                    <div className="flex items-center justify-end gap-1">
                      操作
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIsFilterVisible((prev) => !prev)}
                      >
                        <Filter className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCharms.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground text-center"
                >
                  {charms.length === 0 ? "暂无护石" : "没有符合条件的护石"}
                </TableCell>
              </TableRow>
            ) : (
              paginatedCharms.map((charm) => {
                const isSelector = mode === "selector";
                const isSelected =
                  !!currentCharm && currentCharm.id === charm.id;
                const isMatchingSlot = isSelector && selectingFor === "charm";

                return (
                  <TableRow
                    key={charm.id}
                    className={cn(
                      isSelector && "transition-colors",
                      isSelected && "bg-accent/30",
                      isSelector &&
                        isMatchingSlot &&
                        "hover:bg-accent/50 cursor-pointer",
                      isSelector &&
                        !isMatchingSlot &&
                        "cursor-not-allowed opacity-50",
                    )}
                    onClick={
                      isSelector && onCharmSelect && isMatchingSlot
                        ? () => onCharmSelect(charm)
                        : undefined
                    }
                  >
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          color:
                            charm.rarity === 12
                              ? "black"
                              : `var(--rarity-${charm.rarity})`,
                          borderColor:
                            charm.rarity === 12
                              ? "var(--border)"
                              : `var(--rarity-${charm.rarity})`,
                          background:
                            charm.rarity === 12
                              ? `var(--rarity-${charm.rarity})`
                              : "transparent",
                        }}
                      >
                        R{charm.rarity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1 px-2 sm:space-y-2">
                        {charm.skills.map((skillWithLevel) => (
                          <SkillItem
                            key={skillWithLevel.skillId}
                            skillId={skillWithLevel.skillId}
                            level={skillWithLevel.level}
                            variant="full"
                          />
                        ))}
                        {/* 小屏幕显示孔位信息 */}
                        {charm.slots.length > 0 && (
                          <div className="text-muted-foreground mt-1 text-xs md:hidden">
                            孔位:{" "}
                            {charm.slots.map((slot, index) => (
                              <span key={index}>
                                {slot.type === "weapon" ? "武" : "防"}
                                {slot.level}
                                {index < charm.slots.length - 1 && ", "}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-center md:table-cell">
                      <div className="flex justify-center gap-2">
                        {Array.from({ length: 3 }, (_, index) => {
                          const slot = charm.slots[index];
                          return slot ? (
                            <img
                              key={index}
                              src={getAccessoryIcon(slot.type, slot.level)}
                              alt={`${slot.type === "weapon" ? "WeaponSlot" : "ArmorSlot"} ${slot.level}级`}
                              style={{ width: "1.5rem", height: "1.5rem" }}
                            />
                          ) : (
                            <span
                              key={index}
                              className="text-muted-foreground text-sm"
                              style={{
                                width: "1.5rem",
                                height: "1.5rem",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              —
                            </span>
                          );
                        })}
                      </div>
                    </TableCell>
                    {mode === "display" && (
                      <>
                        <TableCell className="text-center">
                          <span className="text-primary text-sm font-medium sm:text-base">
                            {charm.keySkillValue}
                          </span>
                        </TableCell>
                        <TableCell className="hidden text-center lg:table-cell">
                          <div className="flex flex-col justify-center gap-2 text-sm md:flex-row md:gap-4">
                            <div className="flex items-center gap-1">
                              <img
                                src="/weapon.png"
                                alt="WeaponSlot"
                                style={{ width: "1.5rem", height: "1.5rem" }}
                              />
                              {charm.equivalentSlots.weaponSlot3}/
                              {charm.equivalentSlots.weaponSlot2}/
                              {charm.equivalentSlots.weaponSlot1}
                            </div>
                            <div className="flex items-center gap-1">
                              <img
                                src="/armor.png"
                                alt="ArmorSlot"
                                style={{ width: "1.5rem", height: "1.5rem" }}
                              />
                              {charm.equivalentSlots.armorSlot3}/
                              {charm.equivalentSlots.armorSlot2}/
                              {charm.equivalentSlots.armorSlot1}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden text-center text-xs lg:table-cell">
                          {new Date(charm.createdAt).toLocaleDateString(
                            "zh-CN",
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 sm:gap-2">
                            {onEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(charm)}
                                className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(charm.id)}
                              className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                            >
                              <Trash2 className="text-destructive h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
