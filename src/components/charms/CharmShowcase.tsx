import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCharms } from "@/contexts";
import { sortCharms } from "@/utils";

import { EquipmentCard } from "../equipments/EquipmentCard";

import type { Charm } from "@/types";
/**
 * CharmShowcase 组件
 *
 * 展示在不同维度上的最佳护石
 */
export function CharmShowcase() {
  const { charms } = useCharms();

  // 计算最佳护石
  const bestKeySkillCharm: Charm | undefined =
    charms.length > 0
      ? sortCharms(charms, "keySkillValue", "desc")[0]
      : undefined;
  const bestWeaponSlot1Charm: Charm | undefined =
    charms.length > 0
      ? sortCharms(charms, "weaponSlot1", "desc")[0]
      : undefined;
  const bestArmorSlot3Charm: Charm | undefined =
    charms.length > 0 ? sortCharms(charms, "armorSlot3", "desc")[0] : undefined;
  const bestArmorSlot2Charm: Charm | undefined =
    charms.length > 0 ? sortCharms(charms, "armorSlot2", "desc")[0] : undefined;
  const bestArmorSlot1Charm: Charm | undefined =
    charms.length > 0 ? sortCharms(charms, "armorSlot1", "desc")[0] : undefined;

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
        {charms.length === 0 && (
          <p className="text-muted-foreground py-8 text-center">
            暂无护石数据，请先添加护石
          </p>
        )}
      </CardContent>
    </Card>
  );
}
