import { Gem, Lock, Plus, Shield, Sparkles, Swords, Unlock } from 'lucide-react';
import { useState } from 'react';

import { ErrorMessage, Loading } from '@/components/common';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useAccessories, useArmor, useSkills } from '@/contexts';
import { generateSkillId } from '@/utils';

import { SkillForm } from '../skills/SkillForm';
import { SkillList } from '../skills/SkillList';
import { AccessoryForm } from './AccessoryForm';
import { AccessoryList } from './AccessoryList';
import { ArmorList } from './ArmorList';
import { WeaponList } from './WeaponList';

import type { Skill, Accessory } from '@/types';

/**
 * 数据库管理主组件
 * 整合技能和装饰品列表和表单功能
 */
export function DatabaseManager() {
    const {
        loading: skillsLoading,
        error: skillsError,
        addSkill,
        updateSkill,
        skills
    } = useSkills();
    const {
        loading: accessoriesLoading,
        error: accessoriesError,
        addAccessory,
        updateAccessory,
        accessories
    } = useAccessories();
    const {
        loading: armorLoading,
        error: armorError
    } = useArmor();

    const [currentDb, setCurrentDb] = useState<'skills' | 'accessories' | 'armor' | 'weapons'>('skills');
    const [isLocked, setIsLocked] = useState<boolean>(true);
    const [formOpen, setFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<{ type: 'skill' | 'accessory'; data: Skill | Accessory } | undefined>();
    const [formError, setFormError] = useState<string | null>(null);

    const loading = skillsLoading || accessoriesLoading || armorLoading;
    const error = skillsError || accessoriesError || armorError;

    const handleAdd = () => {
        setFormError(null); // 打开表单时清除旧错误
        if (currentDb === 'skills') {
            setEditingItem({
                type: 'skill',
                data: {
                    id: '',
                    name: '',
                    category: 'armor',
                    maxLevel: 1,
                    accessoryLevel: -1,
                    isKey: false,
                    description: '',
                    type: 'SKILL_0000',
                    sortId: 999,
                },
            });
        } else if (currentDb === 'accessories') {
            setEditingItem({
                type: 'accessory',
                data: {
                    id: '',
                    name: '',
                    type: 'armor',
                    description: '',
                    sortID: 999,
                    skills: [],
                    rarity: 1,
                    slotLevel: 1,
                    color: 'default',
                },
            });
        }
        // TODO: 为防具和武器添加类似的处理
        setFormOpen(true);
    };

    const handleEdit = (item: Skill | Accessory, type: 'skill' | 'accessory') => {
        setEditingItem({ type, data: item });
        setFormError(null); // 打开表单时清除旧错误
        setFormOpen(true);
    };

    const handleSubmit = (itemData: Omit<Skill, 'id'> | Omit<Accessory, 'id'>) => {
        if (!editingItem) return;

        if (editingItem.type === 'skill') {
            const skillData = itemData as Omit<Skill, 'id'>;
            if (editingItem.data.id) {
                // 编辑模式
                try {
                    updateSkill({ ...skillData, id: editingItem.data.id });
                    setFormOpen(false);
                } catch (error) {
                    if (error instanceof Error) {
                        setFormError(error.message);
                    }
                }
            } else {
                // 添加模式
                try {
                    const newSkill: Skill = {
                        ...skillData,
                        id: generateSkillId(skillData.name),
                    };
                    addSkill(newSkill);
                    setFormOpen(false);
                } catch (error) {
                    if (error instanceof Error) {
                        setFormError(error.message);
                    }
                }
            }
        } else {
            const accessoryData = itemData as Omit<Accessory, 'id'>;
            if (editingItem.data.id) {
                // 编辑模式
                try {
                    updateAccessory({ ...accessoryData, id: editingItem.data.id });
                    setFormOpen(false);
                } catch (error) {
                    if (error instanceof Error) {
                        setFormError(error.message);
                    }
                }
            } else {
                // 添加模式
                try {
                    addAccessory(accessoryData as Accessory);
                    setFormOpen(false);
                } catch (error) {
                    if (error instanceof Error) {
                        setFormError(error.message);
                    }
                }
            }
        }
    };

    if (loading) {
        return <Loading message="加载数据库数据中..." />;
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    const addButtonText = currentDb === 'skills' ? '添加技能' : currentDb === 'accessories' ? '添加装饰品' : '添加';

    return (
        <div className="h-full flex flex-col gap-6">
            <div className="flex justify-between items-center shrink-0">
                <div className="flex items-center space-x-4">
                    <h1 className="font-bold tracking-tight">数据库管理</h1>
                    <ToggleGroup
                        type="single"
                        value={currentDb}
                        onValueChange={(value) => value && setCurrentDb(value as 'skills' | 'accessories' | 'armor' | 'weapons')}
                        size="sm"
                        className="border border-border rounded-md p-1"
                    >
                        <ToggleGroupItem value="skills" tooltip="技能">
                            <Sparkles className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="accessories" tooltip="装饰品">
                            <Gem className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="armor" tooltip="防具">
                            <Shield className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="weapons" tooltip="武器">
                            <Swords className="h-4 w-4" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                    <ToggleGroup
                        type="single"
                        value={isLocked ? 'locked' : 'unlocked'}
                        onValueChange={(value) => setIsLocked(value === 'locked')}
                        size="sm"
                        className="border border-border rounded-md p-1"
                    >
                        <ToggleGroupItem value="unlocked" tooltip="解锁编辑">
                            <Unlock className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="locked" tooltip="锁定编辑">
                            <Lock className="h-4 w-4" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
                <Button size="lg" onClick={handleAdd} disabled={isLocked}>
                    <Plus className="h-5 w-5 mr-2" />
                    {addButtonText}
                </Button>
            </div>

            <div className="flex-1 min-h-0">
                {currentDb === 'skills' && (
                    <SkillList
                        onEdit={(skill) => handleEdit(skill, 'skill')}
                        isLocked={isLocked}
                    />
                )}
                {currentDb === 'accessories' && (
                    <AccessoryList
                        onEdit={(accessory) => handleEdit(accessory, 'accessory')}
                        isLocked={isLocked}
                    />
                )}
                {currentDb === 'armor' && (
                    <ArmorList />
                )}
                {currentDb === 'weapons' && (
                    <WeaponList />
                )}
            </div>

            {editingItem?.type === 'skill' && (
                <SkillForm
                    skill={editingItem.data as Skill}
                    open={formOpen}
                    onClose={() => setFormOpen(false)}
                    onSubmit={handleSubmit}
                    error={formError}
                    skills={skills}
                />
            )}
            {editingItem?.type === 'accessory' && (
                <AccessoryForm
                    accessory={editingItem.data as Accessory}
                    open={formOpen}
                    onClose={() => setFormOpen(false)}
                    onSubmit={handleSubmit}
                    error={formError}
                    accessories={accessories}
                />
            )}
        </div>
    );
}