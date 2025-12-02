import { Award, ChevronDown, ChevronsDown, List } from 'lucide-react';
import { useMemo, useState } from 'react';

import { EquipmentCard } from '@/components/equipments/EquipmentCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useWeapon } from '@/hooks';
import { cn } from '@/lib/utils';
import { groupWeaponsIntoRows } from '@/utils/weapon-grouper';

import type { Weapon, WeaponType } from '@/types';
import type { EquipmentCellType } from '@/types/set-builder';

export interface WeaponListProps {
    mode?: 'display' | 'selector';
    onWeaponSelect?: (weapon: Weapon) => void;
    selectingFor?: EquipmentCellType; // 新增
    currentWeapon?: Weapon | null;    // 新增
}

/**
 * WeaponList 组件
 *
 * 显示武器列表，支持按武器类型筛选和搜索，使用12列网格布局展示武器
 */
export function WeaponList({
    mode = 'display',
    onWeaponSelect,
    selectingFor,
    currentWeapon
}: WeaponListProps) {
    // 状态管理
    const [selectedWeaponType, setSelectedWeaponType] = useState<WeaponType>('rod');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedRarity, setSelectedRarity] = useState<'all' | 'low' | 'high' | 'master'>('all');

    // 获取武器数据
    const { weapons, loading, error } = useWeapon();

    // 数据处理：筛选、排序并分组为行
    const weaponRows = useMemo(() => {
        if (!weapons) return [];

        // 筛选：根据武器类型、稀有度和搜索查询
        const filteredWeapons = weapons.filter(weapon => {
            // 稀有度筛选
            const rankMatch =
                selectedRarity === 'all' ||
                (selectedRarity === 'low' && weapon.rarity >= 1 && weapon.rarity <= 4) ||
                (selectedRarity === 'high' && weapon.rarity >= 5 && weapon.rarity <= 8) ||
                (selectedRarity === 'master' && weapon.rarity >= 9 && weapon.rarity <= 12);

            if (!rankMatch) return false;

            // 武器类型和搜索查询
            return weapon.type === selectedWeaponType &&
                (searchQuery === '' || weapon.name.toLowerCase().includes(searchQuery.toLowerCase()));
        });

        // 按sortId升序排序（已在groupWeaponsIntoRows中处理，但这里明确处理）
        filteredWeapons.sort((a, b) => a.sortId - b.sortId);

        // 调用groupWeaponsIntoRows分组为行
        return groupWeaponsIntoRows(filteredWeapons);
    }, [weapons, selectedWeaponType, searchQuery, selectedRarity]);

    // 根据选择的稀有度确定要显示的列
    const rarityColumns = useMemo(() => {
        switch (selectedRarity) {
            case 'low':
                return [1, 2, 3, 4];
            case 'high':
                return [5, 6, 7, 8];
            case 'master':
                return [9, 10, 11, 12];
            case 'all':
            default:
                return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        }
    }, [selectedRarity]);

    // 加载状态
    if (loading) {
        return <div className="flex justify-center items-center p-8">加载中...</div>;
    }

    // 错误状态
    if (error) {
        return <div className="flex justify-center items-center p-8 text-red-500">加载武器数据失败: {error.message}</div>;
    }

    // 武器类型选项（14个武器类型）
    const weaponTypes: WeaponType[] = [
        'hammer', 'lance', 'long-sword', 'short-sword', 'tachi', 'twin-sword',
        'charge-axe', 'gun-lance', 'rod', 'slash-axe', 'whistle',
        'bow', 'heavy-bowgun', 'light-bowgun'
    ];

    return (
        <div className="h-full flex flex-col gap-4">
            {/* 菜单栏 */}
            <div className="bg-card p-2 sm:p-4 rounded-lg border shadow-sm flex-shrink-0">
                <div className="flex flex-wrap justify-between items-center gap-2 sm:gap-3">
                    {/* 武器类型切换 */}
                    <ToggleGroup
                        type="single"
                        value={selectedWeaponType}
                        onValueChange={(value) => value && setSelectedWeaponType(value as WeaponType)}
                        className="justify-start flex-wrap gap-0"
                    >
                        {weaponTypes.map((type) => (
                            <ToggleGroupItem key={type} value={type} className="text-xs">
                                <img
                                    src={`/weapon-type/${type}.png`}
                                    alt={type}
                                    className="w-6 h-6"
                                />
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>

                    {/* 右侧组合：稀有度筛选 + 搜索框 */}
                    <div className="flex items-center gap-2">
                        {/* 稀有度筛选 */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant={selectedRarity === 'all' ? 'default' : 'outline'}
                                size="icon"
                                onClick={() => setSelectedRarity('all')}
                                title="全部武器"
                            >
                                <List className="w-4 h-4" />
                            </Button>
                            <Button
                                variant={selectedRarity === 'low' ? 'default' : 'outline'}
                                size="icon"
                                onClick={() => setSelectedRarity('low')}
                                title="下位武器"
                            >
                                <ChevronDown className="w-4 h-4" />
                            </Button>
                            <Button
                                variant={selectedRarity === 'high' ? 'default' : 'outline'}
                                size="icon"
                                onClick={() => setSelectedRarity('high')}
                                title="上位武器"
                            >
                                <ChevronsDown className="w-4 h-4" />
                            </Button>
                            <Button
                                variant={selectedRarity === 'master' ? 'default' : 'outline'}
                                size="icon"
                                onClick={() => setSelectedRarity('master')}
                                title="大师位武器"
                            >
                                <Award className="w-4 h-4" />
                            </Button>
                        </div>

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
            <div className="flex-1 min-h-0 bg-card rounded-lg border shadow-sm overflow-x-auto">
                <Table className={cn(selectedRarity === "all" ? "w-[200%]" : "")}>
                    {/* 表头 */}
                    <TableHeader>
                        <TableRow>
                            {rarityColumns.map((rarity, index) => (
                                <TableHead
                                    key={`header-${rarity}`}
                                    className={cn(
                                        "text-center bg-primary text-primary-foreground",
                                        selectedRarity === "all" ? "1/6" : "w-1/4",
                                        index === 0 ? 'rounded-tl-lg' : index === rarityColumns.length - 1 ? 'rounded-tr-lg' : ''
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
                                        const isSelector = mode === 'selector';
                                        const isSelected = !!currentWeapon && currentWeapon?.id === weapon?.id;
                                        const isMatchingSlot = isSelector && selectingFor === 'weapon';

                                        return (
                                            <TableCell
                                                key={`cell-${rowIndex}-${rarity}`}
                                                className={cn(
                                                    'p-2',
                                                    selectedRarity === "all" ? "1/6" : "w-1/4",
                                                    isSelector && 'transition-colors rounded-lg',
                                                    isSelector && isMatchingSlot && 'cursor-pointer hover:bg-accent/50',
                                                    isSelector && !isMatchingSlot && 'cursor-not-allowed opacity-50'
                                                )}
                                                onClick={
                                                    isSelector && onWeaponSelect && isMatchingSlot && weapon
                                                        ? () => onWeaponSelect(weapon)
                                                        : undefined
                                                }
                                            >
                                                {weapon ? (
                                                    <EquipmentCard
                                                        item={weapon}
                                                        variant={mode === 'selector' ? 'compact' : 'full'}
                                                        isSelected={isSelected}
                                                    />
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
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