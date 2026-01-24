/**
 * @fileoverview A presentational component for the charm form.
 * It receives all state and handlers as props and is only responsible for rendering the UI.
 */

import { SkillEditor, SlotEditor } from "@/components/entities/";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  RARITY_MAX,
  RARITY_MIN,
  type EquivalentSlots,
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
        <SkillEditor
          skills={selectedSkills}
          onAdd={handleAddSkill}
          onRemove={handleRemoveSkill}
          maxSkills={3}
        />

        {/* Slot selection */}
        <SlotEditor
          slots={slots}
          onAdd={handleAddSlot}
          onUpdate={handleUpdateSlot}
          onRemove={handleRemoveSlot}
          maxSlots={3}
        />
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