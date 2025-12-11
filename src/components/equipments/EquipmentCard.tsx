import { SkillItem } from "@/components/skills";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { Equipment, Charm, Armor, Weapon } from "@/types";

/**
 * EquipmentCard 组件 Props 接口
 */
export interface EquipmentCardProps {
  item: Equipment;
  className?: string;
  variant?: "full" | "default" | "compact";
  isSelected?: boolean;
}

/**
 * EquipmentCard 组件
 *
 * 显示单个装备的卡片视图，包含图标、稀有度徽章、孔位和技能列表
 */
export function EquipmentCard({
  item,
  className,
  variant = "full",
  isSelected,
}: EquipmentCardProps) {
  // 获取装饰品图标路径
  const getAccessoryIcon = (slotType: "weapon" | "armor", level: number) => {
    return `/slot/${slotType}-slot-${level}.png`;
  };

  const ARMOR_RESISTANCE_META = [
    { key: "fire", icon: "/attribute-type/fire.png", alt: "Fire Res" },
    { key: "water", icon: "/attribute-type/water.png", alt: "Water Res" },
    { key: "elec", icon: "/attribute-type/elec.png", alt: "Elec Res" },
    { key: "ice", icon: "/attribute-type/ice.png", alt: "Ice Res" },
    { key: "dragon", icon: "/attribute-type/dragon.png", alt: "Dragon Res" },
  ];

  // 辅助函数：判断装备类型
  const isCharm = (item: Equipment): item is Charm => !("name" in item);
  const isWeapon = (item: Equipment): item is Weapon => "attack" in item;
  const isArmor = (item: Equipment): item is Armor => "resistance" in item;

  // 获取装备图标路径
  const getEquipmentIcon = (item: Equipment) => {
    if (isCharm(item)) {
      return "/charm.png";
    }
    if (isArmor(item)) {
      return `/armor-type/${item.type}.png`;
    }
    if (isWeapon(item)) {
      return `/weapon-type/${item.type}.png`;
    }
    return "/set.png"; // Fallback icon
  };

  return (
    <div
      className={cn(
        "charm-card bg-card rounded-lg border p-4 shadow-sm transition-all",
        {
          "ring-primary ring-offset-background ring-2 ring-offset-2":
            isSelected,
        },
        className,
      )}
      style={{
        borderColor:
          item.rarity === 12 ? "black" : `var(--rarity-${item.rarity})`,
        borderWidth: item.rarity === 12 ? "2px" : "1px",
      }}
    >
      {/* Header: 装备图标和稀有度徽章 */}
      <div className="card-header mb-3 flex items-center justify-between">
        <img
          src={getEquipmentIcon(item)}
          alt="Equipment Icon"
          className="equipment-icon h-6 w-6"
        />
        {!isCharm(item) && (
          <h3 className="flex-1 text-center text-xs font-semibold">
            {item.name}
          </h3>
        )}
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

      {/* Stats: 核心属性 */}
      {variant !== "compact" && (
        <>
          {isWeapon(item) && (
            <div className="card-stats mb-3 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-center gap-1">
                <img
                  src="/skill-type/SKILL_0000.png"
                  alt="Attack"
                  className="h-4 w-4"
                />
                <span>{item.attack}</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <img
                  src="/skill-type/SKILL_0001.png"
                  alt="Critical"
                  className="h-4 w-4"
                />
                <span>{item.critical}%</span>
              </div>
            </div>
          )}
          {isArmor(item) && (
            <div className="card-stats mb-3 grid min-w-0 grid-cols-3 text-xs lg:grid-cols-6">
              {[
                {
                  key: "defense",
                  icon: "/skill-type/SKILL_0005.png",
                  alt: "Defense",
                  value: item.defense,
                  minWidthClass: "min-w-[1.5rem]",
                },
                ...ARMOR_RESISTANCE_META.map((meta, index) => ({
                  ...meta,
                  value: item.resistance[index],
                  minWidthClass: "min-w-[1rem]",
                })),
              ].map((stat) => (
                <div
                  key={stat.key}
                  className={cn(
                    "flex flex-col items-center justify-center p-0.5",
                    stat.minWidthClass,
                  )}
                >
                  <img src={stat.icon} alt={stat.alt} className="h-4 w-4" />
                  <span className="text-center">{stat.value}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Slots: 孔位图标 */}
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

      {/* Skills: 技能列表 (根据 variant 传递) */}
      <div className="card-skills space-y-1">
        <ul className="space-y-1">
          {item.skills.map((skillWithLevel) => (
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
