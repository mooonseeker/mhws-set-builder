/**
 * @fileoverview Component for displaying a list of accessories.
 * It supports filtering, pagination, editing, and deletion of accessories.
 */

import { useState } from "react";

import { List, Pencil, Trash2 } from "lucide-react";

import { SkillItem } from "@/components/entities/";
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
import { DEFAULT_ACCESSORIES_PER_PAGE } from "@/constants";
import { useAccessories, useSkills } from "@/hooks";
import { cn } from "@/lib/utils";
import { DataStorage } from "@/services/storage";
import type { Accessory, AppSettings, SlotLevel } from "@/types";

export interface AccessoryListProps {
  onEdit?: (accessory: Accessory) => void;
  isLocked?: boolean;
  mode?: "display" | "selector";
  onAccessorySelect?: (accessory: Accessory) => void;
  filterBySlotLevel?: SlotLevel;
  filterBySlotType?: "weapon" | "armor";
}

/**
 * Accessory list component.
 * Displays all accessories with support for filtering, sorting, editing, and deleting.
 */
export function AccessoryList({
  onEdit,
  isLocked,
  mode = "display",
  onAccessorySelect,
  filterBySlotLevel,
  filterBySlotType,
}: AccessoryListProps) {
  const { accessories, deleteAccessory } = useAccessories();
  const { skills } = useSkills();
  const [typeFilter, setTypeFilter] = useState<"all" | "weapon" | "armor">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const accessoriesPerPage =
    DataStorage.loadData<AppSettings>("settings")[0]?.accessoriesPerPage ??
    DEFAULT_ACCESSORIES_PER_PAGE;

  // Helper to get a skill object by its ID.
  const getSkill = (skillId: string) => {
    return skills.find((s) => s.id === skillId);
  };

  // Helper to get the slot icon path.
  const getSlotIcon = (type: "weapon" | "armor", level: number) => {
    if (level >= 1 && level <= 3) {
      return `/slot/${type}-slot-${level}.png`;
    }
    return "";
  };

  // Filter accessories based on various criteria.
  const filteredAccessories = accessories.filter((accessory) => {
    // Explicit slot type filter (for the set builder: distinguishes weapon/armor slots).
    if (filterBySlotType && accessory.type !== filterBySlotType) return false;

    // Type filter from the top buttons (user-toggleable only when filterBySlotType is not specified).
    if (
      !filterBySlotType &&
      typeFilter !== "all" &&
      accessory.type !== typeFilter
    )
      return false;

    // Slot level filter: the level of the accessory must not be higher than the slot level.
    if (filterBySlotLevel && accessory.slotLevel > filterBySlotLevel)
      return false;
    if (searchQuery) {
      const keyword = searchQuery.toLowerCase();
      return (
        accessory.name.toLowerCase().includes(keyword) ||
        accessory.description.toLowerCase().includes(keyword) ||
        accessory.skills.some((skill) => {
          const foundSkill = getSkill(skill.skillId);
          return foundSkill
            ? foundSkill.name.toLowerCase().includes(keyword)
            : false;
        })
      );
    }
    return true;
  });

  // Pagination calculation.
  const totalPages = Math.ceil(filteredAccessories.length / accessoriesPerPage);
  const paginatedAccessories = filteredAccessories.slice(
    (currentPage - 1) * accessoriesPerPage,
    currentPage * accessoriesPerPage,
  );

  const handleDelete = (accessory: Accessory) => {
    if (confirm(`确定要删除装饰品"${accessory.name}"吗？`)) {
      deleteAccessory(accessory.id);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6">
      {/* MARK: Toolbar */}
      <div className="bg-card shrink-0 rounded-lg border p-2 shadow-sm sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <TooltipProvider>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {filterBySlotType ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="default" size="icon" disabled>
                      <img
                        src={
                          filterBySlotType === "weapon"
                            ? "/weapon.png"
                            : "/armor.png"
                        }
                        alt={filterBySlotType === "weapon" ? "武器" : "防具"}
                        className="h-5 w-5"
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{filterBySlotType === "weapon" ? "武器珠" : "防具珠"}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={typeFilter === "all" ? "default" : "outline"}
                        size="icon"
                        onClick={() => {
                          setTypeFilter("all");
                          setCurrentPage(1);
                        }}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>全部</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={
                          typeFilter === "weapon" ? "default" : "outline"
                        }
                        size="icon"
                        onClick={() => {
                          setTypeFilter("weapon");
                          setCurrentPage(1);
                        }}
                      >
                        <img src="/weapon.png" alt="武器" className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>武器珠</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={typeFilter === "armor" ? "default" : "outline"}
                        size="icon"
                        onClick={() => {
                          setTypeFilter("armor");
                          setCurrentPage(1);
                        }}
                      >
                        <img src="/armor.png" alt="防具" className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>防具珠</p>
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
            </div>
          </TooltipProvider>

          <div className="flex items-center justify-end gap-4">
            {/* Hide count information in selector mode. */}
            {mode !== "selector" && (
              <div className="text-muted-foreground text-sm">
                共 {filteredAccessories.length} 种装饰品
              </div>
            )}
            <Input
              type="text"
              placeholder="搜索装饰品名称或技能..."
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

      {/* MARK: Accessory Table */}
      <div className="bg-card min-h-0 flex-1 rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className={cn(
                  "bg-primary text-primary-foreground rounded-tl-lg text-center",
                  mode === "selector" ? "w-[10%]" : "w-[7%]",
                )}
              >
                孔位
              </TableHead>
              <TableHead
                className={cn(
                  "bg-primary text-primary-foreground text-center",
                  mode === "selector" ? "w-[30%]" : "w-[15%]",
                )}
              >
                装饰品名称
              </TableHead>
              <TableHead
                className={cn(
                  "bg-primary text-primary-foreground text-center",
                  mode === "selector" ? "w-[60%]" : "w-[60%]",
                )}
              >
                技能
              </TableHead>
              {mode !== "selector" && (
                <TableHead className="bg-primary text-primary-foreground w-[8%] text-center">
                  类型
                </TableHead>
              )}
              {mode !== "selector" && (
                <TableHead className="bg-primary text-primary-foreground w-[10%] rounded-tr-lg text-right">
                  操作
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAccessories.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={mode === "selector" ? 3 : 5}
                  className="text-muted-foreground py-8 text-center"
                >
                  暂无装饰品数据
                </TableCell>
              </TableRow>
            ) : (
              paginatedAccessories.map((accessory) => (
                <TableRow
                  key={accessory.id}
                  onClick={() =>
                    mode === "selector" && onAccessorySelect?.(accessory)
                  }
                  className={
                    mode === "selector"
                      ? "hover:bg-muted/50 cursor-pointer"
                      : ""
                  }
                >
                  <TableCell
                    className={cn(
                      "text-center",
                      mode === "selector" ? "w-[10%]" : "w-[7%]",
                    )}
                  >
                    <div className="flex items-center justify-center">
                      <img
                        src={getSlotIcon(accessory.type, accessory.slotLevel)}
                        alt={`${accessory.type === "weapon" ? "武器" : "防具"}孔位等级${accessory.slotLevel}`}
                        style={{ width: "1.5rem", height: "1.5rem" }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-center font-medium",
                      mode === "selector" ? "w-[30%]" : "w-[15%]",
                    )}
                  >
                    {accessory.name}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-center text-sm",
                      mode === "selector" ? "w-[60%]" : "w-[60%]",
                    )}
                  >
                    <div
                      className={cn(
                        "w-full",
                        accessory.skills.length === 2
                          ? "grid grid-cols-2 gap-4"
                          : "flex justify-center",
                      )}
                    >
                      {accessory.skills && accessory.skills.length > 0 ? (
                        accessory.skills.map((skill, index) => (
                          <div
                            key={index}
                            className={cn(
                              "mx-auto",
                              accessory.skills.length === 2 ? "w-2/3" : "w-1/3",
                            )}
                          >
                            {/* < 2xl View */}
                            <div className="block 2xl:hidden">
                              <SkillItem
                                skillId={skill.skillId}
                                level={skill.level}
                                variant={
                                  mode === "display" ? "default" : "default"
                                }
                              />
                            </div>
                            {/* >= 2xl View */}
                            <div className="hidden 2xl:block">
                              <SkillItem
                                skillId={skill.skillId}
                                level={skill.level}
                                variant={
                                  mode === "display" ? "full" : "default"
                                }
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  {mode !== "selector" && (
                    <TableCell className="w-[8%] text-center">
                      <Badge variant="outline" className="text-center text-xs">
                        {accessory.type === "weapon" ? "武器" : "防具"}
                      </Badge>
                    </TableCell>
                  )}
                  {mode !== "selector" && (
                    <TableCell className="w-[10%] text-right">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit?.(accessory)}
                          disabled={isLocked}
                          className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(accessory)}
                          disabled={isLocked}
                          className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                        >
                          <Trash2 className="text-destructive h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
