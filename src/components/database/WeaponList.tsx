import { useMemo, useState } from "react";

import { EquipmentCard } from "@/components/equipments/EquipmentCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWeapon } from "@/hooks";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { RARITY_FILTERS, RARITY_RANGES, WEAPON_TYPES } from "@/types/constants";
import { groupWeaponsIntoRows } from "@/utils/weapon-grouper";

import type { Weapon, WeaponType } from "@/types";
import type { EquipmentCellType } from "@/types/set-builder";

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
}

/**
 * WeaponList 组件
 *
 * 显示武器列表，支持按武器类型筛选和搜索，使用12列网格布局展示武器
 */
export function WeaponList({
  mode = "display",
  onWeaponSelect,
  selectingFor,
  currentWeapon,
}: WeaponListProps) {
  // 状态管理
  const [selectedWeaponType, setSelectedWeaponType] =
    useState<WeaponType>("rod");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRarity, setSelectedRarity] =
    useState<keyof typeof RARITY_RANGES>("all");

  // 获取武器数据
  const { weapons, loading, error } = useWeapon();

  const is2Xl = useMediaQuery("(min-width: 1536px)");
  const cardVariant = useMemo(() => {
    if (mode === "display") {
      return is2Xl ? "full" : "default";
    }
    // selector mode
    return is2Xl ? "default" : "compact";
  }, [mode, is2Xl]);

  // 数据处理：筛选、排序并分组为行
  const weaponRows = useMemo(() => {
    if (!weapons) return [];

    // 筛选：根据武器类型、稀有度和搜索查询
    const filteredWeapons = weapons.filter((weapon) => {
      // 稀有度筛选
      const range = RARITY_RANGES[selectedRarity];
      const rankMatch =
        weapon.rarity >= range.min && weapon.rarity <= range.max;

      if (!rankMatch) return false;

      // 武器类型和搜索查询
      return (
        weapon.type === selectedWeaponType &&
        (searchQuery === "" ||
          weapon.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });

    // 按sortId升序排序（已在groupWeaponsIntoRows中处理，但这里明确处理）
    filteredWeapons.sort((a, b) => a.sortId - b.sortId);

    // 调用groupWeaponsIntoRows分组为行
    return groupWeaponsIntoRows(filteredWeapons);
  }, [weapons, selectedWeaponType, searchQuery, selectedRarity]);

  // 根据选择的稀有度确定要显示的列
  const rarityColumns = useMemo(() => {
    return RARITY_COLUMNS_MAP[selectedRarity];
  }, [selectedRarity]);

  // 加载状态
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">加载中...</div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-500">
        加载武器数据失败: {error}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* 菜单栏 */}
      <div className="bg-card shrink-0 rounded-lg border p-2 shadow-sm sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          {/* 武器类型切换 */}
          <ToggleGroup
            type="single"
            value={selectedWeaponType}
            onValueChange={(value) =>
              value && setSelectedWeaponType(value as WeaponType)
            }
            className="flex-wrap justify-start gap-0"
          >
            {WEAPON_TYPES.map((type) => (
              <ToggleGroupItem key={type} value={type} className="text-xs">
                <img
                  src={`/weapon-type/${type}.png`}
                  alt={type}
                  className="h-6 w-6"
                />
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {/* 右侧组合：稀有度筛选 + 搜索框 */}
          <div className="flex items-center gap-2">
            {/* 稀有度筛选 */}
            <TooltipProvider>
              <div className="flex items-center gap-2">
                {RARITY_FILTERS.map(({ value, icon: Icon, label }) => (
                  <Tooltip key={value}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={
                          selectedRarity === value ? "default" : "outline"
                        }
                        size="icon"
                        onClick={() => setSelectedRarity(value)}
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

            {/* 搜索框 */}
            <Input
              type="text"
              placeholder="搜索武器名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </div>
      </div>

      {/* 武器表格 */}
      <div className="bg-card min-h-0 flex-1 overflow-x-auto rounded-lg border shadow-sm">
        <Table className={cn(selectedRarity === "all" ? "w-[200%]" : "")}>
          {/* 表头 */}
          <TableHeader>
            <TableRow>
              {rarityColumns.map((rarity, index) => (
                <TableHead
                  key={`header-${rarity}`}
                  className={cn(
                    "bg-primary text-primary-foreground text-center",
                    selectedRarity === "all" ? "1/6" : "w-1/4",
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

          {/* 表体 */}
          <TableBody>
            {weaponRows.map((row, rowIndex) => {
              // 创建武器稀有度映射，便于快速查找
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
                          "p-2",
                          selectedRarity === "all" ? "1/6" : "w-1/4",
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
                          <EquipmentCard
                            item={weapon}
                            variant={cardVariant}
                            isSelected={isSelected}
                          />
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
