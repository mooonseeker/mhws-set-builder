/**
 * @fileoverview EquipmentCell component for displaying an equipment slot in the set builder.
 */

import { useState } from "react";

import { Lock, Unlock, X } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSettings } from "@/hooks";
import { cn } from "@/lib/utils";
import type { Armor, Charm, Slot, Weapon, WeaponType } from "@/types";
import type { EquipmentCellType, SlottedEquipment } from "@/types/set-builder";
import { getAssetPath } from "@/utils";

import { EquipmentCard } from "./EquipmentCard";

/** Props for the EquipmentCell component. */
export interface EquipmentCellProps {
  type: EquipmentCellType;
  isSelected?: boolean;
  slottedEquipment?: SlottedEquipment<Weapon | Armor | Charm>;
  onEquipmentClick: () => void;
  onSlotClick: (slotIndex: number, slot: Slot) => void;
  isLocked?: boolean;
  onToggleLock?: () => void;
  onClear?: () => void;
}

const typeToLabel: Record<EquipmentCellType, string> = {
  weapon: "武器",
  helm: "头盔",
  body: "胸甲",
  arm: "臂甲",
  waist: "腰甲",
  leg: "腿甲",
  charm: "护石",
};

const getIconPath = (
  type: EquipmentCellType,
  defaultWeaponType: WeaponType,
  equipment?: Weapon | Armor | Charm,
): string => {
  if (type === "weapon") {
    if (equipment && "type" in equipment) {
      return getAssetPath(`/weapon-type/${(equipment as Weapon).type}.png`);
    }
    return getAssetPath(`/weapon-type/${defaultWeaponType}.png`);
  }
  if (type === "charm") return getAssetPath("/charm.png");
  return getAssetPath(`/armor-type/${type}.png`);
};

const getAccessoryIcon = (slotType: "weapon" | "armor", level: number) => {
  const validLevel = Math.min(level, 3);
  return getAssetPath(`/slot/${slotType}-slot-${validLevel}.png`);
};

/**
 * Represents a single equipment slot (e.g., Head, Chest) in the set builder UI.
 * Allows selecting equipment, locking the slot, and managing accessories.
 */
export function EquipmentCell({
  type,
  isSelected,
  slottedEquipment,
  onEquipmentClick,
  onSlotClick,
  isLocked = false,
  onToggleLock,
  onClear,
}: EquipmentCellProps) {
  const { settings } = useSettings();
  const label = typeToLabel[type];
  const { equipment, accessories } = slottedEquipment ?? {};
  const iconPath = getIconPath(type, settings.defaultWeaponType, equipment);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleToggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleLock?.();
  };

  return (
    <Card
      className={cn(
        "relative h-full w-full", // Fill parent container, add relative positioning
        isSelected &&
          "ring-primary ring-offset-background ring-2 ring-offset-2",
      )}
    >
      {/* Clear button - located at the top right of the card */}
      {onClear && slottedEquipment && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="bg-background border-border hover:bg-destructive hover:text-destructive-foreground absolute -top-2 -right-2 z-20 rounded-full border p-1 shadow-sm transition-colors"
          aria-label="清除装备"
        >
          <X className="h-3 w-3" />
        </button>
      )}
      <CardContent
        className="flex h-full w-full items-stretch gap-2 p-2"
        onClick={onEquipmentClick}
      >
        {/* Left icon area */}
        <div className="relative flex aspect-square w-12 shrink-0 items-center justify-center self-center p-1">
          {/* Lock icon - moved to the top right of the left icon */}
          {onToggleLock && (
            <button
              onClick={handleToggleLock}
              className="bg-background/80 hover:bg-background absolute -top-1 -right-1 z-10 rounded-md p-0.5 transition-colors"
              aria-label={isLocked ? "解锁" : "锁定"}
            >
              {isLocked ? (
                <Lock className="text-destructive h-6 w-6" />
              ) : (
                <Unlock className="text-muted-foreground h-4 w-4" />
              )}
            </button>
          )}
          {equipment ? (
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <div
                  onMouseEnter={() => setIsPopoverOpen(true)}
                  onMouseLeave={() => setIsPopoverOpen(false)}
                >
                  <img
                    src={iconPath}
                    alt={label}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent
                onMouseEnter={() => setIsPopoverOpen(true)}
                onMouseLeave={() => setIsPopoverOpen(false)}
                className="w-80"
                align="start"
                sideOffset={5}
              >
                <EquipmentCard item={equipment} variant="full" />
              </PopoverContent>
            </Popover>
          ) : (
            <img
              src={iconPath}
              alt={label}
              className="max-h-full max-w-full object-contain"
            />
          )}
        </div>
        <div className="border-border/50 border-l" />

        {/* Right content area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top part: Label + Name */}
          <div className="flex flex-1 items-center gap-2">
            <div className="flex flex-1 items-center justify-center">
              <p className="text-muted-foreground text-sm">{label}</p>
            </div>
            <div className="border-border/20 my-1 self-stretch border-l" />
            <div className="flex flex-5 items-center px-2">
              <h3
                className={cn(
                  "truncate text-sm",
                  equipment && equipment.rarity <= 2
                    ? "font-normal"
                    : "font-semibold",
                )}
                style={{
                  color:
                    equipment && equipment.rarity >= 3 && equipment.rarity <= 11
                      ? `var(--rarity-${equipment.rarity})`
                      : undefined,
                }}
              >
                {equipment ? equipment.name : "点击选择..."}
              </h3>
            </div>
          </div>

          <div className="border-border/50 border-t" />

          {/* Bottom part: Slots */}
          <div className="flex flex-1 items-center justify-around gap-1 p-1">
            {Array.from({ length: 3 }).map((_, index) => {
              const slot = equipment?.slots[index];
              const accessory = accessories?.[index];
              const canClick = !!slot;

              return (
                <div
                  key={index}
                  onClick={(e) => {
                    if (!canClick) return;
                    e.stopPropagation(); // Prevent bubbling to CardContent's onEquipmentClick
                    onSlotClick(index, slot);
                  }}
                  className={`bg-muted/30 flex h-full flex-1 items-center gap-1 rounded-sm ${canClick ? "hover:bg-muted cursor-pointer" : ""}`}
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                    {slot && (
                      <img
                        src={getAccessoryIcon(slot.type, slot.level)}
                        alt={`孔位 ${slot.level}`}
                        className="max-h-full max-w-full object-contain"
                      />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 items-center justify-center">
                    <span className="truncate text-xs">
                      {slot ? (accessory ? accessory.name : "————") : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
