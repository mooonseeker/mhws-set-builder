import { cloneDeep } from 'lodash-es';
import React, { createContext, useCallback, useContext, useState } from 'react';

import { useAccessories } from '@/contexts/AccessoryContext';
import { useArmor } from '@/contexts/ArmorContext';
import { useCharms } from '@/contexts/CharmContext';
import { useSkills } from '@/contexts/SkillContext';
import { useWeapon } from '@/contexts/WeaponContext';
import { findOptimalSets } from '@/services/set-search';

import type {
    Accessory,
    Armor,
    Charm,
    EquipmentSet,
    EquipmentCellType,
    Slot,
    SkillWithLevel,
    Weapon,
} from '@/types';
import type { FinalSet } from '@/types/set-builder';
import type { ReactNode } from 'react';

export type SelectionContext =
    | { type: 'equipment'; equipmentType: EquipmentCellType }
    | { type: 'accessory'; slotType: EquipmentCellType; slotIndex: number; slot: Slot };

interface SetBuilderState {
    mode: 'manual' | 'auto';
    requiredSkills: SkillWithLevel[];
    searchResults: FinalSet[];
    isSearching: boolean;
    currentEquipmentSet: EquipmentSet;
    selectionContext: SelectionContext | null;
    isResultsModalOpen: boolean;
    lockedSlots: Record<EquipmentCellType, boolean>;
    autoModeView: 'requirements' | 'results' | 'summary';
    isSearchConfirmOpen: boolean;
}

interface SetBuilderActions {
    setMode: (mode: 'manual' | 'auto') => void;
    addRequiredSkill: (skill: SkillWithLevel) => void;
    updateRequiredSkillLevel: (skillId: string, newLevel: number) => void;
    startSearch: () => void;
    confirmSearch: () => Promise<void>;
    cancelSearch: () => void;
    loadSetToBuilder: (set: FinalSet) => void;
    handleEqSlotClick: (type: EquipmentCellType) => void;
    handleEqSelect: (item: Armor | Weapon | Charm) => void;
    handleSlotClick: (slotType: EquipmentCellType, slotIndex: number, slot: Slot) => void;
    handleAccessorySelect: (accessory: Accessory) => void;
    setIsResultsModalOpen: (isOpen: boolean) => void;
    toggleSlotLock: (type: EquipmentCellType) => void;
    setAutoModeView: (view: 'requirements' | 'results' | 'summary') => void;
    resetBuilder: () => void;
    clearEquipmentSlot: (type: EquipmentCellType) => void;
}

const SetBuilderContext = createContext<(SetBuilderState & SetBuilderActions) | undefined>(undefined);

interface SetBuilderProviderProps {
    children: ReactNode;
}

