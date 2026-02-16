/**
 * @fileoverview EquipmentCard component for displaying detailed equipment information.
 */

import { useMemo } from "react";

import { SkillItem } from "@/components/entities/";
import { Badge } from "@/components/ui/badge";
import { useSkills } from "@/hooks";
import { cn } from "@/lib/utils";
import type { Armor, Charm, Equipment, Weapon } from "@/types";
import { compareSkillsPriority, getAssetPath } from "@/utils";

/** Props for the EquipmentCard component. */
export interface EquipmentCardProps {
  item: Equipment;
  className?: string;
  variant?: "full" | "default" | "compact";
  isSelected?: boolean;
}

/**
 * Displays a card view of a single piece of equipment, including icon,
 * rarity badge, slots, and skill list.
 */
export function EquipmentCard({
  item,
  className,
  variant = "full",
  isSelected,
}: EquipmentCardProps) {
  // Get accessory icon path
  const getAccessoryIcon = (slotType: "weapon" | "armor", level: number) => {
    return getAssetPath(`/slot/${slotType}-slot-${level}.png`);
  };

  const ARMOR_RESISTANCE_META = [
    {
      key: "fire",
      icon: getAssetPath("/equipment-status/resistance_fire.png"),
      alt: "Fire Res",
    },
    {
      key: "water",
      icon: getAssetPath("/equipment-status/resistance_water.png"),
      alt: "Water Res",
    },
    {
      key: "elec",
      icon: getAssetPath("/equipment-status/resistance_elec.png"),
      alt: "Elec Res",
    },
    {
      key: "ice",
      icon: getAssetPath("/equipment-status/resistance_ice.png"),
      alt: "Ice Res",
    },
    {
      key: "dragon",
      icon: getAssetPath("/equipment-status/resistance_dragon.png"),
      alt: "Dragon Res",
    },
  ];

  // Helper functions to determine equipment type
  const isCharm = (item: Equipment): item is Charm => "equivalentSlots" in item;
  const isWeapon = (item: Equipment): item is Weapon => "attack" in item;
  const isArmor = (item: Equipment): item is Armor => "resistance" in item;

  // Get equipment icon path
  const getEquipmentIcon = (item: Equipment) => {
    if (isCharm(item)) {
      return getAssetPath("/charm.png");
    }
    if (isArmor(item)) {
      return getAssetPath(`/armor-type/${item.type}.png`);
    }
    if (isWeapon(item)) {
      return getAssetPath(`/weapon-type/${item.type}.png`);
    }
    return getAssetPath("/set.png"); // Fallback icon
  };

  const { getSkillById } = useSkills();

  const sortedSkills = useMemo(() => {
    return item.skills
      .map((skill) => ({
        ...skill,
        skillData: getSkillById(skill.skillId),
      }))
      .sort(compareSkillsPriority);
  }, [item.skills, getSkillById]);

  return (
    <div
      className={cn(
        "charm-card bg-card rounded-lg border p-4 shadow-sm transition-all",
        {
          "ring-primary ring-offset-background ring-2 ring-offset-2":
            isSelected,
          "border-rarity-12": item.rarity === 12,
        },
        className,
      )}
      style={{
        borderColor:
          item.rarity === 12 ? undefined : `var(--rarity-${item.rarity})`,
        borderWidth: "1px",
      }}
    >
      {/* Header: Equipment icon and rarity badge */}
      <div className="card-header mb-3 flex items-center justify-between">
        <img
          src={getEquipmentIcon(item)}
          alt="Equipment Icon"
          className="equipment-icon h-6 w-6"
        />
        <h3
          className={cn(
            "flex-1 text-center text-xs",
            item.rarity <= 2 ? "font-normal" : "font-semibold",
          )}
          style={{
            color:
              item.rarity >= 3 && item.rarity <= 11
                ? `var(--rarity-${item.rarity})`
                : undefined,
          }}
        >
          {item.name}
        </h3>
        {isCharm(item) && variant !== "compact" && (
          <Badge
            variant="outline"
            className="text-xs"
            style={{
              color:
                item.rarity === 12 ? "black" : `var(--rarity-${item.rarity})`,
              borderColor:
                item.rarity === 12
                  ? "var(--border)"
                  : `var(--rarity-${item.rarity})`,
              background:
                item.rarity === 12
                  ? `var(--rarity-${item.rarity})`
                  : "transparent",
            }}
          >
            R{item.rarity}
          </Badge>
        )}
      </div>

      {/* Stats: Core attributes */}
      {variant !== "compact" && (
        <>
          {isWeapon(item) && (
            <div className="card-stats mb-3 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-center gap-1">
                <img
                  src={getAssetPath("/equipment-status/attack.png")}
                  alt="Attack"
                  className="h-4 w-4"
                />
                <span>{item.attack}</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <img
                  src={getAssetPath("/equipment-status/critical.png")}
                  alt="Critical"
                  className="h-4 w-4"
                />
                <span>{item.critical}%</span>
              </div>
            </div>
          )}
          {isArmor(item) && (
            <div className="card-stats mb-3 grid grid-cols-3 gap-y-2 text-xs lg:grid-cols-6">
              {[
                {
                  key: "defense",
                  icon: getAssetPath("/equipment-status/defense.png"),
                  alt: "Defense",
                  value: item.defense,
                },
                ...ARMOR_RESISTANCE_META.map((meta, index) => ({
                  ...meta,
                  value: item.resistance[index],
                })),
              ].map((stat) => (
                <div
                  key={stat.key}
                  className="flex flex-col items-center justify-center gap-1 p-0.5"
                >
                  <img src={stat.icon} alt={stat.alt} className="h-4 w-4" />
                  <span className="text-center">{stat.value}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Slots: Slot icons */}
      <div className="card-slots mb-3 flex justify-center gap-2">
        {Array.from({ length: 3 }, (_, index) => {
          const slot = item.slots[index];
          return slot ? (
            <img
              key={index}
              src={getAccessoryIcon(slot.type, slot.level)}
              alt={`${slot.type === "weapon" ? "WeaponSlot" : "ArmorSlot"} ${slot.level}级`}
              className="slot-icon h-6 w-6"
            />
          ) : (
            <span
              key={index}
              className="text-muted-foreground text-sm"
              style={{
                width: "1.5rem",
                height: "1.5rem",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              —
            </span>
          );
        })}
      </div>

      {/* Skills: Skill list (passed based on variant) */}
      <div className="card-skills space-y-1">
        <ul className="space-y-1">
          {sortedSkills.map((skillWithLevel) => (
            <SkillItem
              key={skillWithLevel.skillId}
              skillId={skillWithLevel.skillId}
              level={skillWithLevel.level}
              variant={variant}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
