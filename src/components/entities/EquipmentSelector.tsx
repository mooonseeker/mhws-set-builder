/**
 * @fileoverview Selectors for choosing equipment (armor, weapons, charms) and accessories.
 */

import { CharmList } from "@/components/charms";
import { AccessoryList, ArmorList, WeaponList } from "@/components/database";
import type { Accessory, Armor, Charm, Slot, Weapon } from "@/types";
import type { EquipmentCellType } from "@/types/set-builder";

/** Props for the EquipmentSelector component. */
export interface EquipmentSelectorProps {
  selectingFor: EquipmentCellType;
  currentEquipment?: Armor | Weapon | Charm | null;
  onSelect: (item: Armor | Weapon | Charm) => void;
}

/** Props for the AccessorySelector component. */
interface AccessorySelectorProps {
  slot: Slot;
  onAccessorySelect: (accessory: Accessory) => void;
}

/**
 * Component for selecting equipment based on the slot type.
 * Automatically filters the list (Armor, Weapon, or Charm) according to `selectingFor`.
 */
export function EquipmentSelector({
  selectingFor,
  currentEquipment,
  onSelect,
}: EquipmentSelectorProps) {
  const getInitialTab = () => {
    if (["helm", "body", "arm", "waist", "leg"].includes(selectingFor)) {
      return "armor";
    } else if (selectingFor === "weapon") {
      return "weapon";
    } else if (selectingFor === "charm") {
      return "charm";
    }
    return "armor";
  };

  const currentTab = getInitialTab();

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        {currentTab === "armor" && (
          <ArmorList
            mode="selector"
            onPieceSelect={onSelect}
            selectingFor={selectingFor}
            currentPiece={currentEquipment as Armor}
          />
        )}
        {currentTab === "weapon" && (
          <WeaponList
            mode="selector"
            onWeaponSelect={onSelect}
            selectingFor={selectingFor}
            currentWeapon={currentEquipment as Weapon}
          />
        )}
        {currentTab === "charm" && (
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

/**
 * Component for selecting accessories for a specific slot.
 * Filters accessories by slot level and type.
 */
export function AccessorySelector({
  slot,
  onAccessorySelect,
}: AccessorySelectorProps) {
  return (
    <div className="flex h-full flex-col">
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