export const SetBuilderProvider: React.FC<SetBuilderProviderProps> = ({ children }) => {
    const { armor } = useArmor();
    const { weapons } = useWeapon();
    const { accessories } = useAccessories();
    const { skills } = useSkills();
    const { charms } = useCharms();

    const [mode, setMode] = useState<'manual' | 'auto'>('manual');
    const [requiredSkills, setRequiredSkills] = useState<SkillWithLevel[]>([]);
    const [searchResults, setSearchResults] = useState<FinalSet[]>([]);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [currentEquipmentSet, setCurrentEquipmentSet] = useState<EquipmentSet>({});
    const [selectionContext, setSelectionContext] = useState<SelectionContext | null>(null);
    const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
    const [lockedSlots, setLockedSlots] = useState<Record<EquipmentCellType, boolean>>({
        weapon: false,
        helm: false,
        body: false,
        arm: false,
        waist: false,
        leg: false,
        charm: false,
    });
    const [autoModeView, setAutoModeViewState] = useState<'requirements' | 'results' | 'summary'>('requirements');
    const [isSearchConfirmOpen, setIsSearchConfirmOpen] = useState(false);

    const handleEqSlotClick = (type: EquipmentCellType) => {
        if (selectionContext?.type === 'equipment' && selectionContext.equipmentType === type) {
            setSelectionContext(null);
        } else {
            setSelectionContext({ type: 'equipment', equipmentType: type });
        }
    };

    const handleEqSelect = (item: Armor | Weapon | Charm) => {
        if (!selectionContext || selectionContext.type !== 'equipment') return;

        const newSlottedEq = { equipment: item, accessories: Array(item.slots.length).fill(null) };

        setCurrentEquipmentSet(prev => ({
            ...prev,
            [selectionContext.equipmentType]: newSlottedEq,
        }));
        setSelectionContext(null);
    };

    const handleSlotClick = (slotType: EquipmentCellType, slotIndex: number, slot: Slot) => {
        setSelectionContext({ type: 'accessory', slotType, slotIndex, slot });
    };

    const handleAccessorySelect = (accessory: Accessory) => {
        if (!selectionContext || selectionContext.type !== 'accessory') return;

        const { slotType, slotIndex } = selectionContext;

        setCurrentEquipmentSet(prev => {
            const newSet = { ...prev };
            const targetSlot = newSet[slotType as keyof EquipmentSet];
            if (targetSlot) {
                const newAccessories = [...targetSlot.accessories];
                newAccessories[slotIndex] = accessory;
                return { ...newSet, [slotType]: { ...targetSlot, accessories: newAccessories } };
            }
            return newSet;
        });

        setSelectionContext(null);
    };

    const addRequiredSkill = (skill: SkillWithLevel) => {
        setRequiredSkills(prev => {
            const existing = prev.find(s => s.skillId === skill.skillId);
            if (existing) {
                return prev.map(s => s.skillId === skill.skillId ? { ...s, level: skill.level } : s);
            }
            return [...prev, skill];
        });
    };

    const updateRequiredSkillLevel = (skillId: string, newLevel: number) => {
        if (newLevel <= 0) {
            setRequiredSkills(prev => prev.filter(s => s.skillId !== skillId));
        } else {
            setRequiredSkills(prev =>
                prev.map(s => (s.skillId === skillId ? { ...s, level: newLevel } : s)),
            );
        }
    };

    const startSearch = () => {
        const hasUnlockedItems = Object.entries(currentEquipmentSet).some(([type, eq]) => eq && !lockedSlots[type as EquipmentCellType]);
        const hasAccessories = Object.values(currentEquipmentSet).some(eq => eq && eq.accessories.some((acc: Accessory | null) => acc !== null));

        if (hasUnlockedItems || hasAccessories) {
            setIsSearchConfirmOpen(true);
        } else {
            confirmSearch();
        }
    };

    const cancelSearch = () => {
        setIsSearchConfirmOpen(false);
    };

    const confirmSearch = useCallback(async (): Promise<void> => {
        setIsSearchConfirmOpen(false);

        const cleanedEquipmentSet: EquipmentSet = {};

        // Process each slot type explicitly to ensure type safety
        const processEq = (type: EquipmentCellType) => {
            if (lockedSlots[type] && currentEquipmentSet[type]) {
                const slottedEq = currentEquipmentSet[type]!;
                const newSlottedEq = {
                    equipment: slottedEq.equipment,
                    accessories: Array(slottedEq.equipment.slots.length).fill(null),
                };
                return newSlottedEq;
            }
            return undefined;
        };

        cleanedEquipmentSet.weapon = processEq('weapon') as { equipment: Weapon; accessories: (Accessory | null)[] } | undefined;
        cleanedEquipmentSet.helm = processEq('helm') as { equipment: Armor; accessories: (Accessory | null)[] } | undefined;
        cleanedEquipmentSet.body = processEq('body') as { equipment: Armor; accessories: (Accessory | null)[] } | undefined;
        cleanedEquipmentSet.arm = processEq('arm') as { equipment: Armor; accessories: (Accessory | null)[] } | undefined;
        cleanedEquipmentSet.waist = processEq('waist') as { equipment: Armor; accessories: (Accessory | null)[] } | undefined;
        cleanedEquipmentSet.leg = processEq('leg') as { equipment: Armor; accessories: (Accessory | null)[] } | undefined;
        cleanedEquipmentSet.charm = processEq('charm') as { equipment: Charm; accessories: (Accessory | null)[] } | undefined;

        if (!cleanedEquipmentSet.weapon) {
            const defaultWeapon = weapons.find(w => w.id === 'Rod_075');
            if (!defaultWeapon) {
                console.error('默认武器 "Rod_075" 未在数据库中找到。请检查数据完整性。');
                return;
            }
            cleanedEquipmentSet.weapon = {
                equipment: defaultWeapon,
                accessories: Array(defaultWeapon.slots.length).fill(null),
            };
        }

        setCurrentEquipmentSet(cleanedEquipmentSet);

        console.log('Starting search with fixed equipment:', cleanedEquipmentSet);
        setIsSearching(true);
        setAutoModeView('results');

        try {
            const results = await findOptimalSets(
                requiredSkills,
                cleanedEquipmentSet,
                { armors: armor, weapons, accessories, skills, charms },
            );
            console.log('Search completed with results:', results);
            setSearchResults(results);
        } catch (error) {
            console.error("An error occurred during search:", error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, [requiredSkills, currentEquipmentSet, armor, weapons, accessories, skills, charms, lockedSlots]);

    const loadSetToBuilder = (finalSet: FinalSet) => {
        console.log('[Debug] loadSetToBuilder received finalSet:', JSON.stringify(finalSet, null, 2));

        const newEquipmentSet = cloneDeep(finalSet.equipment);

        for (const key in newEquipmentSet) {
            const equipmentKey = key as keyof EquipmentSet;
            const slottedEquipment = newEquipmentSet[equipmentKey];

            if (slottedEquipment) {
                const equipmentId = slottedEquipment.equipment.id;
                const decorationsForEquipment = finalSet.accessories.get(equipmentId) || [];

                // 新增Log，用于验证decorationsForEquipment是否能取到值
                if (decorationsForEquipment.length > 0) {
                    console.log(`[Debug] Found ${decorationsForEquipment.length} decorations for equipment ${equipmentId}`);
                }

                const newAccessories = Array(slottedEquipment.equipment.slots.length).fill(null);
                decorationsForEquipment.forEach((acc, index) => {
                    if (index < newAccessories.length) {
                        newAccessories[index] = acc;
                    }
                });

                slottedEquipment.accessories = newAccessories;
            }
        }

        console.log('[Debug] Processed newEquipmentSet for UI:', JSON.stringify(newEquipmentSet, null, 2));
        setCurrentEquipmentSet(newEquipmentSet);

        // 加载套装后锁定所有装备槽
        const allLocked: Record<EquipmentCellType, boolean> = {
            weapon: true,
            helm: true,
            body: true,
            arm: true,
            waist: true,
            leg: true,
            charm: true,
        };
        setLockedSlots(allLocked);

        setAutoModeView('summary');
    };

    const toggleSlotLock = (type: EquipmentCellType) => {
        setLockedSlots(prev => ({
            ...prev,
            [type]: !prev[type]
        }));
    };

    const setAutoModeView = (view: 'requirements' | 'results' | 'summary') => {
        setAutoModeViewState(view);
    };

    const clearEquipmentSlot = (type: EquipmentCellType) => {
        setCurrentEquipmentSet(prev => {
            const newSet = { ...prev };
            // 如果该槽位未被锁定，则删除它
            if (!lockedSlots[type]) {
                delete newSet[type];
            }
            return newSet;
        });
    };

    const resetBuilder = () => {
        setRequiredSkills([]);
        setSearchResults([]);

        // 只重置未锁定的装备槽
        setCurrentEquipmentSet(prev => {
            const newSet = { ...prev };
            Object.keys(newSet).forEach(key => {
                const equipmentType = key as EquipmentCellType;
                if (!lockedSlots[equipmentType]) {
                    delete newSet[equipmentType];
                }
            });
            return newSet;
        });
    };

    const value = {
        mode,
        requiredSkills,
        searchResults,
        isSearching,
        currentEquipmentSet,
        selectionContext,
        isResultsModalOpen,
        lockedSlots,
        autoModeView,
        isSearchConfirmOpen,
        setMode,
        addRequiredSkill,
        updateRequiredSkillLevel,
        startSearch,
        confirmSearch,
        cancelSearch,
        loadSetToBuilder,
        handleEqSlotClick,
        handleEqSelect,
        handleSlotClick,
        handleAccessorySelect,
        setIsResultsModalOpen,
        toggleSlotLock,
        setAutoModeView,
        resetBuilder,
        clearEquipmentSlot,
    };

    return (
        <SetBuilderContext.Provider value={value}>
            {children}
        </SetBuilderContext.Provider>
    );
};

export const useSetBuilder = () => {
    const context = useContext(SetBuilderContext);
    if (context === undefined) {
        throw new Error('useSetBuilder must be used within a SetBuilderProvider');
    }
    return context;
};