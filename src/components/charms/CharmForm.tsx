/**
 * @fileoverview A presentational component for the charm form.
 * It receives all state and handlers as props and is only responsible for rendering the UI.
 */

import { X } from "lucide-react";

import { SkillSelector } from "@/components/entities/";
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
import {
  RARITY_MAX,
  RARITY_MIN,
  type EquivalentSlots,
  type Skill,
  type SkillWithLevel,
  type Slot,
  type SlotLevel,
  type SlotType,
} from "@/types";

interface CharmFormProps {
  isEditMode: boolean;
  name?: string;
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
 * A presentational component for the charm form.
 *
 * It receives all state and handlers as props and is only responsible for rendering the UI.
 */
export function CharmForm({
  isEditMode,
  name,
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
      {/* Name display */}
      <div className="flex items-center gap-2">
        <Label className="w-16 shrink-0 text-base font-medium">名称</Label>
        <div className="bg-muted text-muted-foreground flex h-10 flex-1 items-center rounded-md px-3 font-medium">
          {name ?? "未知护石"}
        </div>
      </div>

      {/* Rarity selection */}
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
        <div className="min-w-0 flex-1 pb-8">
          <Slider
            value={[rarity]}
            onValueChange={(values) => setRarity(values[0])}
            min={RARITY_MIN}
            max={RARITY_MAX}
            step={1}
          />
        </div>
      </div>

      {/* Side-by-side layout for skills and slots */}
      <div className="grid grid-cols-[60%_40%] gap-6">
        {/* Skill selection */}
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
                />
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
          {/* Fill empty skill slots */}
          {Array.from(
            { length: Math.max(0, 3 - selectedSkills.length) },
            (_unused, index) => index,
          ).map((index) => (
            <div
              key={`empty-skill-${selectedSkills.length + index}`}
              className="bg-muted h-10 rounded-md"
            />
          ))}

          {/* Skill selector */}
          <SkillSelector
            onSelect={handleAddSkill}
            excludeSkillIds={selectedSkills.map((s) => s.skillId)}
          />
        </div>

        {/* Slot selection */}
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
          {/* Fill empty slot spaces */}
          {Array.from(
            { length: Math.max(0, 3 - slots.length) },
            (_unused, index) => index,
          ).map((index) => (
            <div
              key={`empty-slot-${slots.length + index}`}
              className="bg-muted h-10 rounded-md"
            />
          ))}

          {/* Add slot button */}
          <Button variant="outline" onClick={handleAddSlot} className="w-full">
            添加孔位
          </Button>
        </div>
      </div>

      {/* Charm value assessment */}
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

      {/* Action buttons */}
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
