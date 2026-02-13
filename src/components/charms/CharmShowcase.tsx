/**
 * @fileoverview A component to showcase the best charms based on different metrics.
 */

import { EquipmentCard } from "@/components/entities";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCharms } from "@/hooks";
import type { CharmEnhanced } from "@/types";
import { sortCharms } from "@/utils";

/**
 * Displays the best charms from the user's collection based on various metrics,
 * such as highest key skill value or most equivalent slots.
 */
export function CharmShowcase() {
  const { enhancedCharms } = useCharms();

  // Calculate the best charms for different categories.
  const bestKeySkillCharm: CharmEnhanced | undefined =
    enhancedCharms.length > 0
      ? sortCharms(enhancedCharms, "keySkillValue", "desc")[0]
      : undefined;
  const bestWeaponSlot1Charm: CharmEnhanced | undefined =
    enhancedCharms.length > 0
      ? sortCharms(enhancedCharms, "weaponSlot1", "desc")[0]
      : undefined;
  const bestArmorSlot3Charm: CharmEnhanced | undefined =
    enhancedCharms.length > 0
      ? sortCharms(enhancedCharms, "armorSlot3", "desc")[0]
      : undefined;
  const bestArmorSlot2Charm: CharmEnhanced | undefined =
    enhancedCharms.length > 0
      ? sortCharms(enhancedCharms, "armorSlot2", "desc")[0]
      : undefined;
  const bestArmorSlot1Charm: CharmEnhanced | undefined =
    enhancedCharms.length > 0
      ? sortCharms(enhancedCharms, "armorSlot1", "desc")[0]
      : undefined;

  return (
    <Card className="md:col-span-5">
      <CardHeader>
        <CardTitle>护石陈列柜</CardTitle>
        <CardDescription>展示在不同维度上的最佳护石</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-3 grid grid-cols-3 gap-6">
            {bestKeySkillCharm && (
              <div>
                <h4 className="mb-3 text-center text-sm font-medium">
                  核心技能价值最高
                </h4>
                <EquipmentCard item={bestKeySkillCharm} />
              </div>
            )}
            {bestWeaponSlot1Charm && (
              <div>
                <h4 className="mb-3 text-center text-sm font-medium">
                  等效武器一级孔最多
                </h4>
                <EquipmentCard item={bestWeaponSlot1Charm} />
              </div>
            )}
            {bestArmorSlot3Charm && (
              <div>
                <h4 className="mb-3 text-center text-sm font-medium">
                  等效防具三级孔最多
                </h4>
                <EquipmentCard item={bestArmorSlot3Charm} />
              </div>
            )}
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-6">
            {bestArmorSlot2Charm && (
              <div>
                <h4 className="mb-3 text-center text-sm font-medium">
                  等效防具二级孔最多
                </h4>
                <h4 className="mb-3 text-center text-sm font-medium">
                  核心技能价值最高
                </h4>
                <EquipmentCard item={bestArmorSlot2Charm} />
              </div>
            )}
            {bestArmorSlot1Charm && (
              <div>
                <h4 className="mb-3 text-center text-sm font-medium">
                  等效防具一级孔最多
                </h4>
                <EquipmentCard item={bestArmorSlot1Charm} />
              </div>
            )}
          </div>
        </div>
        {enhancedCharms.length === 0 && (
          <p className="text-muted-foreground py-8 text-center">
            暂无护石数据，请先添加护石
          </p>
        )}
      </CardContent>
    </Card>
  );
}
