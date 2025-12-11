import { X } from "lucide-react";

import { SkillSelector } from "@/components/skills";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

import type {
  Skill,
  SkillWithLevel,
  Slot,
  SlotType,
  SlotLevel,
  EquivalentSlots,
} from "@/types";

interface CharmFormProps {
  isEditMode: boolean;
  rarity: number;
  setRarity: (value: number) => void;
  selectedSkills: SkillWithLevel[];
  allSkills: Skill[];
  slots: Slot[];
  handleAddSkill: (skill: SkillWithLevel) => void;
  handleRemoveSkill: (skillId: string) => void;
  handleAddSlot: () => void;
  handleUpdateSlot: (index: number, type: SlotType, level: SlotLevel) => void;
  handleRemoveSlot: (index: number) => void;
  handleSubmit: () => void;
  onCancel?: () => void;
  keySkillValue: number;
  equivalentSlots: EquivalentSlots;
}

/**
 * 护石表单组件（展示型）
 *
 * 接收所有状态和处理器作为 props，只负责渲染 UI。
 */
export function CharmForm({
  isEditMode,
  rarity,
  setRarity,
  selectedSkills,
  allSkills,
  slots,
  handleAddSkill,
  handleRemoveSkill,
  handleAddSlot,
  handleUpdateSlot,
  handleRemoveSlot,
  handleSubmit,
  onCancel,
  keySkillValue,
  equivalentSlots,
}: CharmFormProps) {
  return (
    <div className="space-y-8">
      {/* 稀有度选择 */}
      <div className="flex items-center gap-2">
        <Label className="w-16 shrink-0 text-base font-medium">稀有度</Label>
        <Badge
          variant="outline"
          className="mr-4 w-12 justify-center text-sm font-medium"
          style={{
            color: rarity === 12 ? "black" : `var(--rarity-${rarity})`,
            borderColor:
              rarity === 12 ? "var(--border)" : `var(--rarity-${rarity})`,
            background:
              rarity === 12 ? `var(--rarity-${rarity})` : "transparent",
          }}
        >
          R{rarity}
        </Badge>
        <div className="min-w-0 flex-1">
          <Slider
            value={[rarity]}
            onValueChange={(values) => setRarity(values[0])}
            min={1}
            max={12}
            step={1}
          />
        </div>
      </div>

      {/* 技能和孔位并排布局 */}
      <div className="grid grid-cols-[60%_40%] gap-6">
        {/* 技能选择 */}
        <div className="flex flex-col gap-3">
          <Label className="space-y-3 text-base font-medium">
            技能 ({selectedSkills.length}/3)
          </Label>

          {selectedSkills.slice(0, 3).map((skillWithLevel) => {
            const skill = allSkills.find(
              (s) => s.id === skillWithLevel.skillId,
            );
            if (!skill)
              return (
                <div
                  key={`empty-skill-${skillWithLevel.skillId}`}
                  className="h-10"
                ></div>
              );

            return (
              <div
                key={skillWithLevel.skillId}
                className="bg-muted flex h-10 items-center gap-2 rounded-md p-2"
              >
                <span className="flex-1">
                  {skill.name} Lv.{skillWithLevel.level}
                  {skill.isKey && " ⭐"}
                </span>
                <Badge variant="outline">
                  {skill.category === "weapon"
                    ? "武器"
                    : skill.category === "armor"
                      ? "防具"
                      : "特殊"}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveSkill(skillWithLevel.skillId)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
          {/* 填充空槽位 */}
          {[...Array(Math.max(0, 3 - selectedSkills.length))].map(
            (_, index) => (
              <div
                key={`empty-skill-${selectedSkills.length + index}`}
                className="bg-muted h-10 rounded-md"
              ></div>
            ),
          )}

          {/* 技能选择器 */}
          <SkillSelector
            onSelect={handleAddSkill}
            excludeSkillIds={selectedSkills.map((s) => s.skillId)}
          />
        </div>

        {/* 孔位选择 */}
        <div className="flex flex-col gap-3">
          <Label className="space-y-3 text-base font-medium">
            孔位 ({slots.length}/3)
          </Label>

          {slots.slice(0, 3).map((slot, index) => (
            <div
              key={index}
              className="bg-muted flex h-10 items-center gap-2 rounded-md p-2"
            >
              <Select
                value={slot.type}
                onValueChange={(v) =>
                  handleUpdateSlot(index, v as SlotType, slot.level)
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weapon">武器孔</SelectItem>
                  <SelectItem value="armor">防具孔</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={slot.level.toString()}
                onValueChange={(v) =>
                  handleUpdateSlot(index, slot.type, parseInt(v) as SlotLevel)
                }
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1级</SelectItem>
                  <SelectItem value="2">2级</SelectItem>
                  <SelectItem value="3">3级</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveSlot(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {/* 填充空槽位 */}
          {[...Array(Math.max(0, 3 - slots.length))].map((_, index) => (
            <div
              key={`empty-slot-${slots.length + index}`}
              className="bg-muted h-10 rounded-md"
            ></div>
          ))}

          {/* 添加孔位按钮 */}
          <Button variant="outline" onClick={handleAddSlot} className="w-full">
            添加孔位
          </Button>
        </div>
      </div>

      {/* 护石价值评估 */}
      <div className="bg-muted flex items-center justify-between gap-4 rounded-lg p-4">
        <div className="font-medium">
          核心技能价值: <span className="text-primary">{keySkillValue}</span>
        </div>
        <div className="flex gap-2 text-sm md:gap-4">
          <div className="flex items-center gap-1">
            <img
              src="/weapon.png"
              alt="WeaponSlot"
              style={{ width: "1.5rem", height: "1.5rem" }}
            />
            {equivalentSlots.weaponSlot3}/{equivalentSlots.weaponSlot2}/
            {equivalentSlots.weaponSlot1}
          </div>
          <div className="flex items-center gap-1">
            <img
              src="/armor.png"
              alt="ArmorSlot"
              style={{ width: "1.5rem", height: "1.5rem" }}
            />
            {equivalentSlots.armorSlot3}/{equivalentSlots.armorSlot2}/
            {equivalentSlots.armorSlot1}
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-end gap-3 border-t pt-4">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            取消
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={selectedSkills.length === 0}>
          {isEditMode ? "更新护石" : "添加护石"}
        </Button>
      </div>
    </div>
  );
}
