/**
 * @fileoverview Form component for creating and editing armor pieces.
 */

import { useState } from "react";

import { SkillEditor, SlotEditor } from "@/components/entities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  ARMOR_TYPES,
  RARITY_MAX,
  RARITY_MIN,
  type Armor,
  type ArmorType,
  type Resistance,
  type SkillWithLevel,
  type Slot,
} from "@/types";

interface ArmorFormProps {
  armor?: Armor;
  onClose: () => void;
  onSubmit: (armor: Omit<Armor, "id">) => void;
  error?: string | null;
}

/**
 * Form content for creating and editing armor pieces.
 */
export function ArmorForm({ armor, onClose, onSubmit, error }: ArmorFormProps) {
  const [name, setName] = useState(armor?.name ?? "");
  const [type, setType] = useState<ArmorType>(armor?.type ?? "helm");
  const [rarity, setRarity] = useState(armor?.rarity ?? 1);
  const [defense, setDefense] = useState(armor?.defense ?? 0);
  const [resistance, setResistance] = useState<Resistance>(
    armor?.resistance ?? [0, 0, 0, 0, 0],
  );
  const [series, setSeries] = useState(armor?.series ?? "");
  const [skills, setSkills] = useState<SkillWithLevel[]>(armor?.skills ?? []);
  const [slots, setSlots] = useState<Slot[]>(armor?.slots ?? []);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleResistanceChange = (index: number, value: string) => {
    const newResistance = [...resistance] as Resistance;
    newResistance[index] = parseInt(value, 10) || 0;
    setResistance(newResistance);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setLocalError("名称为必填项。");
      return;
    }
    setLocalError(null);

    onSubmit({
      name: trimmedName,
      type,
      rarity,
      defense,
      resistance,
      series: series.trim(),
      skills,
      slots,
      description: "自定义条目", // Add default value
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">名称</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="输入防具名称"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">类型</Label>
        <Select value={type} onValueChange={(v) => setType(v as ArmorType)}>
          <SelectTrigger id="type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ARMOR_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
            onValueChange={(vals) => setRarity(vals[0])}
            min={RARITY_MIN}
            max={RARITY_MAX}
            step={1}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="defense">防御</Label>
        <Input
          id="defense"
          type="number"
          value={defense}
          onChange={(e) => setDefense(parseInt(e.target.value, 10))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>抗性（火、水、冰、雷、龙）</Label>
        <div className="grid grid-cols-5 gap-2">
          {resistance.map((res, index) => (
            <Input
              key={index}
              type="number"
              value={res}
              onChange={(e) => handleResistanceChange(index, e.target.value)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="series">系列</Label>
        <Input
          id="series"
          value={series}
          onChange={(e) => setSeries(e.target.value)}
          placeholder="输入防具系列"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SkillEditor
          skills={skills}
          onAdd={(skill) => setSkills((prev) => [...prev, skill])}
          onRemove={(skillId) =>
            setSkills((prev) => prev.filter((s) => s.skillId !== skillId))
          }
        />
        <SlotEditor
          slots={slots}
          onAdd={() =>
            setSlots((prev) => [
              ...prev,
              {
                type: "armor",
                level: 1,
              },
            ])
          }
          onUpdate={(index, type, level) => {
            const newSlots = [...slots];
            newSlots[index] = { ...newSlots[index], type, level };
            setSlots(newSlots);
          }}
          onRemove={(index) =>
            setSlots((prev) => prev.filter((_, i) => i !== index))
          }
        />
      </div>

      {(localError ?? error) && (
        <p className="text-destructive text-sm">{localError ?? error}</p>
      )}

      <DialogFooter className="mt-4 border-t pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button type="submit">{armor ? "保存" : "创建"}</Button>
      </DialogFooter>
    </form>
  );
}
