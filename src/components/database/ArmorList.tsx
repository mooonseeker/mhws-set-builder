import { Award, ChevronDown, ChevronsDown, List } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ErrorMessage, Loading } from '@/components/common';
import { EquipmentCard } from '@/components/equipments';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { useSkills } from '@/contexts';
import { useArmor } from '@/contexts/ArmorContext';
import { cn } from '@/lib/utils';
import { ARMOR_SERIES_PER_PAGE } from '@/types/constants';

import type { Armor, SkillWithLevel } from '@/types';
import type { EquipmentCellType } from '@/types/set-builder';

/**
 * 按系列分组的防具数据结构
 */
interface GroupedArmor {
    series: string;
    helm?: Armor;
    body?: Armor;
    arm?: Armor;
    waist?: Armor;
    leg?: Armor;
    fullSetSkills: SkillWithLevel[];
}

/**
 * ArmorList 组件
 *
 * 显示按系列分组的防具列表表格
 */
export interface ArmorListProps {
    mode?: 'display' | 'selector';
    onPieceSelect?: (piece: Armor) => void;
    selectingFor?: EquipmentCellType; // 新增
    currentPiece?: Armor | null;      // 新增
}

export function ArmorList({
    mode = 'display',
    onPieceSelect,
    selectingFor,
    currentPiece
}: ArmorListProps) {
    const { armor, loading, error } = useArmor();
    const { skills } = useSkills();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRarity, setSelectedRarity] = useState<'all' | 'low' | 'high' | 'master'>('all');

    // 获取技能名称的辅助函数
    const getSkillName = useCallback((skillId: string) => {
        const skill = skills.find((s) => s.id === skillId);
        return skill?.name || '未知技能';
    }, [skills]);

    /**
     * 将防具数组按系列分组，并计算全套技能
     */
    const groupedArmor = useMemo((): GroupedArmor[] => {
        const groups = new Map<string, GroupedArmor>();

        armor.forEach((piece: Armor) => {
            if (!groups.has(piece.series)) {
                groups.set(piece.series, {
                    series: piece.series,
                    fullSetSkills: []
                });
            }

            const group = groups.get(piece.series)!;

            // 根据防具类型分配到对应字段
            switch (piece.type) {
                case 'helm':
                    group.helm = piece;
                    break;
                case 'body':
                    group.body = piece;
                    break;
                case 'arm':
                    group.arm = piece;
                    break;
                case 'waist':
                    group.waist = piece;
                    break;
                case 'leg':
                    group.leg = piece;
                    break;
            }
        });

        // 计算每个系列的全套技能
        groups.forEach(group => {
            const allSkills = [
                ...(group.helm?.skills || []),
                ...(group.body?.skills || []),
                ...(group.arm?.skills || []),
                ...(group.waist?.skills || []),
                ...(group.leg?.skills || [])
            ];

            const skillMap = new Map<string, number>();

            allSkills.forEach(skill => {
                const currentLevel = skillMap.get(skill.skillId) || 0;
                skillMap.set(skill.skillId, currentLevel + skill.level);
            });

            group.fullSetSkills = Array.from(skillMap.entries()).map(([skillId, level]) => ({
                skillId,
                level
            }));
        });

        return Array.from(groups.values());
    }, [armor]);

    /**
     * 搜索过滤和分页处理
     */
    const filteredAndPaginatedArmor = useMemo(() => {
        // 搜索过滤
        let filtered = groupedArmor;

        if (searchQuery) {
            const keyword = searchQuery.toLowerCase();
            filtered = groupedArmor.filter(group => {
                // 检查系列名称
                if (group.series.toLowerCase().includes(keyword)) return true;

                // 检查装备名称
                const pieceNames = [
                    group.helm?.name,
                    group.body?.name,
                    group.arm?.name,
                    group.waist?.name,
                    group.leg?.name
                ].filter(Boolean);

                if (pieceNames.some(name => name?.toLowerCase().includes(keyword))) return true;

                // 检查技能名称
                const skillNames = group.fullSetSkills.map(skill => getSkillName(skill.skillId));
                return skillNames.some(name => name.toLowerCase().includes(keyword));
            });
        }

        // 稀有度筛选
        if (selectedRarity !== 'all') {
            filtered = filtered.filter(group => {
                const pieces = [group.helm, group.body, group.arm, group.waist, group.leg].filter(Boolean);

                // 检查系列中是否有符合稀有度要求的防具
                return pieces.some(piece => {
                    if (!piece) return false;

                    switch (selectedRarity) {
                        case 'low':
                            return piece.rarity >= 1 && piece.rarity <= 4;
                        case 'high':
                            return piece.rarity >= 5 && piece.rarity <= 8;
                        case 'master':
                            return piece.rarity >= 9 && piece.rarity <= 12;
                        default:
                            return true;
                    }
                });
            });
        }

        // 分页
        const totalPages = Math.ceil(filtered.length / ARMOR_SERIES_PER_PAGE);
        const startIndex = (currentPage - 1) * ARMOR_SERIES_PER_PAGE;
        const endIndex = startIndex + ARMOR_SERIES_PER_PAGE;
        const paginated = filtered.slice(startIndex, endIndex);

        return {
            data: paginated,
            totalCount: filtered.length,
            totalPages
        };
    }, [groupedArmor, searchQuery, currentPage, getSkillName, selectedRarity]);

    // 当搜索条件或稀有度筛选变化时，重置到第一页
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedRarity]);

    if (loading) {
        return <Loading />;
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    /**
     * 渲染防具部件列
     */
    const renderArmorPiece = (piece?: Armor) => {
        if (!piece) {
            return <TableCell>-</TableCell>;
        }

        const isSelector = mode === 'selector';
        const isSelected = !!currentPiece && currentPiece.id === piece.id;
        const isMatchingSlot = isSelector && piece.type === selectingFor;

        return (
            <TableCell
                className={cn(
                    isSelector && 'transition-colors',
                    isSelector && isMatchingSlot && 'cursor-pointer hover:bg-accent/50',
                    isSelector && !isMatchingSlot && 'cursor-not-allowed opacity-50'
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
                    variant={isSelector ? 'compact' : 'full'}
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
                    {skills.map(skill => (
                        <div key={skill.skillId} className="text-xs">
                            {getSkillName(skill.skillId)} Lv.{skill.level}
                        </div>
                    ))}
                </div>
            </TableCell>
        );
    };

    return (
        <div className="h-full flex flex-col gap-6">
            {/* 菜单栏 */}
            <div className="flex-shrink-0 bg-card p-2 sm:p-4 rounded-lg border shadow-sm">
                <div className="flex flex-nowrap justify-between items-center gap-2 sm:gap-3">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <Button
                            variant={selectedRarity === 'all' ? 'default' : 'outline'}
                            size="icon"
                            onClick={() => setSelectedRarity('all')}
                            title="全部防具"
                        >
                            <List className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={selectedRarity === 'low' ? 'default' : 'outline'}
                            size="icon"
                            onClick={() => setSelectedRarity('low')}
                            title="下位防具"
                        >
                            <ChevronDown className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={selectedRarity === 'high' ? 'default' : 'outline'}
                            size="icon"
                            onClick={() => setSelectedRarity('high')}
                            title="上位防具"
                        >
                            <ChevronsDown className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={selectedRarity === 'master' ? 'default' : 'outline'}
                            size="icon"
                            onClick={() => setSelectedRarity('master')}
                            title="大师位防具"
                        >
                            <Award className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-4 justify-end">
                        {mode !== 'selector' && (
                            <div className="text-muted-foreground text-sm whitespace-nowrap">
                                共 {filteredAndPaginatedArmor.totalCount} 个防具系列
                            </div>
                        )}
                        <Input
                            type="text"
                            placeholder="搜索系列、防具或技能..."
                            className="h-9 flex-1 max-w-64"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
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
            <div className="flex-1 min-h-0 bg-card rounded-lg border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[10%] text-center bg-primary text-primary-foreground rounded-tl-lg">防具系列</TableHead>
                            <TableHead className="w-[15%] text-center bg-primary text-primary-foreground">头盔</TableHead>
                            <TableHead className="w-[15%] text-center bg-primary text-primary-foreground">胸甲</TableHead>
                            <TableHead className="w-[15%] text-center bg-primary text-primary-foreground">臂甲</TableHead>
                            <TableHead className="w-[15%] text-center bg-primary text-primary-foreground">腰甲</TableHead>
                            <TableHead className="w-[15%] text-center bg-primary text-primary-foreground">腿甲</TableHead>
                            {mode !== 'selector' && (
                                <TableHead className="w-[15%] text-center bg-primary text-primary-foreground rounded-tr-lg">全套技能</TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndPaginatedArmor.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={mode === 'selector' ? 6 : 7} className="text-center py-8 text-muted-foreground">
                                    暂无防具数据
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAndPaginatedArmor.data.map(group => (
                                <TableRow key={group.series}>
                                    <TableCell className="text-center">
                                        <Badge variant="outline">{group.series}</Badge>
                                    </TableCell>
                                    {renderArmorPiece(group.helm)}
                                    {renderArmorPiece(group.body)}
                                    {renderArmorPiece(group.arm)}
                                    {renderArmorPiece(group.waist)}
                                    {renderArmorPiece(group.leg)}
                                    {mode !== 'selector' && renderFullSetSkills(group.fullSetSkills)}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}