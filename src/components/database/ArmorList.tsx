import { useCallback, useMemo, useState } from "react";

import { ErrorMessage, Loading } from "@/components/common";
import { EquipmentCard } from "@/components/equipments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
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
import { useArmor, useSkills, useMediaQuery } from "@/hooks";
import { cn } from "@/lib/utils";
import { DataStorage } from "@/services/DataStorage";
import { DEFAULT_ARMOR_SERIES_PER_PAGE, RARITY_FILTERS } from "@/constants";
import { RARITY_RANGES } from "@/types";
import { groupArmorBySeries } from "@/utils/armor-grouper";

import type {
  AppSettings,
  Armor,
  ArmorType,
  GroupedArmor,
  SkillWithLevel,
} from "@/types";
import type { EquipmentCellType } from "@/types/set-builder";

const ARMOR_COLUMNS: { key: ArmorType; label: string }[] = [
  { key: "helm", label: "头盔" },
  { key: "body", label: "胸甲" },
  { key: "arm", label: "臂甲" },
  { key: "waist", label: "腰甲" },
  { key: "leg", label: "腿甲" },
];

/**
 * ArmorList 组件
 *
 * 显示按系列分组的防具列表表格
 */
export interface ArmorListProps {
  mode?: "display" | "selector";
  onPieceSelect?: (piece: Armor) => void;
  selectingFor?: EquipmentCellType; // 新增
  currentPiece?: Armor | null; // 新增
}

export function ArmorList({
  mode = "display",
  onPieceSelect,
  selectingFor,
  currentPiece,
}: ArmorListProps) {
  const { armor, loading, error } = useArmor();
  const { skills } = useSkills();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRarity, setSelectedRarity] =
    useState<keyof typeof RARITY_RANGES>("all");

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

  // 获取技能名称的辅助函数
  const getSkillName = useCallback(
    (skillId: string) => {
      const skill = skills.find((s) => s.id === skillId);
      return skill?.name ?? "未知技能";
    },
    [skills],
  );

  /**
   * 将防具数组按系列分组，并计算全套技能
   */
  const groupedArmor = useMemo((): GroupedArmor[] => {
    return groupArmorBySeries(armor);
  }, [armor]);

  /**
   * 搜索过滤和分页处理
   */
  const filteredAndPaginatedArmor = useMemo(() => {
    // 搜索过滤
    let filtered = groupedArmor;

    if (searchQuery) {
      const keyword = searchQuery.toLowerCase();
      filtered = groupedArmor.filter((group) => {
        // 检查系列名称
        if (group.series.toLowerCase().includes(keyword)) return true;

        // 检查装备名称
        const pieceNames = [
          group.helm?.name,
          group.body?.name,
          group.arm?.name,
          group.waist?.name,
          group.leg?.name,
        ].filter(Boolean);

        if (pieceNames.some((name) => name?.toLowerCase().includes(keyword)))
          return true;

        // 检查技能名称
        const skillNames = group.fullSetSkills.map((skill) =>
          getSkillName(skill.skillId),
        );
        return skillNames.some((name) => name.toLowerCase().includes(keyword));
      });
    }

    // 稀有度筛选
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

        // 检查系列中是否有符合稀有度要求的防具
        return pieces.some((piece) => {
          if (!piece) return false;
          return piece.rarity >= range.min && piece.rarity <= range.max;
        });
      });
    }

    // 分页
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
   * 渲染防具部件列
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
        <EquipmentCard
          item={piece}
          variant={cardVariant}
          isSelected={isSelected}
        />
      </TableCell>
    );
  };

  /**
   * 渲染全套技能列
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
      {/* 菜单栏 */}
      <div className="bg-card shrink-0 rounded-lg border p-2 shadow-sm sm:p-4">
        <div className="flex flex-nowrap items-center justify-between gap-2 sm:gap-3">
          <TooltipProvider>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {RARITY_FILTERS.map(({ value, icon: Icon, label }) => (
                <Tooltip key={value}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={selectedRarity === value ? "default" : "outline"}
                      size="icon"
                      onClick={() => {
                        setSelectedRarity(value);
                        setCurrentPage(1);
                      }}
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>

          <div className="flex items-center justify-end gap-4">
            {mode !== "selector" && (
              <div className="text-muted-foreground text-sm whitespace-nowrap">
                共 {filteredAndPaginatedArmor.totalCount} 个防具系列
              </div>
            )}
            <Input
              type="text"
              placeholder="搜索系列、防具或技能..."
              className="h-9 max-w-64 flex-1"
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
          </div>
        </div>
      </div>

      {/* 防具表格 */}
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
