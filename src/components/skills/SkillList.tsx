import { List, Pencil, Star, Trash2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useSkills } from "@/contexts";
import { SKILL_CATEGORY_LABELS, SKILLS_PER_PAGE } from "@/types/constants";

import type { Skill, SkillCategory, SlotLevel } from "@/types";

interface SkillListProps {
  onEdit: (skill: Skill) => void;
  isLocked?: boolean;
}

/**
 * 技能列表组件
 * 显示所有技能并支持筛选、排序、编辑和删除
 */

export function SkillList({ onEdit, isLocked }: SkillListProps) {
  const { skills, deleteSkill } = useSkills();
  const [categoryFilter, setCategoryFilter] = useState<SkillCategory | "all">(
    "all",
  );
  const [keyOnlyFilter, setKeyOnlyFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // 获取装饰品等级图标
  const getAccessoryIcon = (
    skillCategory: SkillCategory,
    accessoryLevel: SlotLevel,
  ) => {
    switch (skillCategory) {
      case "weapon":
        return `/slot/weapon-slot-${accessoryLevel}.png`;
      case "armor":
        return `/slot/armor-slot-${accessoryLevel}.png`;
      case "series":
      case "group":
      default:
        return `/set.png`;
    }
  };

  // 获取技能分类图标
  const getCategoryIcon = (skillCategory: SkillCategory) => {
    return `/skill-category/${skillCategory}.png`;
  };

  // 筛选技能
  const filteredSkills = skills.filter((skill) => {
    if (categoryFilter !== "all" && skill.category !== categoryFilter)
      return false;
    if (keyOnlyFilter && !skill.isKey) return false;
    if (searchQuery) {
      // 检查是否为精确匹配（以等号开头）
      const isExactMatch = searchQuery.startsWith("=");
      const keyword = isExactMatch ? searchQuery.slice(1) : searchQuery;

      const matches = isExactMatch
        ? skill.name.toLowerCase() === keyword.toLowerCase()
        : skill.name.toLowerCase().includes(keyword.toLowerCase());

      if (!matches) return false;
    }
    return true;
  });

  // 分页计算
  const totalPages = Math.ceil(filteredSkills.length / SKILLS_PER_PAGE);
  const paginatedSkills = filteredSkills.slice(
    (currentPage - 1) * SKILLS_PER_PAGE,
    currentPage * SKILLS_PER_PAGE,
  );

  // 筛选条件变化时，重置到第一页并更新筛选
  const handleCategoryChange = (category: SkillCategory | "all") => {
    setCategoryFilter(category);
    setCurrentPage(1);
  };

  const handleKeyOnlyFilterChange = (checked: boolean | "indeterminate") => {
    setKeyOnlyFilter(checked === true);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleDelete = (skill: Skill) => {
    if (confirm(`确定要删除技能"${skill.name}"吗？`)) {
      deleteSkill(skill.id);
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
                    variant={categoryFilter === "all" ? "default" : "outline"}
                    size="icon"
                    onClick={() => handleCategoryChange("all")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>全部技能</p>
                </TooltipContent>
              </Tooltip>
              {(["weapon", "armor", "series", "group"] as SkillCategory[]).map(
                (category) => (
                  <Tooltip key={category}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={
                          categoryFilter === category ? "default" : "outline"
                        }
                        size="icon"
                        onClick={() => handleCategoryChange(category)}
                      >
                        <img
                          src={`/skill-category/${category}.png`}
                          alt={SKILL_CATEGORY_LABELS[category]}
                          className="h-6 w-6"
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{SKILL_CATEGORY_LABELS[category]}</p>
                    </TooltipContent>
                  </Tooltip>
                ),
              )}
              <div className="w-2"></div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="key-only"
                  checked={keyOnlyFilter}
                  onCheckedChange={handleKeyOnlyFilterChange}
                />
                <label
                  htmlFor="key-only"
                  className="cursor-pointer text-xs sm:text-sm"
                >
                  仅核心技能
                </label>
              </div>
            </div>
          </TooltipProvider>

          <div className="flex items-center justify-end gap-4">
            <div className="text-muted-foreground text-sm">
              共 {filteredSkills.length} 个技能
            </div>
            <Input
              type="text"
              placeholder="搜索技能名称..."
              className="h-9 max-w-40"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>

      {/* 技能表格 */}
      <div className="bg-card min-h-0 flex-1 rounded-lg border shadow-sm">
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="bg-primary text-primary-foreground w-[5%] rounded-tl-lg text-center">
                核心
              </TableHead>
              <TableHead className="bg-primary text-primary-foreground w-[23%] text-center">
                技能名称
              </TableHead>
              <TableHead className="bg-primary text-primary-foreground hidden w-[32%] text-center lg:table-cell">
                技能描述
              </TableHead>
              <TableHead className="bg-primary text-primary-foreground hidden w-[12%] text-center md:table-cell">
                分类
              </TableHead>
              <TableHead className="bg-primary text-primary-foreground w-[8%] text-center">
                装饰品
              </TableHead>
              <TableHead className="bg-primary text-primary-foreground w-[8%] text-center">
                最大等级
              </TableHead>
              <TableHead className="bg-primary text-primary-foreground w-[12%] rounded-tr-lg text-right">
                操作
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSkills.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground py-8 text-center"
                >
                  暂无技能数据
                </TableCell>
              </TableRow>
            ) : (
              paginatedSkills.map((skill) => (
                <TableRow key={skill.id}>
                  <TableCell className="text-center">
                    <Star
                      className={`h-4 w-4 ${skill.isKey ? "fill-warning text-warning-foreground" : "text-muted-foreground"} inline`}
                    />
                  </TableCell>
                  <TableCell className="text-left font-medium md:pl-4 lg:pl-8">
                    <div className="flex items-center gap-2">
                      <img
                        src={`/skill-type/${skill.type}.png`}
                        alt={`${skill.type} icon`}
                        style={{ width: "1.5rem", height: "1.5rem" }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      {skill.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden truncate text-left text-sm lg:table-cell">
                    {skill.description || "—"}
                  </TableCell>
                  <TableCell className="hidden text-center md:table-cell">
                    <div className="flex items-center justify-center gap-1">
                      <img
                        src={getCategoryIcon(skill.category)}
                        alt={`${SKILL_CATEGORY_LABELS[skill.category]} icon`}
                        style={{ width: "1.5rem", height: "1.5rem" }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <Badge
                        variant="outline"
                        className="hidden text-center text-xs lg:flex"
                      >
                        {SKILL_CATEGORY_LABELS[skill.category]}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    <div className="flex items-center justify-center gap-4">
                      {skill.accessoryLevel !== -1 ? (
                        <img
                          src={getAccessoryIcon(
                            skill.category,
                            skill.accessoryLevel,
                          )}
                          alt={`${SKILL_CATEGORY_LABELS[skill.category]}装饰品等级${skill.accessoryLevel}`}
                          style={{ width: "1.5rem", height: "1.5rem" }}
                        />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {skill.maxLevel}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 sm:gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(skill)}
                        disabled={isLocked}
                        className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(skill)}
                        disabled={isLocked}
                        className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                      >
                        <Trash2 className="text-destructive h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
