import { CharmList } from '@/components/charms';
import { AccessoryList, ArmorList, WeaponList } from '@/components/database';

import type { Armor, Charm, Weapon, Accessory, Slot } from '@/types';
import type { EquipmentCellType } from '@/types/set-builder';

export interface EquipmentSelectorProps {
    selectingFor: EquipmentCellType;
    currentEquipment?: Armor | Weapon | Charm | null;
    onSelect: (item: Armor | Weapon | Charm) => void;
}

interface AccessorySelectorProps {
    slot: Slot;
    onAccessorySelect: (accessory: Accessory) => void;
}

export function EquipmentSelector({ selectingFor, currentEquipment, onSelect }: EquipmentSelectorProps) {
    const getInitialTab = () => {
        if (['helm', 'body', 'arm', 'waist', 'leg'].includes(selectingFor)) {
            return 'armor';
        } else if (selectingFor === 'weapon') {
            return 'weapon';
        } else if (selectingFor === 'charm') {
            return 'charm';
        }
        return 'armor';
    };

    const currentTab = getInitialTab();

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto">
                {currentTab === 'armor' && (
                    <ArmorList
                        mode="selector"
                        onPieceSelect={onSelect}
                        selectingFor={selectingFor}
                        currentPiece={currentEquipment as Armor}
                    />
                )}
                {currentTab === 'weapon' && (
                    <WeaponList
                        mode="selector"
                        onWeaponSelect={onSelect}
                        selectingFor={selectingFor}
                        currentWeapon={currentEquipment as Weapon}
                    />
                )}
                {currentTab === 'charm' && (
                    <CharmList
                        mode="selector"
                        onCharmSelect={onSelect}
                        selectingFor={selectingFor}
                        currentCharm={currentEquipment as Charm}
                    />
                )}
            </div>
        </div>
    );
}

export function AccessorySelector({ slot, onAccessorySelect }: AccessorySelectorProps) {
    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto">
                <AccessoryList
                    mode="selector"
                    onAccessorySelect={onAccessorySelect}
                    filterBySlotLevel={slot.level}
                    filterBySlotType={slot.type}
                />
            </div>
        </div>
    );
}