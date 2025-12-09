import { List, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { SkillItem } from '@/components/skills/SkillItem';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAccessories } from '@/contexts';
import { useSkills } from '@/contexts/SkillContext';
import { cn } from '@/lib/utils';

import type { Accessory, SlotLevel } from '@/types';

export interface AccessoryListProps {
    onEdit?: (accessory: Accessory) => void;
    isLocked?: boolean;
    mode?: 'display' | 'selector';
    onAccessorySelect?: (accessory: Accessory) => void;
    filterBySlotLevel?: SlotLevel;
    /** 按孔位类型过滤：用于区分武器孔位/防具孔位装饰品 */
    filterBySlotType?: 'weapon' | 'armor';
}

/**
 * 装饰品列表组件
 * 显示所有装饰品并支持筛选、排序、编辑和删除
 */

export function AccessoryList({
    onEdit,
    isLocked,
    mode = 'display',
    onAccessorySelect,
    filterBySlotLevel,
    filterBySlotType,
}: AccessoryListProps) {
    const { accessories, deleteAccessory } = useAccessories();
    const { skills } = useSkills();
    const [typeFilter, setTypeFilter] = useState<'all' | 'weapon' | 'armor'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const ACCESSORIES_PER_PAGE = 10;

    // 获取技能对象
    const getSkill = (skillId: string) => {
        return skills.find(s => s.id === skillId);
    };

    // 获取孔位等级图标
    const getSlotIcon = (type: 'weapon' | 'armor', level: number) => {
        if (level >= 1 && level <= 3) {
            return `/slot/${type}-slot-${level}.png`;
        }
        return '';
    };

    // 筛选装饰品
    const filteredAccessories = accessories.filter((accessory) => {
        // 显式孔位类型过滤（用于配装器：区分武器孔/防具孔）
        if (filterBySlotType && accessory.type !== filterBySlotType) return false;

        // 顶部按钮的类型过滤（仅在未指定filterBySlotType时由用户切换）
        if (!filterBySlotType && typeFilter !== 'all' && accessory.type !== typeFilter) return false;

        // 孔位等级过滤：装饰品需要的等级不得高于孔位等级
        if (filterBySlotLevel && accessory.slotLevel > filterBySlotLevel) return false;
        if (searchQuery) {
            const keyword = searchQuery.toLowerCase();
            return accessory.name.toLowerCase().includes(keyword) ||
                accessory.description.toLowerCase().includes(keyword) ||
                accessory.skills.some(skill => {
                    const foundSkill = getSkill(skill.skillId);
                    return foundSkill ? foundSkill.name.toLowerCase().includes(keyword) : false;
                });
        }
        return true;
    });

    // 分页计算
    const totalPages = Math.ceil(filteredAccessories.length / ACCESSORIES_PER_PAGE);
    const paginatedAccessories = filteredAccessories.slice(
        (currentPage - 1) * ACCESSORIES_PER_PAGE,
        currentPage * ACCESSORIES_PER_PAGE
    );

    // 当筛选条件变化时，重置到第一页
    useEffect(() => {
        setCurrentPage(1);
    }, [typeFilter, searchQuery]);

    const handleDelete = (accessory: Accessory) => {
        if (confirm(`确定要删除装饰品"${accessory.name}"吗？`)) {
            deleteAccessory(accessory.id);
        }
    };

    return (
        <div className="h-full flex flex-col gap-6">
            {/* 菜单栏 */}
            <div className="shrink-0 bg-card p-2 sm:p-4 rounded-lg border shadow-sm">
                <div className="flex flex-wrap justify-between items-center gap-2 sm:gap-3">
                    <TooltipProvider>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            {filterBySlotType ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="default"
                                            size="icon"
                                            disabled
                                        >
                                            <img
                                                src={filterBySlotType === 'weapon' ? '/weapon.png' : '/armor.png'}
                                                alt={filterBySlotType === 'weapon' ? '武器' : '防具'}
                                                className="h-5 w-5"
                                            />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{filterBySlotType === 'weapon' ? '武器珠' : '防具珠'}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ) : (
                                <>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant={typeFilter === 'all' ? 'default' : 'outline'}
                                                size="icon"
                                                onClick={() => setTypeFilter('all')}
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
                                                variant={typeFilter === 'weapon' ? 'default' : 'outline'}
                                                size="icon"
                                                onClick={() => setTypeFilter('weapon')}
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
                                                variant={typeFilter === 'armor' ? 'default' : 'outline'}
                                                size="icon"
                                                onClick={() => setTypeFilter('armor')}
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

                    <div className="flex items-center gap-4 justify-end">
                        {/* selector模式下隐藏数量信息 */}
                        {mode !== 'selector' && (
                            <div className="text-muted-foreground text-sm">
                                共 {filteredAccessories.length} 种装饰品
                            </div>
                        )}
                        <Input
                            type="text"
                            placeholder="搜索装饰品名称或技能..."
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

            {/* 装饰品表格 */}
            <div className="flex-1 min-h-0 bg-card rounded-lg border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className={cn(
                                "text-center bg-primary text-primary-foreground rounded-tl-lg",
                                mode === 'selector' ? "w-[10%]" : "w-[7%]"
                            )}>孔位</TableHead>
                            <TableHead className={cn(
                                "text-center bg-primary text-primary-foreground",
                                mode === 'selector' ? "w-[30%]" : "w-[15%]"
                            )}>装饰品名称</TableHead>
                            <TableHead className={cn(
                                "text-center bg-primary text-primary-foreground",
                                mode === 'selector' ? "w-[60%]" : "w-[60%]"
                            )}>技能</TableHead>
                            {mode !== 'selector' && (
                                <TableHead className="text-center w-[8%] bg-primary text-primary-foreground">类型</TableHead>
                            )}
                            {mode !== 'selector' && (
                                <TableHead className="text-right w-[10%] bg-primary text-primary-foreground rounded-tr-lg">操作</TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAccessories.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={mode === 'selector' ? 3 : 5}
                                    className="text-center py-8 text-muted-foreground"
                                >
                                    暂无装饰品数据
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedAccessories.map((accessory) => (
                                <TableRow
                                    key={accessory.id}
                                    onClick={() => mode === 'selector' && onAccessorySelect?.(accessory)}
                                    className={mode === 'selector' ? 'cursor-pointer hover:bg-muted/50' : ''}
                                >
                                    <TableCell className={cn(
                                        "text-center",
                                        mode === 'selector' ? "w-[10%]" : "w-[7%]"
                                    )}>
                                        <div className="flex items-center justify-center">
                                            <img
                                                src={getSlotIcon(accessory.type, accessory.slotLevel)}
                                                alt={`${accessory.type === 'weapon' ? '武器' : '防具'}孔位等级${accessory.slotLevel}`}
                                                style={{ width: '1.5rem', height: '1.5rem' }}
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className={cn(
                                        "text-center font-medium",
                                        mode === 'selector' ? "w-[30%]" : "w-[15%]"
                                    )}>
                                        {accessory.name}
                                    </TableCell>
                                    <TableCell className={cn(
                                        "text-center text-sm",
                                        mode === 'selector' ? "w-[60%]" : "w-[60%]"
                                    )}>
                                        <div className={cn(
                                            "w-full",
                                            accessory.skills.length === 2 ? "grid grid-cols-2 gap-4" : "flex justify-center"
                                        )}>
                                            {accessory.skills && accessory.skills.length > 0 ? (
                                                accessory.skills.map((skill, index) => (
                                                    <div
                                                        key={index}
                                                        className={cn(
                                                            "mx-auto",
                                                            accessory.skills.length === 2 ? "w-2/3" : "w-1/3"
                                                        )}
                                                    >
                                                        {/* < 2xl View */}
                                                        <div className="block 2xl:hidden">
                                                            <SkillItem
                                                                skillId={skill.skillId}
                                                                level={skill.level}
                                                                variant={mode === 'display' ? 'default' : 'default'}
                                                            />
                                                        </div>
                                                        {/* >= 2xl View */}
                                                        <div className="hidden 2xl:block">
                                                            <SkillItem
                                                                skillId={skill.skillId}
                                                                level={skill.level}
                                                                variant={mode === 'display' ? 'full' : 'default'}
                                                            />
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    {mode !== 'selector' && (
                                        <TableCell className="text-center w-[8%]">
                                            <Badge variant="outline" className="text-center text-xs">
                                                {accessory.type === 'weapon' ? '武器' : '防具'}
                                            </Badge>
                                        </TableCell>
                                    )}
                                    {mode !== 'selector' && (
                                        <TableCell className="text-right w-[10%]">
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
                                                    <Trash2 className="h-4 w-4 text-destructive" />
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